import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  companyId: string;
}

export async function sendEmail({ to, subject, html, companyId }: EmailOptions) {
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
    });

    console.log('Correo enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    throw error;
  }
}

export function generateInvoiceEmailTemplate(invoice: any, company: any, contact: any) {
  // Si hay plantilla personalizada, usarla
  if (company.emailTemplate && company.emailTemplate.trim()) {
    return replaceTemplateVariables(company.emailTemplate, invoice, company, contact);
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

function replaceTemplateVariables(template: string, invoice: any, company: any, contact: any): string {
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
