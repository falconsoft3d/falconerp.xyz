'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';

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
  publicToken: string | null;
  clientApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  contact: {
    id: string;
    name: string;
    nif: string | null;
  };
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [showPublicLink, setShowPublicLink] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchActiveCompany();
  }, []);

  const fetchActiveCompany = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const companies = await res.json();
        const active = companies.find((c: any) => c.active);
        if (active) {
          setActiveCompany(active);
          fetchQuotes(active.id);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setLoading(false);
    }
  };

  const fetchQuotes = async (companyId: string) => {
    try {
      const res = await fetch(`/api/quotes?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    if (!confirm('¿Deseas convertir esta cotización en factura?')) {
      return;
    }

    setConvertingId(quoteId);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert-to-invoice`, {
        method: 'POST',
      });

      if (res.ok) {
        const invoice = await res.json();
        alert('Cotización convertida a factura exitosamente');
        // Recargar cotizaciones
        if (activeCompany) {
          fetchQuotes(activeCompany.id);
        }
        // Redirigir a la factura creada
        router.push(`/dashboard/invoices`);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al convertir la cotización');
      }
    } catch (error) {
      console.error('Error converting quote:', error);
      alert('Error al convertir la cotización');
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cotización?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (activeCompany) {
          fetchQuotes(activeCompany.id);
        }
      } else {
        alert('Error al eliminar la cotización');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Error al eliminar la cotización');
    }
  };

  const handleGeneratePublicLink = async (quoteId: string) => {
    setGeneratingLink(quoteId);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/public-link`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        navigator.clipboard.writeText(data.publicUrl);
        alert('✓ Enlace público copiado al portapapeles');
        if (activeCompany) {
          fetchQuotes(activeCompany.id);
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Error al generar enlace público');
      }
    } catch (error) {
      console.error('Error generating public link:', error);
      alert('Error al generar enlace público');
    } finally {
      setGeneratingLink(null);
    }
  };

  const handleCopyPublicLink = async (quote: Quote) => {
    if (!quote.publicToken) return;
    const publicUrl = `${window.location.origin}/public/quotes/view/${quote.publicToken}`;
    navigator.clipboard.writeText(publicUrl);
    alert('✓ Enlace público copiado al portapapeles');
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

  const getApprovalBadge = (approvalStatus: string) => {
    if (approvalStatus === 'APPROVED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-1">
          ✓ Aprobado
        </span>
      );
    }
    if (approvalStatus === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 ml-1">
          ✗ Rechazado
        </span>
      );
    }
    return null;
  };

  const getStatusBadge = (status: string, hasInvoice: boolean) => {
    if (hasInvoice) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Facturada
        </span>
      );
    }
    
    if (status === 'ORDER') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Pedido
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Cotización
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cotizaciones...</p>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          No tienes una empresa activa. Por favor, crea o activa una empresa primero.
        </p>
      </div>
    );
  }

  const columns = [
    {
      key: 'number',
      label: 'Número',
      render: (quote: Quote) => (
        <span className="font-medium text-gray-900">{quote.number}</span>
      ),
    },
    {
      key: 'date',
      label: 'Fecha',
      render: (quote: Quote) => new Date(quote.date).toLocaleDateString('es-ES'),
    },
    {
      key: 'expiryDate',
      label: 'Vencimiento',
      render: (quote: Quote) => quote.expiryDate 
        ? new Date(quote.expiryDate).toLocaleDateString('es-ES')
        : '-',
    },
    {
      key: 'contact',
      label: 'Cliente',
      render: (quote: Quote) => (
        <div>
          <div className="font-medium text-gray-900">{quote.contact.name}</div>
          {quote.contact.nif && (
            <div className="text-sm text-gray-500">{quote.contact.nif}</div>
          )}
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (quote: Quote) => (
        <span className="font-semibold text-gray-900">
          {quote.total.toFixed(2)} {getCurrencySymbol(quote.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      render: (quote: Quote) => (
        <div className="flex flex-wrap items-center gap-1">
          {getStatusBadge(quote.status, !!quote.invoiceId)}
          {getApprovalBadge(quote.clientApprovalStatus)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (quote: Quote) => (
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/dashboard/quotes/${quote.id}`)}
            className="text-teal-600 hover:text-teal-800 font-medium text-sm"
          >
            Ver
          </button>
          {quote.publicToken ? (
            <button
              onClick={() => handleCopyPublicLink(quote)}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm"
              title="Copiar enlace público"
            >
              🔗
            </button>
          ) : (
            <button
              onClick={() => handleGeneratePublicLink(quote.id)}
              disabled={generatingLink === quote.id}
              className="text-purple-600 hover:text-purple-800 font-medium text-sm disabled:opacity-50"
              title="Generar enlace público"
            >
              {generatingLink === quote.id ? '...' : '🔗+'}
            </button>
          )}
          {!quote.invoiceId && (
            <button
              onClick={() => handleConvertToInvoice(quote.id)}
              disabled={convertingId === quote.id}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-50"
            >
              {convertingId === quote.id ? 'Convirtiendo...' : 'Facturar'}
            </button>
          )}
          {!quote.invoiceId && (
            <button
              onClick={() => handleDelete(quote.id)}
              className="text-red-600 hover:text-red-800 font-medium text-sm"
            >
              Eliminar
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cotizaciones de Venta</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las cotizaciones de {activeCompany.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setShowPublicLink(!showPublicLink)}
          >
            🔗 Link Público
          </Button>
          <Button onClick={() => router.push('/dashboard/quotes/new')}>
            + Nueva Cotización
          </Button>
        </div>
      </div>

      {showPublicLink && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h3 className="font-semibold text-teal-900 mb-2">Link Público de Cotización</h3>
          <p className="text-sm text-teal-700 mb-3">
            Comparte este enlace con tus clientes para que puedan seleccionar productos y solicitar una cotización.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/public/quotes/${activeCompany.id}`}
              className="flex-1 px-3 py-2 border border-teal-300 rounded-lg bg-white text-gray-900"
            />
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/public/quotes/${activeCompany.id}`);
                alert('Link copiado al portapapeles');
              }}
            >
              📋 Copiar
            </Button>
          </div>
        </div>
      )}

      <DataTable
        title="Cotizaciones"
        data={quotes}
        columns={columns}
        emptyMessage="No hay cotizaciones registradas"
      />
    </div>
  );
}
