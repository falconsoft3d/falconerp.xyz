'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/DataTable';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'DRAFT' | 'VALIDATED';
  paymentStatus: 'UNPAID' | 'PAID';
  notes: string | null;
  contact: {
    id: string;
    name: string;
    nif: string | null;
  };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState<any>(null);
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
          fetchInvoices(active.id);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setLoading(false);
    }
  };

  const fetchInvoices = async (companyId: string) => {
    try {
      const res = await fetch(`/api/invoices?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando facturas...</p>
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

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-gray-100 text-gray-800',
      VALIDATED: 'bg-green-100 text-green-800',
    };
    const labels = {
      DRAFT: 'Borrador',
      VALIDATED: 'Validada',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const styles = {
      UNPAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
    };
    const labels = {
      UNPAID: 'Sin pagar',
      PAID: 'Pagada',
    };
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[paymentStatus as keyof typeof styles]}`}>
        {labels[paymentStatus as keyof typeof labels]}
      </span>
    );
  };



  const columns = [
    { 
      key: 'number', 
      label: 'Número',
      sortable: true,
      searchable: true
    },
    { 
      key: 'contact', 
      label: 'Cliente',
      sortable: true,
      searchable: true,
      render: (invoice: Invoice) => invoice.contact.name
    },
    { 
      key: 'date', 
      label: 'Fecha',
      sortable: true,
      render: (invoice: Invoice) => new Date(invoice.date).toLocaleDateString('es-ES')
    },
    { 
      key: 'total', 
      label: 'Total',
      sortable: true,
      render: (invoice: Invoice) => `${getCurrencySymbol(invoice.currency)}${invoice.total.toFixed(2)}`
    },
    { 
      key: 'status', 
      label: 'Estado',
      render: (invoice: Invoice) => getStatusBadge(invoice.status)
    },
    { 
      key: 'paymentStatus', 
      label: 'Pago',
      render: (invoice: Invoice) => getPaymentStatusBadge(invoice.paymentStatus)
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando facturas...</p>
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

  return (
    <div>
      <DataTable
        title="Facturas de Venta"
        data={invoices}
        columns={columns}
        createLink="/dashboard/invoices/new"
        createLabel="Nueva Factura"
        onEdit={(invoice) => router.push(`/dashboard/invoices/${invoice.id}`)}
        emptyMessage="No hay facturas registradas"
      />
    </div>
  );
}
