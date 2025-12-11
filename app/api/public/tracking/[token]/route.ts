import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const tracking = await prisma.tracking.findUnique({
      where: {
        publicToken: params.token,
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
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            primaryColor: true,
            secondaryColor: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            country: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    console.error('Error al obtener seguimiento público:', error);
    return NextResponse.json(
      { error: 'Error al obtener seguimiento' },
      { status: 500 }
    );
  }
}
