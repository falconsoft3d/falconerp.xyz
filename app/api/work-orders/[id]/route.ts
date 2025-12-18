import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const workOrderSchema = z.object({
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

// GET - Obtener orden de trabajo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error al obtener orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden de trabajo' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar orden de trabajo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    const validatedData = workOrderSchema.parse(body);

    // Verificar que la orden existe y pertenece al usuario
    const existingWorkOrder = await prisma.workOrder.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
    });

    if (!existingWorkOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar items anteriores y crear los nuevos
    await prisma.workOrderItem.deleteMany({
      where: { workOrderId: params.id },
    });

    const workOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: {
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return NextResponse.json(workOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al actualizar orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de trabajo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar orden de trabajo (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    // Verificar que la orden existe y pertenece al usuario
    const existingWorkOrder = await prisma.workOrder.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
    });

    if (!existingWorkOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.workOrder.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Orden de trabajo eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar orden de trabajo' },
      { status: 500 }
    );
  }
}
