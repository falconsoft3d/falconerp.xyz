'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  nif?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      header: 'Cliente',
      accessor: (customer: Customer) => (
        <div>
          <div className="font-medium text-gray-900">{customer.name}</div>
          {customer.nif && <div className="text-sm text-gray-500">NIF: {customer.nif}</div>}
        </div>
      ),
    },
    {
      header: 'Contacto',
      accessor: (customer: Customer) => (
        <div className="text-sm">
          {customer.email && <div className="text-gray-900">{customer.email}</div>}
          {customer.phone && <div className="text-gray-500">{customer.phone}</div>}
        </div>
      ),
    },
    {
      header: 'Ubicación',
      accessor: (customer: Customer) => (
        <div className="text-sm text-gray-900">
          {customer.city ? `${customer.city}${customer.postalCode ? `, ${customer.postalCode}` : ''}` : '-'}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Clientes</h2>
          <p className="text-gray-600 mt-1">Gestiona tu cartera de clientes</p>
        </div>
        <Button onClick={() => router.push('/dashboard/customers/new')}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </Button>
      </div>

      <DataTable
        data={customers}
        columns={columns}
        onRowClick={(customer) => router.push(`/dashboard/customers/${customer.id}`)}
        emptyMessage="No hay clientes registrados. Crea tu primer cliente para comenzar."
        emptyIcon={
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
    </div>
  );
}
