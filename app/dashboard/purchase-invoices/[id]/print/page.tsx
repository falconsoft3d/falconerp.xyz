'use client';

import { useEffect, useState } from 'react';

interface Invoice {
  id: string;
  number: string;
  type: string;
  supplierReference?: string;
  date: string;
  dueDate?: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  contact: {
    id: string;
    name: string;
    nif?: string;
    email?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  company: {
    id: string;
    name: string;
    nif?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    logo?: string;
    primaryColor?: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    price: number;
    tax: number;
    subtotal: number;
    taxAmount: number;
    total: number;
    product?: {
      name: string;
      code: string;
    };
  }>;
}

export default function PurchaseInvoicePrintPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, []);

  useEffect(() => {
    if (invoice) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [invoice]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Factura no encontrada</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-300">
        <div>
          {invoice.company.logo && (
            <img
              src={invoice.company.logo}
              alt={invoice.company.name}
              className="h-16 mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {invoice.company.name}
          </h1>
          <div className="text-sm text-gray-600">
            {invoice.company.nif && <p>NIF: {invoice.company.nif}</p>}
            {invoice.company.address && <p>{invoice.company.address}</p>}
            {invoice.company.city && (
              <p>
                {invoice.company.postalCode} {invoice.company.city}
              </p>
            )}
            {invoice.company.country && <p>{invoice.company.country}</p>}
            {invoice.company.phone && <p>Tel: {invoice.company.phone}</p>}
            {invoice.company.email && <p>Email: {invoice.company.email}</p>}
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            FACTURA DE COMPRA
          </h2>
          <p className="text-lg font-semibold text-gray-700">{invoice.number}</p>
          {invoice.supplierReference && (
            <p className="text-sm text-gray-600 mt-1">
              Ref. Proveedor: {invoice.supplierReference}
            </p>
          )}
        </div>
      </div>

      {/* Supplier and dates info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase">
            Proveedor
          </h3>
          <div className="text-gray-900">
            <p className="font-semibold text-lg">{invoice.contact.name}</p>
            {invoice.contact.nif && <p className="text-sm">NIF: {invoice.contact.nif}</p>}
            {invoice.contact.address && <p className="text-sm">{invoice.contact.address}</p>}
            {invoice.contact.city && (
              <p className="text-sm">
                {invoice.contact.postalCode} {invoice.contact.city}
              </p>
            )}
            {invoice.contact.country && <p className="text-sm">{invoice.contact.country}</p>}
            {invoice.contact.email && <p className="text-sm">Email: {invoice.contact.email}</p>}
          </div>
        </div>

        <div>
          <div className="bg-gray-100 p-4 rounded">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Fecha de Factura:</p>
                <p className="font-semibold text-gray-900">
                  {new Date(invoice.date).toLocaleDateString('es-ES')}
                </p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-gray-600">Fecha de Vencimiento:</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Estado:</p>
                <p className="font-semibold text-gray-900">
                  {invoice.status === 'DRAFT' ? 'Borrador' : 'Validada'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Pago:</p>
                <p className="font-semibold text-gray-900">
                  {invoice.paymentStatus === 'UNPAID' ? 'Sin Pagar' : 'Pagada'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="px-4 py-3 text-left text-sm font-semibold">Descripción</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Cantidad</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Precio</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">IVA</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-4 py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{item.description}</p>
                  {item.product && (
                    <p className="text-xs text-gray-500">Código: {item.product.code}</p>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right border-b border-gray-200 text-gray-900">
                {item.quantity}
              </td>
              <td className="px-4 py-3 text-right border-b border-gray-200 text-gray-900">
                {invoice.currency} {item.price.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right border-b border-gray-200 text-gray-900">
                {item.tax}%
              </td>
              <td className="px-4 py-3 text-right border-b border-gray-200 font-medium text-gray-900">
                {invoice.currency} {item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="flex justify-between py-2 text-gray-700">
            <span>Subtotal:</span>
            <span className="font-medium">
              {invoice.currency} {invoice.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-2 text-gray-700">
            <span>IVA:</span>
            <span className="font-medium">
              {invoice.currency} {invoice.taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-300 text-xl font-bold text-gray-900">
            <span>TOTAL:</span>
            <span>{invoice.currency} {invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-2 text-sm uppercase">Notas</h3>
          <p className="text-gray-600 text-sm whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-300 text-center text-sm text-gray-500">
        <p>Gracias por su colaboración</p>
      </div>
    </div>
  );
}
