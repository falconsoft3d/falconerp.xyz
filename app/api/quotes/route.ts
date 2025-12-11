import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { z } from 'zod';

const quoteSchema = z.object({
  contactId: z.string(),
  companyId: z.string(),
  date: z.string(),
  expiryDate: z.string().optional().nullable(),
  currency: z.string().default('EUR'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    projectId: z.string().optional(),
    description: z.string(),
    quantity: z.number().positive(),
    price: z.number(),
    tax: z.number().min(0).max(100),
  })).min(1),
});

export async function GET(request: Request) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId es requerido' }, { status: 400 });
    }

    const where: {
      userId: string;
      companyId: string;
      status?: 'QUOTE' | 'ORDER';
    } = {
      userId: payload.userId,
      companyId,
    };

    if (status && (status === 'QUOTE' || status === 'ORDER')) {
      where.status = status;
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            nif: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = quoteSchema.parse(body);

    // Obtener la empresa para generar el número de cotización
    const company = await prisma.company.findUnique({
      where: { id: validatedData.companyId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Calcular totales
    let subtotal = 0;
    let taxAmount = 0;

    const items = validatedData.items.map(item => {
      const itemSubtotal = item.quantity * item.price;
      const itemTaxAmount = itemSubtotal * (item.tax / 100);
      const itemTotal = itemSubtotal + itemTaxAmount;

      subtotal += itemSubtotal;
      taxAmount += itemTaxAmount;

      return {
        productId: item.productId || null,
        projectId: item.projectId || null,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        tax: item.tax,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        total: itemTotal,
      };
    });

    const total = subtotal + taxAmount;

    // Generar número de cotización
    const quoteNumber = `${company.quotePrefix}-${new Date().getFullYear()}-${String(company.quoteNextNumber).padStart(3, '0')}`;

    // Crear cotización con items
    const quote = await prisma.quote.create({
      data: {
        userId: payload.userId,
        companyId: validatedData.companyId,
        contactId: validatedData.contactId,
        number: quoteNumber,
        date: new Date(validatedData.date),
        expiryDate: validatedData.expiryDate ? new Date(validatedData.expiryDate) : null,
        currency: validatedData.currency,
        subtotal,
        taxAmount,
        total,
        status: 'QUOTE',
        notes: validatedData.notes || null,
        items: {
          create: items,
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            nif: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    // Actualizar el contador de cotizaciones
    await prisma.company.update({
      where: { id: validatedData.companyId },
      data: { quoteNextNumber: company.quoteNextNumber + 1 },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error al crear cotización' },
      { status: 500 }
    );
  }
}
