'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface Invoice {
  id: string;
  number: string;
}

interface Tracking {
  id: string;
  trackingNumber: string;
  description: string;
  status: 'REQUESTED' | 'RECEIVED' | 'PAID' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED';
  publicToken?: string | null;
  carrier?: string | null;
  origin?: string | null;
  destination?: string | null;
  requestedDate?: Date | null;
  receivedDate?: Date | null;
  paidDate?: Date | null;
  shippedDate?: Date | null;
  inTransitDate?: Date | null;
  deliveredDate?: Date | null;
  contact?: Contact | null;
  invoice?: Invoice | null;
  createdAt: Date;
}

const statusLabels: Record<string, string> = {
  REQUESTED: 'Solicitado',
  RECEIVED: 'Recibido en Oficina',
  PAID: 'Pagado',
  SHIPPED: 'Enviado',
  IN_TRANSIT: 'En Tránsito',
  DELIVERED: 'Llegó',
};

const statusColors: Record<string, string> = {
  REQUESTED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
  SHIPPED: 'bg-yellow-100 text-yellow-800',
  IN_TRANSIT: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-teal-100 text-teal-800',
};

export default function TrackingPage() {
  const router = useRouter();
  const [trackings, setTrackings] = useState<Tracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchTrackings();
    }
  }, [selectedCompany, statusFilter]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies?active=true');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        if (data.length > 0 && !selectedCompany) {
          setSelectedCompany(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    }
  };

  const fetchTrackings = async () => {
    try {
      setLoading(true);
      let url = `/api/tracking?companyId=${selectedCompany}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Trackings recibidos:', data);
        setTrackings(data);
      } else {
        console.error('Error al cargar seguimientos');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este seguimiento?')) return;

    try {
      const response = await fetch(`/api/tracking/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTrackings();
      } else {
        alert('Error al eliminar seguimiento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar seguimiento');
    }
  };

  const getLatestDate = (tracking: Tracking): Date => {
    const dates = [
      tracking.deliveredDate,
      tracking.inTransitDate,
      tracking.shippedDate,
      tracking.paidDate,
      tracking.receivedDate,
      tracking.requestedDate,
    ].filter(Boolean) as Date[];

    return dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : new Date(tracking.createdAt);
  };

  const getDaysSinceStart = (tracking: Tracking): number => {
    const startDate = tracking.requestedDate ? new Date(tracking.requestedDate) : new Date(tracking.createdAt);
    const endDate = tracking.deliveredDate ? new Date(tracking.deliveredDate) : new Date();
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredTrackings = trackings.filter(tracking => {
    const matchesSearch = 
      tracking.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracking.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracking.contact?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tracking.carrier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📦 Seguimiento</h1>
        <div className="flex gap-3">
          <Link
            href="/public/tracking"
            target="_blank"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscador Público
          </Link>
          <Link
            href="/dashboard/tracking/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Seguimiento
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Empresa</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Número, descripción, contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-black">Cargando seguimientos...</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Nº Seguimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Transportista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Última Actualización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                    Días
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-black uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>                                                                                                                                                                                                          
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTrackings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-black">
                      No hay seguimientos para mostrar
                    </td>
                  </tr>
                ) : (
                  filteredTrackings.map((tracking) => (
                    <tr key={tracking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tracking.trackingNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 line-clamp-2">{tracking.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tracking.contact?.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[tracking.status]}`}>
                          {statusLabels[tracking.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tracking.carrier || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tracking.invoice ? (
                          <Link
                            href={`/dashboard/invoices/${tracking.invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            {tracking.invoice.number}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(getLatestDate(tracking)).toLocaleDateString('es-ES')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {getDaysSinceStart(tracking)} {getDaysSinceStart(tracking) === 1 ? 'día' : 'días'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/tracking/${tracking.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={async () => {
                            console.log('Tracking completo:', tracking);
                            console.log('PublicToken:', tracking.publicToken);
                            if (!tracking.publicToken) {
                              alert('Este seguimiento no tiene un enlace público. Por favor, actualízalo o crea uno nuevo.');
                              return;
                            }
                            const url = `${window.location.origin}/public/tracking/${tracking.publicToken}`;
                            await navigator.clipboard.writeText(url);
                            alert('Enlace copiado al portapapeles');
                          }}
                          className="text-green-600 hover:text-green-900 mr-4"
                          title="Copiar enlace público"
                        >
                          🔗
                        </button>
                        <button
                          onClick={() => handleDelete(tracking.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
