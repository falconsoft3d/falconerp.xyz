import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la cotización con todos sus detalles
    const quote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        items: true,
        company: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Verificar si ya se generó una factura para esta cotización
    if (quote.invoiceId) {
      return NextResponse.json(
        { error: 'Esta cotización ya tiene una factura asociada' },
        { status: 400 }
      );
    }

    // Generar número de factura
    const invoiceNumber = `${quote.company.salesInvoicePrefix}-${new Date().getFullYear()}-${String(quote.company.salesInvoiceNextNumber).padStart(3, '0')}`;

    // Crear factura basada en la cotización
    const invoice = await prisma.invoice.create({
      data: {
        userId: payload.userId,
        companyId: quote.companyId,
        contactId: quote.contactId,
        type: 'SALE',
        number: invoiceNumber,
        date: new Date(),
        currency: quote.currency,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        total: quote.total,
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        notes: quote.notes,
        items: {
          create: quote.items.map(item => ({
            productId: item.productId,
            projectId: item.projectId,
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Actualizar la cotización con el ID de la factura y cambiar estado a ORDER
    await prisma.quote.update({
      where: { id: params.id },
      data: {
        invoiceId: invoice.id,
        status: 'ORDER',
      },
    });

    // Actualizar contador de facturas
    await prisma.company.update({
      where: { id: quote.companyId },
      data: { salesInvoiceNextNumber: quote.company.salesInvoiceNextNumber + 1 },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    return NextResponse.json(
      { error: 'Error al convertir cotización a factura' },
      { status: 500 }
    );
  }
}
