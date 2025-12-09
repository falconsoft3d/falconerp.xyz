import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para clientes
const customerSchema = z.object({
  companyId: z.string(),
  name: z.string().min(1, 'El nombre es requerido'),
  nif: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  country: z.string().optional().default(''),
  active: z.boolean().optional().default(true),
});

// GET - Listar clientes
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID es requerido' },
        { status: 400 }
      );
    }

    const customers = await prisma.contact.findMany({
      where: {
        userId: user.userId,
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

// POST - Crear cliente
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Filtrar campos vacíos y convertirlos a null
    const cleanData: any = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const customer = await prisma.contact.create({
      data: {
        userId: user.userId,
        companyId: cleanData.companyId,
        name: cleanData.name,
        nif: cleanData.nif,
        email: cleanData.email,
        phone: cleanData.phone,
        address: cleanData.address,
        city: cleanData.city,
        postalCode: cleanData.postalCode,
        country: cleanData.country,
        active: cleanData.active,
        isCustomer: true,
        isSupplier: false,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
