import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  companyId: string;
  attachments?: EmailAttachment[];
}

export async function sendVerificationEmail(to: string, name: string, code: string) {
  // Usar configuración SMTP del .env
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@falconerp.xyz';

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.log('⚠️  Configuración SMTP no completa.');
    console.log('📧 Código de verificación para', to, ':', code);
    console.log('💡 Configura SMTP_HOST, SMTP_USER y SMTP_PASSWORD en .env para enviar emails');
    return; // No fallar si no hay configuración
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
          .code { background: white; border: 2px dashed #10b981; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verifica tu email</h1>
          </div>
          <div class="content">
            <p>Hola ${name},</p>
            <p>Gracias por registrarte en FalconERP. Para completar tu registro, por favor ingresa el siguiente código de verificación:</p>
            <div class="code">${code}</div>
            <p>Este código expirará en 15 minutos.</p>
            <p>Si no solicitaste este registro, por favor ignora este email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FalconERP. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"FalconERP" <${smtpFrom}>`,
      to,
      subject: 'Verifica tu email - FalconERP',
      html,
    });

    console.log('✅ Email de verificación enviado a:', to);
  } catch (error) {
    console.error('❌ Error al enviar email de verificación:', error);
    // No lanzar error, solo loguear
  }
}

// Función simplificada para formulario de contacto (usa configuración del .env)
export async function sendContactEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@falconerp.xyz';

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.log('⚠️  Configuración SMTP no completa en .env');
    console.log('📧 Email que se enviaría a:', to);
    console.log('📝 Asunto:', subject);
    console.log('💡 Configura SMTP_HOST, SMTP_USER y SMTP_PASSWORD en .env para enviar emails');
    return; // No fallar si no hay configuración
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: `"FalconERP" <${smtpFrom}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email de contacto enviado a:', to);
  } catch (error) {
    console.error('❌ Error al enviar email de contacto:', error);
    // No lanzar error, solo loguear
  }
}

export async function sendEmail({ to, subject, html, companyId, attachments }: EmailOptions) {
  try {
    // Obtener configuración SMTP de la empresa
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        email: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpPassword: true,
      },
    });

    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    // Verificar que la configuración SMTP esté completa
    if (!company.smtpHost || !company.smtpPort || !company.smtpUser || !company.smtpPassword) {
      throw new Error('Configuración SMTP incompleta. Por favor configure el SMTP en la empresa.');
    }

    // Crear transporter con la configuración de la empresa
    const transporter = nodemailer.createTransport({
      host: company.smtpHost,
      port: company.smtpPort,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: company.smtpUser,
        pass: company.smtpPassword,
      },
    });

    // Verificar la conexión
    await transporter.verify();

    // Enviar el correo
    const info = await transporter.sendMail({
      from: `"${company.name}" <${company.smtpUser}>`,
      to,
      subject,
      html,
      attachments: attachments || [],
    });

    console.log('Correo enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw error;
  }
}

export function generateInvoiceEmailTemplate(invoice: any, company: any, contact: any, downloadUrl?: string) {
  // Si hay plantilla personalizada, usarla
  if (company.emailTemplate && company.emailTemplate.trim()) {
    return replaceTemplateVariables(company.emailTemplate, invoice, company, contact, downloadUrl);
  }

  // Plantilla por defecto
  return `
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
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 30px;
          border: 1px solid #ddd;
        }
        .invoice-details {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .label {
          font-weight: bold;
          color: #666;
        }
        .value {
          color: #333;
        }
        .total {
          font-size: 1.2em;
          font-weight: bold;
          color: ${company.primaryColor || '#10b981'};
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 0.9em;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: ${company.primaryColor || '#10b981'};
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          text-align: center;
        }
        .download-section {
          background-color: #f0fdf4;
          border: 2px solid ${company.primaryColor || '#10b981'};
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${company.name}</h1>
        <p>Factura ${invoice.number}</p>
      </div>
      
      <div class="content">
        <p>Estimado/a ${contact.name},</p>
        
        <p>Le enviamos la factura <strong>${invoice.number}</strong> correspondiente a los servicios/productos adquiridos.</p>
        
        ${downloadUrl ? `
        <div class="download-section">
          <p style="margin-bottom: 15px;"><strong>📄 Descargar Factura en PDF</strong></p>
          <a href="${downloadUrl}" class="button" style="color: white;">Descargar PDF</a>
          <p style="font-size: 0.85em; color: #666; margin-top: 10px;">Haga clic en el botón para descargar su factura</p>
        </div>
        ` : ''}
        
        <div class="invoice-details">
          <div class="detail-row">
            <span class="label">Factura:</span>
            <span class="value">${invoice.number}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fecha:</span>
            <span class="value">${new Date(invoice.date).toLocaleDateString('es-ES')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Fecha de Vencimiento:</span>
            <span class="value">${new Date(invoice.dueDate).toLocaleDateString('es-ES')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Subtotal:</span>
            <span class="value">${invoice.subtotal.toFixed(2)} ${invoice.currency}</span>
          </div>
          <div class="detail-row">
            <span class="label">IVA:</span>
            <span class="value">${invoice.taxAmount.toFixed(2)} ${invoice.currency}</span>
          </div>
          <div class="detail-row">
            <span class="label">Total:</span>
            <span class="value total">${invoice.total.toFixed(2)} ${invoice.currency}</span>
          </div>
          <div class="detail-row">
            <span class="label">Estado de Pago:</span>
            <span class="value">${getPaymentStatusLabel(invoice.paymentStatus)}</span>
          </div>
        </div>
        
        ${invoice.notes ? `<p><strong>Notas:</strong><br>${invoice.notes}</p>` : ''}
        
        <p>Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.</p>
        
        <p>Saludos cordiales,<br><strong>${company.name}</strong></p>
      </div>
      
      <div class="footer">
        ${company.address ? `<p>${company.address}</p>` : ''}
        ${company.city && company.postalCode ? `<p>${company.city}, ${company.postalCode}</p>` : ''}
        ${company.phone ? `<p>Tel: ${company.phone}</p>` : ''}
        ${company.email ? `<p>Email: ${company.email}</p>` : ''}
        ${company.nif ? `<p>NIF: ${company.nif}</p>` : ''}
      </div>
    </body>
    </html>
  `;
}

function replaceTemplateVariables(template: string, invoice: any, company: any, contact: any, downloadUrl?: string): string {
  let result = template;
  
  // Variables de factura
  result = result.replace(/\{\{invoice\.number\}\}/g, invoice.number || '');
  result = result.replace(/\{\{invoice\.date\}\}/g, new Date(invoice.date).toLocaleDateString('es-ES'));
  result = result.replace(/\{\{invoice\.dueDate\}\}/g, new Date(invoice.dueDate).toLocaleDateString('es-ES'));
  result = result.replace(/\{\{invoice\.subtotal\}\}/g, invoice.subtotal?.toFixed(2) || '0.00');
  result = result.replace(/\{\{invoice\.taxAmount\}\}/g, invoice.taxAmount?.toFixed(2) || '0.00');
  result = result.replace(/\{\{invoice\.total\}\}/g, invoice.total?.toFixed(2) || '0.00');
  result = result.replace(/\{\{invoice\.currency\}\}/g, invoice.currency || 'EUR');
  result = result.replace(/\{\{invoice\.status\}\}/g, invoice.status || '');
  result = result.replace(/\{\{invoice\.paymentStatus\}\}/g, getPaymentStatusLabel(invoice.paymentStatus || ''));
  result = result.replace(/\{\{invoice\.notes\}\}/g, invoice.notes || '');
  result = result.replace(/\{\{invoice\.downloadUrl\}\}/g, downloadUrl || '');
  
  // Variables de empresa
  result = result.replace(/\{\{company\.name\}\}/g, company.name || '');
  result = result.replace(/\{\{company\.nif\}\}/g, company.nif || '');
  result = result.replace(/\{\{company\.address\}\}/g, company.address || '');
  result = result.replace(/\{\{company\.city\}\}/g, company.city || '');
  result = result.replace(/\{\{company\.postalCode\}\}/g, company.postalCode || '');
  result = result.replace(/\{\{company\.country\}\}/g, company.country || '');
  result = result.replace(/\{\{company\.phone\}\}/g, company.phone || '');
  result = result.replace(/\{\{company\.email\}\}/g, company.email || '');
  result = result.replace(/\{\{company\.primaryColor\}\}/g, company.primaryColor || '#10b981');
  result = result.replace(/\{\{company\.secondaryColor\}\}/g, company.secondaryColor || '#059669');
  
  // Variables de contacto
  result = result.replace(/\{\{contact\.name\}\}/g, contact.name || '');
  result = result.replace(/\{\{contact\.email\}\}/g, contact.email || '');
  result = result.replace(/\{\{contact\.phone\}\}/g, contact.phone || '');
  result = result.replace(/\{\{contact\.address\}\}/g, contact.address || '');
  result = result.replace(/\{\{contact\.city\}\}/g, contact.city || '');
  result = result.replace(/\{\{contact\.postalCode\}\}/g, contact.postalCode || '');
  result = result.replace(/\{\{contact\.country\}\}/g, contact.country || '');
  result = result.replace(/\{\{contact\.nif\}\}/g, contact.nif || '');
  
  return result;
}

function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagada',
    overdue: 'Vencida',
    partial: 'Pago Parcial',
  };
  return labels[status] || status;
}
