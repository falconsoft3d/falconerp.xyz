import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener orden de trabajo por token público (sin autenticación)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { 
        publicToken: params.token,
        active: true,
      },
      include: {
        company: {
          select: {
            name: true,
            logo: true,
          },
        },
        responsible: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                code: true,
                name: true,
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
        { error: 'Orden de trabajo no encontrada o enlace inválido' },
        { status: 404 }
      );
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error al obtener orden de trabajo pública:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden de trabajo' },
      { status: 500 }
    );
  }
}
