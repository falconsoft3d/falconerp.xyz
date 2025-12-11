import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Usuario no identificado' },
        { status: 401 }
      );
    }

    const userId = payload.userId;
    const trackingId = params.id;

    // Obtener el seguimiento con todas sus relaciones
    const tracking = await prisma.tracking.findFirst({
      where: {
        id: trackingId,
        userId,
      },
      include: {
        contact: true,
        product: true,
        company: true,
      },
    });

    if (!tracking) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      );
    }

    // Validaciones
    if (!tracking.contactId) {
      return NextResponse.json(
        { error: 'El seguimiento debe tener un contacto asignado' },
        { status: 400 }
      );
    }

    if (!tracking.productId) {
      return NextResponse.json(
        { error: 'El seguimiento debe tener un producto asignado' },
        { status: 400 }
      );
    }

    if (!tracking.weight) {
      return NextResponse.json(
        { error: 'El seguimiento debe tener un peso definido' },
        { status: 400 }
      );
    }

    // Calcular el total: precio del producto * peso
    const quantity = tracking.weight;
    const unitPrice = tracking.product!.price;
    const subtotal = unitPrice * quantity;
    const taxRate = tracking.product!.tax;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Generar número de factura
    const company = await prisma.company.findUnique({
      where: { id: tracking.companyId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    const invoiceNumber = `${company.salesInvoicePrefix}${company.salesInvoiceNextNumber.toString().padStart(4, '0')}`;

    // Crear la factura
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        companyId: tracking.companyId,
        contactId: tracking.contactId,
        number: invoiceNumber,
        type: 'SALE',
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        subtotal,
        taxAmount,
        total,
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        notes: `Factura generada automáticamente desde seguimiento ${tracking.trackingNumber}`,
        items: {
          create: [
            {
              productId: tracking.productId,
              description: `${tracking.product!.name} - Seguimiento ${tracking.trackingNumber}`,
              quantity,
              price: unitPrice,
              tax: taxRate,
              subtotal: subtotal,
              taxAmount: taxAmount,
              total: subtotal + taxAmount,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        contact: true,
      },
    });

    // Actualizar el siguiente número de factura
    await prisma.company.update({
      where: { id: tracking.companyId },
      data: {
        salesInvoiceNextNumber: company.salesInvoiceNextNumber + 1,
      },
    });

    // Vincular la factura al tracking
    await prisma.tracking.update({
      where: { id: trackingId },
      data: {
        invoiceId: invoice.id,
      },
    });

    return NextResponse.json({
      success: true,
      invoice,
      message: `Factura ${invoiceNumber} creada exitosamente`,
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear factura desde seguimiento:', error);
    return NextResponse.json(
      { error: 'Error al crear la factura' },
      { status: 500 }
    );
  }
}
