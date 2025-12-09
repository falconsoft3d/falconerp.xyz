import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para actualizar cliente
const updateCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  nif: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  active: z.boolean().optional(),
});

// GET - Obtener un cliente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const customer = await prisma.contact.findUnique({
      where: {
        id: params.id,
        userId: user.userId,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        invoices: {
          take: 10,
          orderBy: {
            date: 'desc',
          },
          select: {
            id: true,
            number: true,
            date: true,
            total: true,
            status: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    // Verificar que el cliente existe y pertenece al usuario
    const existingCustomer = await prisma.contact.findUnique({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const customer = await prisma.contact.update({
      where: {
        id: params.id,
      },
      data: validatedData,
    });

    return NextResponse.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al actualizar cliente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el cliente existe y pertenece al usuario
    const customer = await prisma.contact.findUnique({
      where: {
        id: params.id,
        userId: user.userId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el cliente tiene facturas
    const invoiceCount = await prisma.invoice.count({
      where: {
        contactId: params.id,
      },
    });

    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el cliente porque tiene facturas asociadas' },
        { status: 400 }
      );
    }

    await prisma.contact.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
