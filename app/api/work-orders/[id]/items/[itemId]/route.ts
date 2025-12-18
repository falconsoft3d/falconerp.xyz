import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// PUT - Actualizar estado de una línea
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; // 'start' o 'complete'

    // Verificar que la línea existe
    const item = await prisma.workOrderItem.findUnique({
      where: { id: params.itemId },
      include: {
        workOrder: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Línea no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar según la acción
    let updateData: any = {};
    
    if (action === 'start') {
      updateData = {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      };
    } else if (action === 'complete') {
      updateData = {
        status: 'COMPLETED',
        completedAt: new Date(),
      };
    } else if (action === 'reset') {
      updateData = {
        status: 'PENDING',
        startedAt: null,
        completedAt: null,
      };
    } else {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.workOrderItem.update({
      where: { id: params.itemId },
      data: updateData,
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
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error al actualizar línea:', error);
    return NextResponse.json(
      { error: 'Error al actualizar línea' },
      { status: 500 }
    );
  }
}
