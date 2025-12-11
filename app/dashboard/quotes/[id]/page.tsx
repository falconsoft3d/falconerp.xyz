'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Quote {
  id: string;
  number: string;
  date: string;
  expiryDate: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'QUOTE' | 'ORDER';
  notes: string | null;
  invoiceId: string | null;
  contact: {
    id: string;
    name: string;
    nif: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  company: {
    id: string;
    name: string;
    nif: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    logo: string | null;
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
    product: {
      id: string;
      name: string;
      code: string;
    } | null;
    project: {
      id: string;
      name: string;
    } | null;
  }>;
  invoice: {
    id: string;
    number: string;
  } | null;
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuote();
  }, []);

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/quotes/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
      } else {
        setError('Cotización no encontrada');
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setError('Error al cargar cotización');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!confirm('¿Deseas convertir esta cotización en factura?')) {
      return;
    }

    setConverting(true);
    try {
      const res = await fetch(`/api/quotes/${params.id}/convert-to-invoice`, {
        method: 'POST',
      });

      if (res.ok) {
        const invoice = await res.json();
        alert('Cotización convertida a factura exitosamente');
        router.push(`/dashboard/invoices`);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al convertir la cotización');
      }
    } catch (error) {
      console.error('Error converting quote:', error);
      alert('Error al convertir la cotización');
    } finally {
      setConverting(false);
    }
  };

  const handleChangeStatus = async (newStatus: 'QUOTE' | 'ORDER') => {
    try {
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchQuote();
        alert('Estado actualizado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar estado');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cotización?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${params.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Cotización eliminada');
        router.push('/dashboard/quotes');
      } else {
        alert('Error al eliminar la cotización');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Error al eliminar la cotización');
    }
  };

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

  const getStatusBadge = (status: string, hasInvoice: boolean) => {
    if (hasInvoice) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          Facturada
        </span>
      );
    }
    
    if (status === 'ORDER') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Pedido
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
        Cotización
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotización...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Cotización no encontrada'}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-800">{quote.number}</h1>
            {getStatusBadge(quote.status, !!quote.invoiceId)}
          </div>
          <p className="text-gray-600">
            Cotización de {quote.company.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            ← Volver
          </Button>
          {!quote.invoiceId && (
            <>
              {quote.status === 'QUOTE' && (
                <Button
                  onClick={() => handleChangeStatus('ORDER')}
                  variant="secondary"
                >
                  Marcar como Pedido
                </Button>
              )}
              <Button
                onClick={handleConvertToInvoice}
                disabled={converting}
              >
                {converting ? 'Convirtiendo...' : '💰 Facturar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Información de la cotización */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos de la empresa */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Empresa</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Nombre:</span>
              <div className="text-gray-900">{quote.company.name}</div>
            </div>
            {quote.company.nif && (
              <div>
                <span className="font-medium text-gray-700">NIF:</span>
                <div className="text-gray-900">{quote.company.nif}</div>
              </div>
            )}
            {quote.company.address && (
              <div>
                <span className="font-medium text-gray-700">Dirección:</span>
                <div className="text-gray-900">{quote.company.address}</div>
              </div>
            )}
            {quote.company.phone && (
              <div>
                <span className="font-medium text-gray-700">Teléfono:</span>
                <div className="text-gray-900">{quote.company.phone}</div>
              </div>
            )}
            {quote.company.email && (
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <div className="text-gray-900">{quote.company.email}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Datos del cliente */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Cliente</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Nombre:</span>
              <div className="text-gray-900">{quote.contact.name}</div>
            </div>
            {quote.contact.nif && (
              <div>
                <span className="font-medium text-gray-700">NIF:</span>
                <div className="text-gray-900">{quote.contact.nif}</div>
              </div>
            )}
            {quote.contact.address && (
              <div>
                <span className="font-medium text-gray-700">Dirección:</span>
                <div className="text-gray-900">{quote.contact.address}</div>
              </div>
            )}
            {quote.contact.phone && (
              <div>
                <span className="font-medium text-gray-700">Teléfono:</span>
                <div className="text-gray-900">{quote.contact.phone}</div>
              </div>
            )}
            {quote.contact.email && (
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <div className="text-gray-900">{quote.contact.email}</div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Fechas y detalles */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Detalles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Fecha:</span>
            <div className="text-gray-900">
              {new Date(quote.date).toLocaleDateString('es-ES')}
            </div>
          </div>
          {quote.expiryDate && (
            <div>
              <span className="font-medium text-gray-700">Fecha de Expiración:</span>
              <div className="text-gray-900">
                {new Date(quote.expiryDate).toLocaleDateString('es-ES')}
              </div>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">Moneda:</span>
            <div className="text-gray-900">{quote.currency}</div>
          </div>
        </div>
        {quote.notes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="font-medium text-gray-700 block mb-2">Notas:</span>
            <div className="text-gray-900 whitespace-pre-wrap">{quote.notes}</div>
          </div>
        )}
        {quote.invoice && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="font-medium text-gray-700 block mb-2">Factura Generada:</span>
            <div className="text-blue-600 hover:text-blue-800">
              <button 
                onClick={() => router.push('/dashboard/invoices')}
                className="font-medium"
              >
                {quote.invoice.number} →
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Items */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Artículos / Servicios</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVA %
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quote.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {item.description}
                    </div>
                    {item.product && (
                      <div className="text-xs text-gray-500">
                        {item.product.code} - {item.product.name}
                      </div>
                    )}
                    {item.project && (
                      <div className="text-xs text-blue-600">
                        Proyecto: {item.project.name}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {item.price.toFixed(2)} {getCurrencySymbol(quote.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {item.tax}%
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {item.subtotal.toFixed(2)} {getCurrencySymbol(quote.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {item.total.toFixed(2)} {getCurrencySymbol(quote.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {quote.subtotal.toFixed(2)} {getCurrencySymbol(quote.currency)}
                </span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>IVA:</span>
                <span className="font-medium">
                  {quote.taxAmount.toFixed(2)} {getCurrencySymbol(quote.currency)}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>
                  {quote.total.toFixed(2)} {getCurrencySymbol(quote.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Acciones */}
      {!quote.invoiceId && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones</h2>
          <div className="flex gap-3">
            <Button
              onClick={handleConvertToInvoice}
              disabled={converting}
            >
              {converting ? 'Convirtiendo...' : '💰 Convertir a Factura'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDelete}
            >
              🗑️ Eliminar Cotización
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
