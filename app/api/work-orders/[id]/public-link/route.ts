import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// POST - Generar o regenerar token público
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la orden existe
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }

    // Generar token único
    const publicToken = randomBytes(32).toString('hex');

    // Actualizar orden con el token
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: { publicToken },
    });

    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/public/work-orders/${publicToken}`;

    return NextResponse.json({
      publicToken,
      publicUrl,
    });
  } catch (error) {
    console.error('Error al generar enlace público:', error);
    return NextResponse.json(
      { error: 'Error al generar enlace público' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar token público (desactivar enlace)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.workOrder.update({
      where: { id: params.id },
      data: { publicToken: null },
    });

    return NextResponse.json({ message: 'Enlace público desactivado' });
  } catch (error) {
    console.error('Error al desactivar enlace público:', error);
    return NextResponse.json(
      { error: 'Error al desactivar enlace público' },
      { status: 500 }
    );
  }
}
