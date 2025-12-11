import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { z } from 'zod';

// Schema de validación para actualizar seguimiento
const updateTrackingSchema = z.object({
  trackingNumber: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['REQUESTED', 'RECEIVED', 'PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED']).optional(),
  origin: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  weight: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
});

// GET - Obtener un seguimiento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tracking = await prisma.tracking.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            price: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        invoice: {
          select: {
            id: true,
            number: true,
          },
        },
      },
    });

    if (!tracking) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(tracking);
  } catch (error) {
    console.error('Error al obtener seguimiento:', error);
    return NextResponse.json(
      { error: 'Error al obtener seguimiento' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un seguimiento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = verifyToken(token) as any;
    const userId = payload.userId;

    // Verificar que el seguimiento existe y pertenece al usuario
    const existingTracking = await prisma.tracking.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!existingTracking) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateTrackingSchema.parse(body);

    // Si se proporciona contactId, verificar que existe y pertenece a la empresa
    if (validatedData.contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: validatedData.contactId,
          companyId: existingTracking.companyId,
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

    // Si se proporciona productId, verificar que existe y pertenece a la empresa
    if (validatedData.productId) {
      const product = await prisma.product.findFirst({
        where: {
          id: validatedData.productId,
          companyId: existingTracking.companyId,
          userId,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (validatedData.trackingNumber !== undefined) updateData.trackingNumber = validatedData.trackingNumber;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.origin !== undefined) updateData.origin = validatedData.origin;
    if (validatedData.destination !== undefined) updateData.destination = validatedData.destination;
    if (validatedData.carrier !== undefined) updateData.carrier = validatedData.carrier;
    if (validatedData.weight !== undefined) updateData.weight = validatedData.weight;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.contactId !== undefined) updateData.contactId = validatedData.contactId;
    if (validatedData.productId !== undefined) updateData.productId = validatedData.productId;

    // Manejo especial para cambios de estado (actualizar fecha correspondiente)
    if (validatedData.status !== undefined && validatedData.status !== existingTracking.status) {
      updateData.status = validatedData.status;
      
      const now = new Date();
      switch (validatedData.status) {
        case 'REQUESTED':
          updateData.requestedDate = now;
          break;
        case 'RECEIVED':
          updateData.receivedDate = now;
          break;
        case 'PAID':
          updateData.paidDate = now;
          break;
        case 'SHIPPED':
          updateData.shippedDate = now;
          break;
        case 'IN_TRANSIT':
          updateData.inTransitDate = now;
          break;
        case 'DELIVERED':
          updateData.deliveredDate = now;
          break;
      }
    }

    // Actualizar el seguimiento
    const tracking = await prisma.tracking.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json(tracking);
  } catch (error) {
    console.error('Error al actualizar seguimiento:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar seguimiento' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un seguimiento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = verifyToken(token) as any;
    const userId = payload.userId;

    // Verificar que el seguimiento existe y pertenece al usuario
    const tracking = await prisma.tracking.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!tracking) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el seguimiento
    await prisma.tracking.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Seguimiento eliminado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar seguimiento:', error);
    return NextResponse.json(
      { error: 'Error al eliminar seguimiento' },
      { status: 500 }
    );
  }
}
