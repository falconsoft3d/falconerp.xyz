import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const publicQuoteSchema = z.object({
  companyId: z.string(),
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().optional(),
  }),
  items: z.array(z.object({
    productId: z.string(),
    description: z.string(),
    quantity: z.number().positive(),
    price: z.number(),
    tax: z.number().min(0).max(100),
  })).min(1),
  currency: z.string().default('EUR'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = publicQuoteSchema.parse(body);

    // Verificar que la empresa existe
    const company = await prisma.company.findUnique({
      where: { id: validatedData.companyId },
      select: {
        id: true,
        userId: true,
        quotePrefix: true,
        quoteNextNumber: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Buscar si el contacto ya existe por email o teléfono
    let contact = await prisma.contact.findFirst({
      where: {
        companyId: validatedData.companyId,
        OR: [
          { email: validatedData.contact.email },
          { phone: validatedData.contact.phone },
        ],
      },
    });

    // Si no existe, crear el contacto
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          userId: company.userId,
          companyId: validatedData.companyId,
          name: validatedData.contact.name,
          email: validatedData.contact.email,
          phone: validatedData.contact.phone,
          address: validatedData.contact.address || null,
          isCustomer: true,
          isSupplier: false,
        },
      });
    } else {
      // Si existe, actualizar sus datos
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          name: validatedData.contact.name,
          email: validatedData.contact.email,
          phone: validatedData.contact.phone,
          address: validatedData.contact.address || contact.address,
        },
      });
    }

    // Generar número de cotización
    const currentYear = new Date().getFullYear();
    const quoteNumber = `${company.quotePrefix || 'COT'}-${currentYear}-${String(company.quoteNextNumber || 1).padStart(3, '0')}`;

    // Calcular totales
    const itemsWithTotals = validatedData.items.map(item => {
      const subtotal = item.quantity * item.price;
      const taxAmount = subtotal * (item.tax / 100);
      const total = subtotal + taxAmount;
      
      return {
        ...item,
        subtotal,
        taxAmount,
        total,
      };
    });

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = itemsWithTotals.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);

    // Crear la cotización
    const quote = await prisma.quote.create({
      data: {
        userId: company.userId,
        companyId: validatedData.companyId,
        contactId: contact.id,
        number: quoteNumber,
        date: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        currency: validatedData.currency,
        subtotal,
        taxAmount,
        total,
        status: 'QUOTE',
        notes: 'Cotización generada desde enlace público',
        items: {
          create: itemsWithTotals.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax,
            subtotal: item.subtotal,
            taxAmount: item.taxAmount,
            total: item.total,
          })),
        },
      },
      include: {
        contact: true,
        items: true,
      },
    });

    // Incrementar el contador de cotizaciones
    await prisma.company.update({
      where: { id: validatedData.companyId },
      data: {
        quoteNextNumber: (company.quoteNextNumber || 1) + 1,
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error creating public quote:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear la cotización' },
      { status: 500 }
    );
  }
}
