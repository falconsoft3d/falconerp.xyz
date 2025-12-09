import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET: Obtener adjuntos de una factura
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Verificar que la factura pertenece al usuario
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: user.id,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const attachments = await prisma.invoiceAttachment.findMany({
      where: {
        invoiceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Error al obtener adjuntos' },
      { status: 500 }
    );
  }
}

// POST: Subir un nuevo adjunto
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Verificar que la factura pertenece al usuario
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: user.id,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ningún archivo' }, { status: 400 });
    }

    // Validar tamaño del archivo (máximo 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo es demasiado grande (máximo 10MB)' }, { status: 400 });
    }

    // Crear directorio si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'invoices', invoiceId);
    await mkdir(uploadDir, { recursive: true });

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Guardar información en la base de datos
    const fileUrl = `/uploads/invoices/${invoiceId}/${fileName}`;
    const attachment = await prisma.invoiceAttachment.create({
      data: {
        invoiceId,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Error al subir adjunto' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un adjunto
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'ID del adjunto requerido' }, { status: 400 });
    }

    const attachment = await prisma.invoiceAttachment.findFirst({
      where: {
        id: attachmentId,
      },
      include: {
        invoice: true,
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Adjunto no encontrado' }, { status: 404 });
    }

    // Verificar que la factura pertenece al usuario
    if (attachment.invoice.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Eliminar archivo del sistema de archivos
    try {
      const fs = require('fs');
      const filePath = path.join(process.cwd(), 'public', attachment.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Eliminar de la base de datos
    await prisma.invoiceAttachment.delete({
      where: {
        id: attachmentId,
      },
    });

    return NextResponse.json({ message: 'Adjunto eliminado' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Error al eliminar adjunto' },
      { status: 500 }
    );
  }
}
