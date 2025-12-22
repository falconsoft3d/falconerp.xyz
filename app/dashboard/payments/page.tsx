'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

interface Payment {
  id: string;
  number: string;
  type: 'ENTRADA' | 'SALIDA';
  amount: number;
  currency: string;
  date: string;
  description?: string;
  contact?: {
    id: string;
    name: string;
  };
  project?: {
    id: string;
    name: string;
  };
  journal?: {
    id: string;
    code: string;
    name: string;
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ENTRADA' | 'SALIDA'>('ALL');
  const [companyId, setCompanyId] = useState<string>('');

  useEffect(() => {
    loadCompany();
  }, []);

  useEffect(() => {
    if (companyId) {
      loadPayments();
    }
  }, [companyId, filter]);

  const loadCompany = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const companies = await res.json();
        const activeCompany = companies.find((c: any) => c.active);
        if (activeCompany) {
          setCompanyId(activeCompany.id);
        }
      }
    } catch (error) {
      console.error('Error loading company:', error);
    }
  };

  const loadPayments = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId: companyId,
      });
      
      if (filter !== 'ALL') {
        params.append('type', filter);
      }

      const res = await fetch(`/api/payments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string, type: 'ENTRADA' | 'SALIDA') => {
    const finalAmount = type === 'SALIDA' ? -Math.abs(amount) : Math.abs(amount);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(finalAmount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-600 mt-1">Gestión de pagos de entrada y salida</p>
        </div>
        <Link
          href="/dashboard/payments/new"
          className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
          style={{ backgroundColor: primaryColor }}
        >
          Nuevo Pago
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'ALL'
              ? 'text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={filter === 'ALL' ? { backgroundColor: primaryColor } : {}}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('ENTRADA')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'ENTRADA'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Entradas
        </button>
        <button
          onClick={() => setFilter('SALIDA')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'SALIDA'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Salidas
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pagos</h3>
          <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo pago.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propiedad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diario
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importe
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/payments/${payment.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.type === 'ENTRADA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.type === 'ENTRADA' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.contact?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.project?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.property?.code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.journal ? `${payment.journal.code} - ${payment.journal.name}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatAmount(Number(payment.amount), payment.currency, payment.type)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
