import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener presupuesto por token público (sin autenticación)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const quote = await prisma.quote.findUnique({
      where: { 
        publicToken: params.token,
      },
      include: {
        company: {
          select: {
            name: true,
            nif: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
            phone: true,
            email: true,
            logo: true,
          },
        },
        contact: {
          select: {
            name: true,
            email: true,
            phone: true,
            nif: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                code: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado o enlace inválido' },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error al obtener presupuesto público:', error);
    return NextResponse.json(
      { error: 'Error al obtener presupuesto' },
      { status: 500 }
    );
  }
}
