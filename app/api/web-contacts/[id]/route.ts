import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { verifyToken } from '@/lib/jwt';

const updateContactSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'CLOSED']).optional(),
  notes: z.string().optional(),
});

// GET - Obtener un contacto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
      await verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contact = await prisma.webContact.findUnique({
      where: { id: params.id },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contacto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error al obtener contacto:', error);
    return NextResponse.json(
      { error: 'Error al obtener contacto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar contacto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
      await verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateContactSchema.parse(body);

    const contact = await prisma.webContact.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error al actualizar contacto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar contacto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar contacto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
      await verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.webContact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Contacto eliminado' });
  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar contacto' },
      { status: 500 }
    );
  }
}
