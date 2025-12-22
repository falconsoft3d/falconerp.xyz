import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import * as XLSX from 'xlsx';

interface ExcelRow {
  numero: string;
  fecha: string;
  cliente: string;
  producto: string;
  precio: number;
  cant: number;
  impuesto: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyId = formData.get('companyId') as string;
    const type = formData.get('type') as 'invoice_out' | 'refund_out' | 'invoice_in' | 'refund_in';

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'No se proporcionó companyId' }, { status: 400 });
    }

    // Verificar que la empresa pertenece al usuario
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: effectiveUserId,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    // Leer el archivo Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: [] as string[],
      total: data.length,
    };

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Validar datos requeridos
        if (!row.numero || !row.fecha || !row.cliente || !row.producto) {
          results.errors.push(`Fila ${i + 2}: Faltan campos requeridos`);
          continue;
        }

        // Buscar o crear contacto
        let contact = await prisma.contact.findFirst({
          where: {
            userId: effectiveUserId,
            companyId,
            name: row.cliente,
          },
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              userId: effectiveUserId,
              companyId,
              name: row.cliente,
              isCustomer: type === 'invoice_out' || type === 'refund_out',
              isSupplier: type === 'invoice_in' || type === 'refund_in',
            },
          });
        }

        // Buscar o crear producto
        let productId = null;
        if (row.producto) {
          let product = await prisma.product.findFirst({
            where: {
              userId: effectiveUserId,
              companyId,
              name: row.producto,
            },
          });

          // Si el producto no existe, lo creamos
          if (!product) {
            // Generar código automático para el producto
            const lastProduct = await prisma.product.findFirst({
              where: { companyId },
              orderBy: { createdAt: 'desc' },
            });
            const nextNumber = lastProduct ? parseInt(lastProduct.code.replace(/\D/g, '') || '0') + 1 : 1;
            const productCode = `PROD${String(nextNumber).padStart(4, '0')}`;

            product = await prisma.product.create({
              data: {
                userId: effectiveUserId,
                companyId,
                code: productCode,
                name: row.producto,
                type: 'service',
                price: row.precio || 0,
                tax: row.impuesto || 0,
                active: true,
              },
            });
          }

          productId = product.id;
        }

        // Calcular totales
        const quantity = row.cant || 1;
        const price = row.precio || 0;
        const tax = row.impuesto || 0;
        const subtotal = quantity * price;
        const taxAmount = subtotal * (tax / 100);
        const total = subtotal + taxAmount;

        // Verificar si ya existe la factura
        const existingInvoice = await prisma.invoice.findUnique({
          where: {
            companyId_number: {
              companyId,
              number: row.numero,
            },
          },
        });

        if (existingInvoice) {
          results.errors.push(`Fila ${i + 2}: La factura ${row.numero} ya existe`);
          continue;
        }

        // Crear factura con su item
        await prisma.invoice.create({
          data: {
            type,
            userId: effectiveUserId,
            companyId,
            contactId: contact.id,
            number: row.numero,
            date: new Date(row.fecha),
            currency: company.currency || 'EUR',
            status: 'VALIDATED',
            paymentStatus: 'UNPAID',
            subtotal,
            taxAmount,
            total,
            items: {
              create: [
                {
                  productId,
                  description: row.producto,
                  quantity,
                  price,
                  tax,
                  subtotal,
                  taxAmount,
                  total,
                },
              ],
            },
          },
        });

        results.success++;
      } catch (error: any) {
        console.error(`Error procesando fila ${i + 2}:`, error);
        results.errors.push(`Fila ${i + 2}: ${error.message}`);
      }
    }

    return NextResponse.json({
      message: `Importación completada: ${results.success} facturas creadas, ${results.errors.length} errores`,
      results,
    });
  } catch (error: any) {
    console.error('Error importando facturas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al importar facturas' },
      { status: 500 }
    );
  }
}
