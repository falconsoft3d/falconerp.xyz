'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Property {
  id: string;
  code: string;
  address: string;
  block: string | null;
  number: string | null;
  projectId: string | null;
  constructionDate: Date | null;
  contractAmount: number | null;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  notes: string | null;
  project: {
    id: string;
    name: string;
  } | null;
  contacts: Array<{
    id: string;
    responsibility: string;
    contact: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    };
  }>;
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      
      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa. Por favor selecciona una empresa.');
        setLoading(false);
        return;
      }

      setSelectedCompanyId(activeCompany.id);

      // Cargar propiedades
      const response = await fetch(`/api/properties?companyId=${activeCompany.id}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      } else {
        setError('Error al cargar propiedades');
      }
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      setError('Error al cargar propiedades');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta propiedad?')) return;

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProperties(properties.filter(p => p.id !== id));
      } else {
        alert('Error al eliminar la propiedad');
      }
    } catch (error) {
      console.error('Error al eliminar propiedad:', error);
      alert('Error al eliminar la propiedad');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-CO');
  };

  const filteredProperties = properties.filter(property => {
    const search = searchTerm.toLowerCase();
    return (
      property.code.toLowerCase().includes(search) ||
      property.address.toLowerCase().includes(search) ||
      property.block?.toLowerCase().includes(search) ||
      property.number?.toLowerCase().includes(search) ||
      property.project?.name.toLowerCase().includes(search) ||
      property.contacts.some(pc => 
        pc.contact.name.toLowerCase().includes(search) ||
        pc.responsibility.toLowerCase().includes(search)
      )
    );
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-black">Cargando propiedades...</div>
      </div>
    );
  }

  if (!selectedCompanyId && !loading) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {error || 'Por favor selecciona una empresa para ver las propiedades.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Propiedades</h1>
        <Link
          href="/dashboard/properties/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Nueva Propiedad
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No hay propiedades registradas</p>
          <Link
            href="/dashboard/properties/new"
            className="text-blue-600 hover:text-blue-800"
          >
            Crear la primera propiedad
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bloque/Número
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proyecto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importe Contrato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contactos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {property.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {property.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.block && property.number
                          ? `${property.block} - ${property.number}`
                          : property.block || property.number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.project?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(property.contractAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {property.contacts.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {property.contacts.length} contacto
                            {property.contacts.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/properties/${property.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Ver/Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
