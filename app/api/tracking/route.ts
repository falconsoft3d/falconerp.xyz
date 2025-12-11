import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { z } from 'zod';

// Schema de validación para crear seguimiento
const createTrackingSchema = z.object({
  companyId: z.string(),
  contactId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  trackingNumber: z.string().min(1, 'El número de seguimiento es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  status: z.enum(['REQUESTED', 'RECEIVED', 'PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED']).default('REQUESTED'),
  origin: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET - Listar todos los seguimientos
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Usuario no identificado' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'El ID de la empresa es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tenga acceso a la empresa
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Construir filtros
    const where: any = { companyId, userId };
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;

    // Obtener seguimientos con relaciones
    const trackings = await prisma.tracking.findMany({
      where,
      select: {
        id: true,
        trackingNumber: true,
        description: true,
        status: true,
        publicToken: true,
        carrier: true,
        origin: true,
        destination: true,
        weight: true,
        requestedDate: true,
        receivedDate: true,
        paidDate: true,
        shippedDate: true,
        inTransitDate: true,
        deliveredDate: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        invoice: {
          select: {
            id: true,
            number: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(trackings);
  } catch (error) {
    console.error('Error al obtener seguimientos:', error);
    return NextResponse.json(
      { error: 'Error al obtener seguimientos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo seguimiento
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Usuario no identificado' },
        { status: 401 }
      );
    }

    const userId = payload.userId;

    const body = await request.json();
    const validatedData = createTrackingSchema.parse(body);

    // Verificar que el usuario tenga acceso a la empresa
    const company = await prisma.company.findFirst({
      where: { id: validatedData.companyId, userId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Si se proporciona contactId, verificar que existe y pertenece a la empresa
    if (validatedData.contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: validatedData.contactId,
          companyId: validatedData.companyId,
          userId,
        },
      });

      if (!contact) {
        return NextResponse.json(
          { error: 'Contacto no encontrado' },
          { status: 404 }
        );
      }
    }

    // Crear el registro de seguimiento
    const tracking = await prisma.tracking.create({
      data: {
        userId,
        companyId: validatedData.companyId,
        contactId: validatedData.contactId || null,
        productId: validatedData.productId || null,
        trackingNumber: validatedData.trackingNumber,
        description: validatedData.description,
        status: validatedData.status,
        origin: validatedData.origin || null,
        destination: validatedData.destination || null,
        carrier: validatedData.carrier || null,
        weight: validatedData.weight || null,
        notes: validatedData.notes || null,
        requestedDate: new Date(),
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(tracking, { status: 201 });
  } catch (error) {
    console.error('Error al crear seguimiento:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear seguimiento' },
      { status: 500 }
    );
  }
}
