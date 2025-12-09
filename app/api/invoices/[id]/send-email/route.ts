import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { sendEmail, generateInvoiceEmailTemplate } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la factura con todos sus datos
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        company: true,
        contact: true,
        items: {
          include: {
            product: true,
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

    // Verificar que el contacto tenga email
    if (!invoice.contact?.email) {
      return NextResponse.json(
        { error: 'El contacto no tiene un correo electrónico configurado' },
        { status: 400 }
      );
    }

    // Verificar que la empresa tenga configuración SMTP
    if (!invoice.company.smtpHost || !invoice.company.smtpUser || !invoice.company.smtpPassword) {
      return NextResponse.json(
        { error: 'La empresa no tiene configuración SMTP. Por favor configure el SMTP en la configuración de la empresa.' },
        { status: 400 }
      );
    }

    // Generar el HTML del correo
    const emailHtml = generateInvoiceEmailTemplate(invoice, invoice.company, invoice.contact);

    // Enviar el correo
    await sendEmail({
      to: invoice.contact.email,
      subject: `Factura ${invoice.number} - ${invoice.company.name}`,
      html: emailHtml,
      companyId: invoice.company.id,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Factura enviada correctamente a ${invoice.contact.email}` 
    });
  } catch (error: any) {
    console.error('Error al enviar factura por correo:', error);
    
    // Mensajes de error más específicos
    if (error.message?.includes('SMTP')) {
      return NextResponse.json(
        { error: 'Error de configuración SMTP: ' + error.message },
        { status: 500 }
      );
    }
    
    if (error.code === 'EAUTH') {
      return NextResponse.json(
        { error: 'Error de autenticación SMTP. Verifique el usuario y contraseña en la configuración de la empresa.' },
        { status: 500 }
      );
    }
    
    if (error.code === 'ECONNECTION') {
      return NextResponse.json(
        { error: 'No se pudo conectar al servidor SMTP. Verifique el host y puerto en la configuración de la empresa.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error al enviar correo: ' + error.message },
      { status: 500 }
    );
  }
}
