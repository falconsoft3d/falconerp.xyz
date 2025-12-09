import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener empresa activa
    const activeCompany = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
    });

    if (!activeCompany) {
      return NextResponse.json({ error: 'No hay empresa activa' }, { status: 400 });
    }

    const contacts = await prisma.contact.findMany({
      where: {
        userId: payload.userId,
        companyId: activeCompany.id,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Error al obtener contactos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener empresa activa
    const activeCompany = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
    });

    if (!activeCompany) {
      return NextResponse.json({ error: 'No hay empresa activa' }, { status: 400 });
    }

    const body = await request.json();
    const { name, nif, email, phone, address, city, postalCode, country, isCustomer, isSupplier } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        userId: payload.userId,
        companyId: activeCompany.id,
        name,
        nif,
        email,
        phone,
        address,
        city,
        postalCode,
        country: country || 'España',
        isCustomer: isCustomer !== undefined ? isCustomer : true,
        isSupplier: isSupplier !== undefined ? isSupplier : true,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 });
  }
}
