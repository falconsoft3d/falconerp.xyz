import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { z } from 'zod';

const updateQuoteSchema = z.object({
  status: z.enum(['QUOTE', 'ORDER']).optional(),
  notes: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const quote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        contact: true,
        company: true,
        items: {
          include: {
            product: true,
            project: true,
          },
        },
        invoice: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateQuoteSchema.parse(body);

    // Verificar que la cotización existe y pertenece al usuario
    const existingQuote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    });

    if (!existingQuote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    const updateData: {
      status?: 'QUOTE' | 'ORDER';
      notes?: string | null;
      expiryDate?: Date | null;
    } = {};
    
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    if (validatedData.expiryDate !== undefined) {
      updateData.expiryDate = validatedData.expiryDate ? new Date(validatedData.expiryDate) : null;
    }

    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contact: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error updating quote:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que la cotización existe y pertenece al usuario
    const quote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    await prisma.quote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Cotización eliminada' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cotización' },
      { status: 500 }
    );
  }
}
