'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    currency: 'EUR',
    phone: '',
    email: '',
    logo: '',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    salesInvoicePrefix: 'INV',
    salesInvoiceNextNumber: 1,
    purchaseInvoicePrefix: 'INVO',
    purchaseInvoiceNextNumber: 1,
  });

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          nif: data.nif || '',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postalCode || '',
          country: data.country || '',
          currency: data.currency || 'EUR',
          phone: data.phone || '',
          email: data.email || '',
          logo: data.logo || '',
          primaryColor: data.primaryColor || '#10b981',
          secondaryColor: data.secondaryColor || '#059669',
          salesInvoicePrefix: data.salesInvoicePrefix || 'INV',
          salesInvoiceNextNumber: data.salesInvoiceNextNumber || 1,
          purchaseInvoicePrefix: data.purchaseInvoicePrefix || 'INVO',
          purchaseInvoiceNextNumber: data.purchaseInvoiceNextNumber || 1,
        });
        if (data.logo) {
          setLogoPreview(data.logo);
        }
      } else {
        setError('Error al cargar empresa');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setError('Error al cargar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Disparar evento para actualizar el tema
        window.dispatchEvent(new Event('companyChanged'));
        router.push('/dashboard/companies');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar empresa');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      setError('Error al actualizar empresa');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea PNG
      if (!file.type.includes('png')) {
        setError('Solo se permiten archivos PNG');
        return;
      }
      
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('El archivo no debe superar 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({
          ...formData,
          logo: base64String,
        });
        setLogoPreview(base64String);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresa...</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta empresa?')) {
      return;
    }

    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard/companies');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar empresa');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Error al eliminar empresa');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Editar Empresa</h2>
          <p className="text-gray-600 mt-1">Modifica los datos de tu empresa</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/companies/new">
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear Nueva
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </Button>
        </div>
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
              label="Nombre de la Empresa"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej: Mi Empresa S.L."
            />

            <Input
              label="NIF/CIF"
              name="nif"
              value={formData.nif}
              onChange={handleChange}
              placeholder="B12345678"
            />

            <Input
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle Principal 123"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Madrid"
              />

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

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="EUR">EUR (€) - Euro</option>
                <option value="USD">USD ($) - Dólar estadounidense</option>
                <option value="GBP">GBP (£) - Libra esterlina</option>
                <option value="CHF">CHF (Fr) - Franco suizo</option>
                <option value="JPY">JPY (¥) - Yen japonés</option>
                <option value="CNY">CNY (¥) - Yuan chino</option>
                <option value="MXN">MXN ($) - Peso mexicano</option>
                <option value="ARS">ARS ($) - Peso argentino</option>
                <option value="COP">COP ($) - Peso colombiano</option>
                <option value="CLP">CLP ($) - Peso chileno</option>
              </select>
            </div>

            <Input
              label="Teléfono"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+34 123 456 789"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contacto@miempresa.com"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo de la Empresa (PNG)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500">
                  Sube un archivo PNG (máximo 2MB). Se guardará en formato base64.
                </p>
                {logoPreview && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                    <div className="inline-block p-2 bg-gray-100 rounded-lg">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Secuencias de Facturas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Facturas de Venta</h4>
                <Input
                  label="Prefijo"
                  name="salesInvoicePrefix"
                  value={formData.salesInvoicePrefix}
                  onChange={handleChange}
                  placeholder="INV"
                  helperText="Ej: INV generará INV-001, INV-002..."
                />
                <Input
                  label="Próximo Número"
                  name="salesInvoiceNextNumber"
                  type="number"
                  min="1"
                  value={formData.salesInvoiceNextNumber}
                  onChange={(e) => setFormData({ ...formData, salesInvoiceNextNumber: parseInt(e.target.value) || 1 })}
                  helperText="Próximo número de factura de venta a generar"
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Facturas de Compra</h4>
                <Input
                  label="Prefijo"
                  name="purchaseInvoicePrefix"
                  value={formData.purchaseInvoicePrefix}
                  onChange={handleChange}
                  placeholder="INVO"
                  helperText="Ej: INVO generará INVO-001, INVO-002..."
                />
                <Input
                  label="Próximo Número"
                  name="purchaseInvoiceNextNumber"
                  type="number"
                  min="1"
                  value={formData.purchaseInvoiceNextNumber}
                  onChange={(e) => setFormData({ ...formData, purchaseInvoiceNextNumber: parseInt(e.target.value) || 1 })}
                  helperText="Próximo número de factura de compra a generar"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Colores del Tema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Color Principal
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="#10b981"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Color Secundario
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="secondaryColor"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="#059669"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
