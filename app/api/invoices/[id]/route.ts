import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getEffectiveUserId } from '@/lib/user-helpers';

// Schema de validación para items de factura
const invoiceItemSchema = z.object({
  productId: z.string().nullish().transform(val => val || null),
  projectId: z.string().nullish().transform(val => val || null),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  tax: z.number().min(0).max(100).default(21),
});

// Schema de validación para actualizar factura
const updateInvoiceSchema = z.object({
  number: z.string().optional(),
  contactId: z.string().optional(),
  date: z.string().optional(),
  dueDate: z.string().nullish(),
  currency: z.string().optional(),
  status: z.enum(['DRAFT', 'VALIDATED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID']).optional(),
  notes: z.string().nullish(),
  items: z.array(invoiceItemSchema).optional(),
});

// GET - Obtener una factura
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
      include: {
        company: true,
        contact: true,
        items: {
          include: {
            product: {
              select: {
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
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return NextResponse.json(
      { error: 'Error al obtener factura' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar factura
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const body = await request.json();
    
    const validationResult = updateInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;

    // Verificar que la factura existe y pertenece al usuario
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
      include: {
        items: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (validatedData.number) {
      updateData.number = validatedData.number;
    }

    if (validatedData.contactId) {
      updateData.contactId = validatedData.contactId;
    }

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date);
    }

    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    if (validatedData.currency) {
      updateData.currency = validatedData.currency;
    }

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }

    if (validatedData.paymentStatus) {
      updateData.paymentStatus = validatedData.paymentStatus;
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    // Si se actualizan los items, recalcular totales
    if (validatedData.items) {
      // Restaurar stock de productos anteriores
      for (const oldItem of existingInvoice.items) {
        if (oldItem.productId) {
          await prisma.product.update({
            where: { id: oldItem.productId },
            data: {
              stock: {
                increment: oldItem.quantity,
              },
            },
          });
        }
      }

      // Eliminar items antiguos
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      });

      // Calcular nuevos totales
      let subtotal = 0;
      let taxAmount = 0;

      const processedItems = validatedData.items.map((item) => {
        const itemSubtotal = item.quantity * item.price;
        const itemTaxAmount = itemSubtotal * (item.tax / 100);
        const itemTotal = itemSubtotal + itemTaxAmount;

        subtotal += itemSubtotal;
        taxAmount += itemTaxAmount;

        return {
          ...item,
          subtotal: itemSubtotal,
          taxAmount: itemTaxAmount,
          total: itemTotal,
        };
      });

      const total = subtotal + taxAmount;

      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
      updateData.items = {
        create: processedItems,
      };

      // Actualizar stock de nuevos productos
      for (const item of validatedData.items) {
        if (item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }
    }

    const invoice = await prisma.invoice.update({
      where: {
        id: params.id,
      },
      data: updateData,
      include: {
        items: true,
        contact: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al actualizar factura:', error);
    return NextResponse.json(
      { error: 'Error al actualizar factura' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar factura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    // Verificar que la factura existe y pertenece al usuario
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Restaurar stock de productos
    for (const item of invoice.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // Eliminar factura (cascade eliminará los items)
    await prisma.invoice.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Factura eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    return NextResponse.json(
      { error: 'Error al eliminar factura' },
      { status: 500 }
    );
  }
}
