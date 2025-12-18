'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Company {
  name: string;
  nif: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  logo: string | null;
}

interface Contact {
  name: string;
  email: string;
  phone: string;
  nif: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface Product {
  code: string;
  name: string;
  description: string | null;
}

interface QuoteItem {
  id: string;
  productId: string;
  product: Product;
  description: string;
  quantity: number;
  price: number;
  tax: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

interface Quote {
  id: string;
  number: string;
  date: string;
  expiryDate: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  notes: string | null;
  company: Company;
  contact: Contact;
  items: QuoteItem[];
  clientApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  clientApprovedAt: string | null;
  clientRejectionReason: string | null;
}

export default function PublicQuotePage() {
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, []);

  const fetchQuote = async () => {
    try {
      const res = await fetch(`/api/public/quotes/${params.token}`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
        setError('');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Error al cargar el presupuesto');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar el presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('¿Está seguro de aprobar este presupuesto?')) return;
    
    setProcessing(true);
    setError('');

    try {
      const res = await fetch(`/api/public/quotes/${params.token}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (res.ok) {
        await fetchQuote();
        alert('✓ Presupuesto aprobado exitosamente');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al aprobar presupuesto');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al aprobar presupuesto');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor indique el motivo del rechazo');
      return;
    }

    if (!confirm('¿Está seguro de rechazar este presupuesto?')) return;
    
    setProcessing(true);
    setError('');

    try {
      const res = await fetch(`/api/public/quotes/${params.token}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (res.ok) {
        await fetchQuote();
        setShowRejectForm(false);
        alert('Presupuesto rechazado');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al rechazar presupuesto');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al rechazar presupuesto');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    const labels = {
      PENDING: '⏳ Pendiente de Aprobación',
      APPROVED: '✅ Aprobado',
      REJECTED: '❌ Rechazado',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando presupuesto...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Presupuesto no encontrado</h2>
            <p className="text-gray-600">
              {error || 'El enlace puede ser inválido o el presupuesto ya no está disponible.'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <Card className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {quote.company.logo && (
                <img
                  src={quote.company.logo}
                  alt={quote.company.name}
                  className="h-16 mb-4 object-contain"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Presupuesto</h1>
              <p className="text-xl text-teal-600 font-semibold">{quote.number}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(quote.clientApprovalStatus)}
              {quote.clientApprovedAt && (
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(quote.clientApprovedAt).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          </div>

          {/* Información de empresa y cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">De:</h3>
              <p className="font-semibold text-gray-800">{quote.company.name}</p>
              <p className="text-sm text-gray-600">NIF: {quote.company.nif}</p>
              <p className="text-sm text-gray-600">{quote.company.address}</p>
              <p className="text-sm text-gray-600">
                {quote.company.postalCode} {quote.company.city}, {quote.company.country}
              </p>
              <p className="text-sm text-gray-600 mt-2">Tel: {quote.company.phone}</p>
              <p className="text-sm text-gray-600">Email: {quote.company.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Para:</h3>
              <p className="font-semibold text-gray-800">{quote.contact.name}</p>
              <p className="text-sm text-gray-600">NIF: {quote.contact.nif}</p>
              <p className="text-sm text-gray-600">{quote.contact.address}</p>
              <p className="text-sm text-gray-600">
                {quote.contact.postalCode} {quote.contact.city}, {quote.contact.country}
              </p>
              <p className="text-sm text-gray-600 mt-2">Tel: {quote.contact.phone}</p>
              <p className="text-sm text-gray-600">Email: {quote.contact.email}</p>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-500">Fecha de Emisión</p>
              <p className="font-medium text-gray-800">
                {new Date(quote.date).toLocaleDateString('es-ES')}
              </p>
            </div>
            {quote.expiryDate && (
              <div>
                <p className="text-sm text-gray-500">Fecha de Vencimiento</p>
                <p className="font-medium text-gray-800">
                  {new Date(quote.expiryDate).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Líneas del presupuesto */}
        <Card className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalle</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto/Servicio
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    IVA %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quote.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-800">
                        {item.product.code} - {item.product.name}
                      </p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-800">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-800">
                      {formatCurrency(item.price, quote.currency)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-800">
                      {item.tax}%
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-gray-800">
                      {formatCurrency(item.total, quote.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(quote.subtotal, quote.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA:</span>
                  <span className="font-medium">{formatCurrency(quote.taxAmount, quote.currency)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(quote.total, quote.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Notas */}
        {quote.notes && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Notas</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
          </Card>
        )}

        {/* Motivo de rechazo */}
        {quote.clientApprovalStatus === 'REJECTED' && quote.clientRejectionReason && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Motivo del Rechazo</h3>
            <p className="text-red-700">{quote.clientRejectionReason}</p>
          </Card>
        )}

        {/* Botones de acción */}
        {quote.clientApprovalStatus === 'PENDING' && (
          <Card className="bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Acción Requerida</h3>
            <p className="text-gray-600 mb-4">
              Por favor, revise el presupuesto y confirme si desea aprobarlo o rechazarlo.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  {processing ? 'Procesando...' : '✓ Aprobar Presupuesto'}
                </Button>
                <Button
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 flex-1"
                >
                  ✗ Rechazar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo del rechazo (requerido)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Por favor indique el motivo del rechazo..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                    className="bg-red-600 hover:bg-red-700 flex-1"
                  >
                    {processing ? 'Procesando...' : 'Confirmar Rechazo'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    disabled={processing}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>Este presupuesto fue generado por {quote.company.name}</p>
          <p className="mt-1">Si tiene alguna pregunta, contáctenos en {quote.company.email}</p>
        </div>
      </div>
    </div>
  );
}
