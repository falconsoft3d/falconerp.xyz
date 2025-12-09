import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ error: 'Error al obtener contacto' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, nif, email, phone, address, city, postalCode, country, isCustomer, isSupplier } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const contact = await prisma.contact.updateMany({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      data: {
        name,
        nif,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
        isCustomer: isCustomer !== undefined ? isCustomer : true,
        isSupplier: isSupplier !== undefined ? isSupplier : true,
      },
    });

    if (contact.count === 0) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contacto actualizado' });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Error al actualizar contacto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const contact = await prisma.contact.deleteMany({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    });

    if (contact.count === 0) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contacto eliminado' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Error al eliminar contacto' }, { status: 500 });
  }
}
