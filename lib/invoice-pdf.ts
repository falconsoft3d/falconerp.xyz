export function generateInvoicePDFHTML(invoice: any, company: any, contact: any): string {
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      GBP: '£',
      CHF: 'Fr',
      JPY: '¥',
      CNY: '¥',
      MXN: '$',
      ARS: '$',
      COP: '$',
      CLP: '$',
    };
    return symbols[currency] || currency;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page {
          size: A4;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          background: white;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid ${company.primaryColor || '#0f766e'};
        }
        .company-info {
          flex: 1;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: ${company.primaryColor || '#0f766e'};
          margin-bottom: 10px;
        }
        .company-details {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: ${company.primaryColor || '#0f766e'};
          margin-bottom: 10px;
        }
        .invoice-number {
          font-size: 18px;
          color: #333;
          margin-bottom: 5px;
        }
        .invoice-meta {
          font-size: 12px;
          color: #666;
        }
        .parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .party {
          flex: 1;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
        }
        .party + .party {
          margin-left: 20px;
        }
        .party-title {
          font-size: 11px;
          color: #666;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .party-name {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .party-details {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        thead {
          background: ${company.primaryColor || '#0f766e'};
          color: white;
        }
        th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }
        th.center {
          text-align: center;
        }
        th.right {
          text-align: right;
        }
        tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }
        tbody tr:nth-child(even) {
          background: #f8f9fa;
        }
        td {
          padding: 10px 12px;
          font-size: 12px;
        }
        td.center {
          text-align: center;
        }
        td.right {
          text-align: right;
        }
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .totals-table {
          width: 350px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-label {
          font-size: 13px;
        }
        .total-value {
          font-size: 13px;
          font-weight: 600;
        }
        .final-total {
          display: flex;
          justify-content: space-between;
          padding: 12px 15px;
          background: ${company.primaryColor || '#0f766e'};
          color: white;
          border-radius: 8px;
          margin-top: 5px;
        }
        .final-total-label {
          font-size: 16px;
          font-weight: bold;
        }
        .final-total-value {
          font-size: 18px;
          font-weight: bold;
        }
        .notes {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid ${company.primaryColor || '#0f766e'};
          margin-bottom: 30px;
        }
        .notes-title {
          font-size: 11px;
          color: #666;
          font-weight: bold;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .notes-content {
          font-size: 12px;
          white-space: pre-wrap;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #999;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${company.name}</div>
          <div class="company-details">
            ${company.nif ? `NIF: ${company.nif}<br>` : ''}
            ${company.address ? `${company.address}<br>` : ''}
            ${company.city || company.postalCode ? `${company.city || ''} ${company.postalCode || ''}<br>` : ''}
            ${company.country ? `${company.country}<br>` : ''}
            ${company.phone ? `Tel: ${company.phone}<br>` : ''}
            ${company.email ? `Email: ${company.email}` : ''}
          </div>
        </div>
        <div class="invoice-info">
          <div class="invoice-title">FACTURA</div>
          <div class="invoice-number">${invoice.number}</div>
          <div class="invoice-meta">
            <strong>Fecha:</strong> ${new Date(invoice.date).toLocaleDateString('es-ES')}<br>
            ${invoice.dueDate ? `<strong>Vencimiento:</strong> ${new Date(invoice.dueDate).toLocaleDateString('es-ES')}<br>` : ''}
            <strong>Estado:</strong> ${invoice.status === 'VALIDATED' ? 'Validada' : 'Borrador'}<br>
            <strong>Pago:</strong> ${invoice.paymentStatus === 'PAID' ? 'Pagada' : 'Pendiente'}
          </div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-title">Cliente</div>
          <div class="party-name">${contact.name || 'N/A'}</div>
          <div class="party-details">
            ${contact.nif ? `NIF: ${contact.nif}<br>` : ''}
            ${contact.address ? `${contact.address}<br>` : ''}
            ${contact.city || contact.postalCode ? `${contact.city || ''} ${contact.postalCode || ''}<br>` : ''}
            ${contact.country ? `${contact.country}<br>` : ''}
            ${contact.phone ? `Tel: ${contact.phone}<br>` : ''}
            ${contact.email ? `Email: ${contact.email}` : ''}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>DESCRIPCIÓN</th>
            <th class="center" style="width: 80px;">CANT.</th>
            <th class="right" style="width: 100px;">P. UNIT.</th>
            <th class="right" style="width: 80px;">IVA %</th>
            <th class="right" style="width: 120px;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item: any) => `
            <tr>
              <td>${item.description}</td>
              <td class="center">${item.quantity}</td>
              <td class="right">${item.price.toFixed(2)} ${getCurrencySymbol(invoice.currency)}</td>
              <td class="right">${item.tax}%</td>
              <td class="right" style="font-weight: bold;">${(item.quantity * item.price * (1 + item.tax / 100)).toFixed(2)} ${getCurrencySymbol(invoice.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-table">
          <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span class="total-value">${invoice.subtotal.toFixed(2)} ${getCurrencySymbol(invoice.currency)}</span>
          </div>
          <div class="total-row">
            <span class="total-label">IVA:</span>
            <span class="total-value">${invoice.taxAmount.toFixed(2)} ${getCurrencySymbol(invoice.currency)}</span>
          </div>
          <div class="final-total">
            <span class="final-total-label">TOTAL:</span>
            <span class="final-total-value">${invoice.total.toFixed(2)} ${getCurrencySymbol(invoice.currency)}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <div class="notes">
          <div class="notes-title">Observaciones</div>
          <div class="notes-content">${invoice.notes}</div>
        </div>
      ` : ''}

      <div class="footer">
        Factura generada por ${company.name} el ${new Date().toLocaleDateString('es-ES')}
      </div>
    </body>
    </html>
  `;
}
