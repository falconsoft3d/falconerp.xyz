'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string | null;
  currency: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  company: {
    name: string;
    nif?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  contact: {
    name: string;
    nif?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
}

export default function InvoicePrintPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  useEffect(() => {
    // Auto-print cuando la factura se carga
    if (invoice && !loading) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [invoice, loading]);

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Cargando factura...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Factura no encontrada</h1>
        <button onClick={() => window.close()} style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          color: #000;
          background: white;
        }

        .print-actions {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 1000;
        }

        .print-actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-print {
          background-color: #10b981;
          color: white;
        }

        .btn-close {
          background-color: #6b7280;
          color: white;
        }

        .invoice-container {
          max-width: 210mm;
          margin: 40px auto;
          padding: 20mm;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #333;
        }

        .company-info {
          flex: 1;
        }

        .company-logo {
          max-width: 180px;
          max-height: 80px;
          margin-bottom: 15px;
        }

        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #000;
        }

        .company-details {
          font-size: 11px;
          line-height: 1.6;
          color: #333;
        }

        .invoice-info {
          text-align: right;
        }

        .invoice-title {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }

        .invoice-number {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 20px;
        }

        .invoice-dates {
          font-size: 11px;
          line-height: 1.8;
        }

        .invoice-dates div {
          margin-bottom: 5px;
        }

        .parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }

        .party {
          width: 48%;
        }

        .party-title {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 10px;
          text-transform: uppercase;
          color: #666;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
        }

        .party-details {
          font-size: 11px;
          line-height: 1.7;
        }

        .party-name {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 8px;
          color: #000;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }

        .items-table th {
          background-color: #f5f5f5;
          padding: 12px 10px;
          text-align: left;
          border: 1px solid #ddd;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .items-table td {
          padding: 10px;
          border: 1px solid #ddd;
          font-size: 11px;
        }

        .text-right {
          text-align: right;
        }

        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .totals {
          width: 350px;
          border-top: 2px solid #e5e7eb;
          padding-top: 15px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 12px;
        }

        .total-row.subtotal {
          color: #666;
        }

        .total-row.grand-total {
          font-size: 18px;
          font-weight: bold;
          border-top: 3px solid #333;
          padding-top: 15px;
          margin-top: 10px;
        }

        .notes-section {
          margin-top: 40px;
          padding: 20px;
          background-color: #f9fafb;
          border-left: 4px solid #10b981;
          border-radius: 4px;
        }

        .notes-title {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 10px;
          text-transform: uppercase;
          color: #333;
        }

        .notes-content {
          font-size: 11px;
          line-height: 1.7;
          white-space: pre-wrap;
          color: #4b5563;
        }

        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 10px;
          color: #9ca3af;
        }

        @media print {
          .print-actions {
            display: none !important;
          }

          .invoice-container {
            margin: 0;
            padding: 0;
            box-shadow: none;
            max-width: 100%;
          }

          body {
            margin: 0;
            padding: 15mm;
          }
        }

        @page {
          size: A4;
          margin: 0;
        }
      `}</style>

      <div className="print-actions">
        <button className="btn-print" onClick={() => window.print()}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir
        </button>
        <button className="btn-close" onClick={() => window.close()}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cerrar
        </button>
      </div>

      <div className="invoice-container">
        {/* Header */}
        <div className="invoice-header">
          <div className="company-info">
            {invoice.company?.logo && (
              <img 
                src={invoice.company.logo} 
                alt="Logo" 
                className="company-logo"
              />
            )}
            <div className="company-name">{invoice.company?.name || ''}</div>
            <div className="company-details">
              {invoice.company?.nif && <div>NIF: {invoice.company.nif}</div>}
              {invoice.company?.address && <div>{invoice.company.address}</div>}
              {(invoice.company?.postalCode || invoice.company?.city) && (
                <div>
                  {invoice.company?.postalCode} {invoice.company?.city}
                </div>
              )}
              {invoice.company?.country && <div>{invoice.company.country}</div>}
              {invoice.company?.phone && <div>Tel: {invoice.company.phone}</div>}
              {invoice.company?.email && <div>Email: {invoice.company.email}</div>}
            </div>
          </div>
          <div className="invoice-info">
            <div className="invoice-title">FACTURA</div>
            <div className="invoice-number">Nº {invoice.number}</div>
            <div className="invoice-dates">
              <div><strong>Fecha de emisión:</strong> {new Date(invoice.date).toLocaleDateString('es-ES')}</div>
              <div><strong>Fecha de vencimiento:</strong> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'N/A'}</div>
              <div><strong>Estado:</strong> {invoice.status === 'VALIDATED' ? 'Validada' : 'Borrador'}</div>
              <div><strong>Estado de pago:</strong> {invoice.paymentStatus === 'PAID' ? 'Pagada' : 'Sin pagar'}</div>
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="parties">
          <div className="party">
            <div className="party-title">Datos del Cliente</div>
            <div className="party-details">
              <div className="party-name">{invoice.contact?.name || ''}</div>
              {invoice.contact?.nif && <div>NIF: {invoice.contact.nif}</div>}
              {invoice.contact?.address && <div>{invoice.contact.address}</div>}
              {(invoice.contact?.postalCode || invoice.contact?.city) && (
                <div>
                  {invoice.contact?.postalCode} {invoice.contact?.city}
                </div>
              )}
              {invoice.contact?.country && <div>{invoice.contact.country}</div>}
              {invoice.contact?.phone && <div>Tel: {invoice.contact.phone}</div>}
              {invoice.contact?.email && <div>Email: {invoice.contact.email}</div>}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Descripción</th>
              <th style={{ width: '12%' }} className="text-right">Cantidad</th>
              <th style={{ width: '13%' }} className="text-right">Precio Unit.</th>
              <th style={{ width: '10%' }} className="text-right">IVA %</th>
              <th style={{ width: '15%' }} className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{getCurrencySymbol(invoice.currency)}{item.price.toFixed(2)}</td>
                <td className="text-right">{item.tax}%</td>
                <td className="text-right">{getCurrencySymbol(invoice.currency)}{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals-section">
          <div className="totals">
            <div className="total-row subtotal">
              <span>Base imponible:</span>
              <span>{getCurrencySymbol(invoice.currency)}{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row subtotal">
              <span>IVA:</span>
              <span>{getCurrencySymbol(invoice.currency)}{invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>TOTAL:</span>
              <span>{getCurrencySymbol(invoice.currency)}{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="notes-section">
            <div className="notes-title">Observaciones:</div>
            <div className="notes-content">{invoice.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div>Gracias por su confianza</div>
        </div>
      </div>
    </>
  );
}
