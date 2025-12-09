import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la empresa con configuración SMTP
    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la configuración SMTP esté completa
    if (!company.smtpHost || !company.smtpPort || !company.smtpUser || !company.smtpPassword) {
      return NextResponse.json(
        { error: 'Configuración SMTP incompleta. Por favor complete todos los campos SMTP.' },
        { status: 400 }
      );
    }

    // Crear transporter de prueba
    const transporter = nodemailer.createTransport({
      host: company.smtpHost,
      port: company.smtpPort,
      secure: false,
      auth: {
        user: company.smtpUser,
        pass: company.smtpPassword,
      },
    });

    // Verificar la conexión
    await transporter.verify();

    // Enviar email de prueba
    const testEmail = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: ${company.primaryColor || '#10b981'};
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
          }
          .success-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Configuración SMTP Exitosa</h1>
        </div>
        
        <div class="content">
          <h2>¡Felicidades!</h2>
          <p>Este es un correo de prueba de <strong>${company.name}</strong>.</p>
          
          <p>Tu configuración SMTP está funcionando correctamente y ya puedes enviar facturas por correo electrónico a tus clientes.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: ${company.primaryColor || '#10b981'};">Configuración Actual:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Servidor SMTP:</strong> ${company.smtpHost}</li>
              <li><strong>Puerto:</strong> ${company.smtpPort}</li>
              <li><strong>Usuario:</strong> ${company.smtpUser}</li>
              <li><strong>Remitente:</strong> ${company.name} &lt;${company.smtpUser}&gt;</li>
            </ul>
          </div>
          
          <p>Ahora puedes ir a cualquier factura y usar el botón <strong>"Enviar por Correo"</strong> para enviar facturas a tus clientes.</p>
        </div>
        
        <div class="footer">
          ${company.address ? `<p>${company.address}</p>` : ''}
          ${company.city && company.postalCode ? `<p>${company.city}, ${company.postalCode}</p>` : ''}
          ${company.phone ? `<p>Tel: ${company.phone}</p>` : ''}
          ${company.email ? `<p>Email: ${company.email}</p>` : ''}
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"${company.name}" <${company.smtpUser}>`,
      to: company.smtpUser, // Enviar al mismo correo configurado
      subject: `✅ Prueba de Configuración SMTP - ${company.name}`,
      html: testEmail,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Email de prueba enviado correctamente a ${company.smtpUser}`,
      messageId: info.messageId 
    });
  } catch (error: any) {
    console.error('Error al enviar email de prueba:', error);
    
    // Mensajes de error específicos
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      return NextResponse.json(
        { error: 'Error de autenticación: Usuario o contraseña incorrectos. Verifica que estés usando una contraseña de aplicación de Google, no tu contraseña normal.' },
        { status: 500 }
      );
    }
    
    if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'No se pudo conectar al servidor SMTP. Verifica el host y puerto.' },
        { status: 500 }
      );
    }
    
    if (error.code === 'ESOCKET') {
      return NextResponse.json(
        { error: 'Error de conexión. Verifica tu conexión a internet y la configuración del firewall.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error al enviar email de prueba: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
}
