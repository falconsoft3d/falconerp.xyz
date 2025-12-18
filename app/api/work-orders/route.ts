import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const workOrderSchema = z.object({
  companyId: z.string(),
  scheduledDate: z.string(),
  approvedByClient: z.boolean().optional().default(false),
  responsibleId: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    description: z.string(),
    quantity: z.number().positive(),
  })).min(1, 'Debe agregar al menos un trabajo'),
});

// GET - Listar órdenes de trabajo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID es requerido' },
        { status: 400 }
      );
    }

    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const workOrders = await prisma.workOrder.findMany({
      where: {
        userId: effectiveUserId,
        companyId,
        active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responsible: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                price: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error('Error al obtener órdenes de trabajo:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Error al obtener órdenes de trabajo',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear orden de trabajo
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    
    console.log('Datos recibidos en POST:', body);
    
    const validatedData = workOrderSchema.parse(body);

    // Obtener el siguiente número de OT para esta empresa
    const company = await prisma.company.findUnique({
      where: { id: validatedData.companyId },
      select: { id: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Contar órdenes de trabajo existentes para generar el número
    const count = await prisma.workOrder.count({
      where: { companyId: validatedData.companyId },
    });

    const year = new Date().getFullYear();
    const number = `OT-${year}-${String(count + 1).padStart(3, '0')}`;

    // Crear la orden de trabajo con sus items
    const workOrder = await prisma.workOrder.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        number,
        scheduledDate: new Date(validatedData.scheduledDate),
        approvedByClient: validatedData.approvedByClient,
        responsibleId: validatedData.responsibleId,
        notes: validatedData.notes || null,
        items: {
          create: validatedData.items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        responsible: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al crear orden de trabajo:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Error al crear orden de trabajo',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
