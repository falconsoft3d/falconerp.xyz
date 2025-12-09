'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function NewContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'España',
    isCustomer: true,
    isSupplier: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard/contacts');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear contacto');
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      setError('Error al crear contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Nuevo Contacto</h2>
        <p className="text-gray-600 mt-1">Crea un nuevo cliente o proveedor</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nombre o Razón Social"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej: Empresa S.L."
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="NIF/CIF"
                name="nif"
                value={formData.nif}
                onChange={handleChange}
                placeholder="B12345678"
              />

              <Input
                label="Teléfono"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+34 600 000 000"
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contacto@empresa.com"
            />

            <Input
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle Principal 123"
            />

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Input
                  label="Ciudad"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Madrid"
                />
              </div>
              <Input
                label="Código Postal"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="28001"
              />
            </div>

            <Input
              label="País"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="España"
            />

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Tipo de contacto</p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isCustomer"
                    name="isCustomer"
                    checked={formData.isCustomer}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="isCustomer" className="ml-2 block text-sm text-gray-900">
                    Cliente
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isSupplier"
                    name="isSupplier"
                    checked={formData.isSupplier}
                    onChange={handleChange}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <label htmlFor="isSupplier" className="ml-2 block text-sm text-gray-900">
                    Proveedor
                  </label>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Puedes marcar ambas opciones si el contacto es cliente y proveedor
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Crear Contacto
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
