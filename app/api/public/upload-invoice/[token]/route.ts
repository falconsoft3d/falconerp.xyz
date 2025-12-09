import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    // Buscar empresa por token
    const company = await prisma.company.findFirst({
      where: {
        uploadToken: token,
        uploadTokenEnabled: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Token inválido o deshabilitado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const supplierName = formData.get('supplierName') as string;
    const amount = formData.get('amount') as string;
    const file = formData.get('file') as File;
    const userName = formData.get('userName') as string;

    if (!supplierName || !amount || !file || !userName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: supplierName, amount, file, userName' },
        { status: 400 }
      );
    }

    // Validar el archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan PDF, JPG, JPEG, PNG' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 10MB' },
        { status: 400 }
      );
    }

    // Convertir archivo a base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const fileData = `data:${file.type};base64,${base64}`;

    // Buscar o crear contacto (proveedor)
    let contact = await prisma.contact.findFirst({
      where: {
        companyId: company.id,
        name: supplierName,
        isSupplier: true,
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          userId: company.userId,
          companyId: company.id,
          name: supplierName,
          isSupplier: true,
          isCustomer: false,
        },
      });
    }

    // Generar número de factura
    const invoiceNumber = `${company.purchaseInvoicePrefix}${String(company.purchaseInvoiceNextNumber).padStart(4, '0')}`;

    // Crear factura de compra
    const invoice = await prisma.invoice.create({
      data: {
        userId: company.userId,
        companyId: company.id,
        contactId: contact.id,
        invoiceNumber,
        type: 'purchase',
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        currency: company.currency,
        subtotal: parseFloat(amount),
        tax: 0,
        total: parseFloat(amount),
        status: 'pending',
        paymentStatus: 'pending',
        notes: `Subida por: ${userName}`,
        attachment: fileData,
      },
    });

    // Actualizar número de factura
    await prisma.company.update({
      where: { id: company.id },
      data: {
        purchaseInvoiceNextNumber: company.purchaseInvoiceNextNumber + 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Factura de compra creada exitosamente',
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        supplier: supplierName,
        amount: invoice.total,
        date: invoice.date,
      },
    });
  } catch (error: any) {
    console.error('Error creating purchase invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear factura de compra' },
      { status: 500 }
    );
  }
}
