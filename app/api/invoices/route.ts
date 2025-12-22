import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';
import { createOdooInvoice } from '@/lib/odoo-invoice';

// Schema de validación para items de factura
const invoiceItemSchema = z.object({
  productId: z.string().nullish().transform(val => val || null),
  projectId: z.string().nullish().transform(val => val || null),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  tax: z.number().min(0).max(100).default(21),
});

// Schema de validación para facturas
const invoiceSchema = z.object({
  type: z.enum(['invoice_out', 'refund_out', 'invoice_in', 'refund_in']).default('invoice_out'),
  companyId: z.string(),
  contactId: z.string(),
  supplierReference: z.string().nullish().transform(val => val || null),
  number: z.string().optional(),
  date: z.string().optional(),
  dueDate: z.string().nullish(),
  currency: z.string().default('EUR'),
  status: z.enum(['DRAFT', 'VALIDATED']).default('DRAFT'),
  paymentStatus: z.enum(['UNPAID', 'PAID']).default('UNPAID'),
  notes: z.string().nullish().transform(val => val || ''),
  items: z.array(invoiceItemSchema).min(1, 'Debe incluir al menos un item'),
});

// GET - Listar facturas
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type') as 'invoice_out' | 'refund_out' | 'invoice_in' | 'refund_in' | null;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID es requerido' },
        { status: 400 }
      );
    }

    const whereClause: any = {
      userId: effectiveUserId,
      companyId,
    };

    if (type) {
      whereClause.type = type;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            nif: true,
            email: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}

// POST - Crear factura
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // Verificar que el contacto sea cliente o proveedor según el tipo
    const contact = await prisma.contact.findUnique({
      where: { id: validatedData.contactId },
    });

    const invoiceType = validatedData.type || 'invoice_out';

    if (!contact) {
      return NextResponse.json(
        { error: 'Contacto no encontrado' },
        { status: 400 }
      );
    }

    if ((invoiceType === 'invoice_out' || invoiceType === 'refund_out') && !contact.isCustomer) {
      return NextResponse.json(
        { error: 'El contacto debe ser un cliente para facturas de venta' },
        { status: 400 }
      );
    }

    if ((invoiceType === 'invoice_in' || invoiceType === 'refund_in') && !contact.isSupplier) {
      return NextResponse.json(
        { error: 'El contacto debe ser un proveedor para facturas de compra' },
        { status: 400 }
      );
    }

    // Obtener prefijos y próximos números configurados de la empresa
    const company = await prisma.company.findUnique({
      where: { id: validatedData.companyId },
      select: {
        salesInvoicePrefix: true,
        salesInvoiceNextNumber: true,
        purchaseInvoicePrefix: true,
        purchaseInvoiceNextNumber: true,
      },
    });

    const prefix = (invoiceType === 'invoice_out' || invoiceType === 'refund_out') 
      ? (company?.salesInvoicePrefix || 'INV')
      : (company?.purchaseInvoicePrefix || 'INVO');

    const nextNumber = (invoiceType === 'invoice_out' || invoiceType === 'refund_out')
      ? (company?.salesInvoiceNextNumber || 1)
      : (company?.purchaseInvoiceNextNumber || 1);

    // Generar número de factura si no se proporciona
    let invoiceNumber = validatedData.number;
    if (!invoiceNumber) {
      invoiceNumber = `${prefix}-${String(nextNumber).padStart(4, '0')}`;
    }

    // Verificar que el número de factura no exista en la empresa
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        companyId_number: {
          companyId: validatedData.companyId,
          number: invoiceNumber,
        },
      },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: 'Ya existe una factura con ese número en esta empresa' },
        { status: 400 }
      );
    }

    // Calcular totales
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

    // Usar transacción para crear factura, actualizar stock e incrementar nextNumber
    const invoice = await prisma.$transaction(async (tx) => {
      // Crear factura con sus items
      const newInvoice = await tx.invoice.create({
        data: {
          type: invoiceType,
          userId: effectiveUserId,
          companyId: validatedData.companyId,
          contactId: validatedData.contactId,
          supplierReference: validatedData.supplierReference || null,
          number: invoiceNumber,
          date: validatedData.date ? new Date(validatedData.date) : new Date(),
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
          currency: validatedData.currency,
          status: validatedData.status,
          paymentStatus: validatedData.paymentStatus,
          notes: validatedData.notes || '',
          subtotal,
          taxAmount,
          total,
          items: {
            create: processedItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          contact: true,
          company: true,
        },
      });

      // Actualizar stock de productos si aplica
      // Para ventas: disminuir stock
      // Para compras: aumentar stock
      for (const item of validatedData.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                [(invoiceType === 'invoice_out' || invoiceType === 'refund_out') ? 'decrement' : 'increment']: item.quantity,
              },
            },
          });
        }
      }

      // Incrementar el nextNumber correspondiente en la empresa
      await tx.company.update({
        where: { id: validatedData.companyId },
        data: {
          [(invoiceType === 'invoice_out' || invoiceType === 'refund_out') ? 'salesInvoiceNextNumber' : 'purchaseInvoiceNextNumber']: {
            increment: 1,
          },
        },
      });

      return newInvoice;
    });

    // Crear factura en Odoo si está habilitado y es una venta
    if (invoiceType === 'invoice_out' || invoiceType === 'refund_out') {
      try {
        // TODO: Descomentar después de ejecutar la migración para odooCreateInvoiceOnSale
        /* 
        const company = await prisma.company.findUnique({
          where: { id: validatedData.companyId },
          select: {
            odooEnabled: true,
            odooCreateInvoiceOnSale: true,
            odooUrl: true,
            odooDb: true,
            odooUsername: true,
            odooPassword: true,
            odooPort: true,
          },
        });

        if (company?.odooEnabled && company?.odooCreateInvoiceOnSale && 
            company.odooUrl && company.odooDb && company.odooUsername && company.odooPassword) {
          
          console.log('🔄 Creando factura en Odoo...');
          
          // Obtener productos completos para enviar a Odoo
          const productsIds = validatedData.items.filter(i => i.productId).map(i => i.productId);
          const products = await prisma.product.findMany({
            where: { id: { in: productsIds as string[] } },
          });

          const odooInvoiceId = await createOdooInvoice(
            {
              odooUrl: company.odooUrl,
              odooDb: company.odooDb,
              odooUsername: company.odooUsername,
              odooPassword: company.odooPassword,
              odooPort: company.odooPort,
            },
            {
              contactId: validatedData.contactId,
              date: validatedData.date || new Date().toISOString(),
              currency: validatedData.currency,
              items: validatedData.items,
            },
            invoice.contact,
            products
          );

          console.log(`✅ Factura creada en Odoo con ID: ${odooInvoiceId}`);
        }
        */
      } catch (odooError) {
        // No fallar la creación de factura si Odoo falla
        console.error('⚠️ Error creando factura en Odoo (continuando):', odooError);
      }
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al crear factura:', error);
    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    );
  }
}
