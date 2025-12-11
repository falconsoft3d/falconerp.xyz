'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
}

export default function NewTrackingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    companyId: '',
    contactId: '',
    productId: '',
    trackingNumber: '',
    description: '',
    origin: '',
    destination: '',
    carrier: '',
    weight: '',
    notes: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (formData.companyId) {
      fetchContacts(formData.companyId);
      fetchProducts(formData.companyId);
      if (!formData.trackingNumber) {
        generateTrackingNumber(formData.companyId);
      }
    }
  }, [formData.companyId]);

  const generateTrackingNumber = async (companyId: string) => {
    try {
      const response = await fetch(`/api/tracking?companyId=${companyId}`);
      if (response.ok) {
        const trackings = await response.json();
        const lastNumber = trackings.length > 0 
          ? Math.max(...trackings.map((t: any) => {
              const match = t.trackingNumber.match(/ENV(\d+)/);
              return match ? parseInt(match[1]) : 0;
            }))
          : 0;
        const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
        setFormData(prev => ({ ...prev, trackingNumber: `ENV${nextNumber}` }));
      }
    } catch (error) {
      console.error('Error al generar número de seguimiento:', error);
      setFormData(prev => ({ ...prev, trackingNumber: 'ENV001' }));
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies?active=true');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        if (data.length > 0 && !formData.companyId) {
          setFormData(prev => ({ ...prev, companyId: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    }
  };

  const fetchContacts = async (companyId: string) => {
    try {
      const response = await fetch(`/api/contacts?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error al cargar contactos:', error);
    }
  };

  const fetchProducts = async (companyId: string) => {
    try {
      const response = await fetch(`/api/products?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        contactId: formData.contactId || null,
        origin: formData.origin || null,
        destination: formData.destination || null,
        carrier: formData.carrier || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        notes: formData.notes || null,
      };

      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/tracking/${data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear seguimiento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/tracking"
          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
        >
          <svg className="mr-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Seguimientos
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📦 Nuevo Seguimiento</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Empresa */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Empresa <span className="text-red-500">*</span>
            </label>
            <select
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            >
              <option value="">Seleccionar empresa...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grid de 2 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Número de Seguimiento */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Número de Seguimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleChange}
                required
                placeholder="Ej: TRK-2025-001"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Contacto (Opcional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Contacto (Opcional)
              </label>
              <select
                name="contactId"
                value={formData.contactId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              >
                <option value="">Sin contacto</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Producto (Opcional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Producto (Opcional)
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              >
                <option value="">Sin producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.code}) - ${product.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describe el contenido del paquete o envío..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Grid de 2 columnas para ubicaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Origen
              </label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="Ciudad/País de origen"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Destino
              </label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="Ciudad/País de destino"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Grid de 2 columnas para transportista y peso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Transportista
              </label>
              <input
                type="text"
                name="carrier"
                value={formData.carrier}
                onChange={handleChange}
                placeholder="Ej: DHL, FedEx, UPS..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Peso (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notas Adicionales
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Información adicional sobre el envío..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/dashboard/tracking"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando...
                </>
              ) : (
                'Crear Seguimiento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
