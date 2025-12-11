'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Contact {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
  isCustomer?: boolean;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  tax: number;
}

interface Project {
  id: string;
  name: string;
}

interface QuoteItem {
  productId?: string;
  projectId?: string;
  description: string;
  quantity: number;
  price: number;
  tax: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [clients, setClients] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Función para calcular fecha de expiración (30 días después)
  const calculateExpiryDate = (quoteDate: string): string => {
    const date = new Date(quoteDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    contactId: '',
    date: today,
    expiryDate: calculateExpiryDate(today),
    currency: 'EUR',
    notes: '',
  });

  const [items, setItems] = useState<QuoteItem[]>([
    {
      productId: '',
      projectId: '',
      description: '',
      quantity: 1,
      price: 0,
      tax: 21,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    },
  ]);

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
          setFormData(prev => ({ ...prev, currency: active.currency || 'EUR' }));
          fetchClients(active.id);
          fetchProducts(active.id);
          fetchProjects(active.id);
        } else {
          setError('No hay empresa activa');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setError('Error al cargar empresa');
      setLoading(false);
    }
  };

  const fetchClients = async (companyId: string) => {
    try {
      const res = await fetch(`/api/contacts?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.filter((c: Contact) => c.isCustomer));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async (companyId: string) => {
    try {
      const res = await fetch(`/api/products?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (companyId: string) => {
    try {
      const res = await fetch(`/api/projects?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const calculateItemTotals = (item: Partial<QuoteItem>): QuoteItem => {
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    const tax = item.tax || 0;
    const subtotal = quantity * price;
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount;

    return {
      productId: item.productId,
      projectId: item.projectId,
      description: item.description || '',
      quantity,
      price,
      tax,
      subtotal,
      taxAmount,
      total,
    };
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };

    // Si se selecciona un producto, rellenar datos
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].price = product.price;
        newItems[index].tax = product.tax;
      }
    }

    // Recalcular totales
    newItems[index] = calculateItemTotals(newItems[index]);
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: '',
        projectId: '',
        description: '',
        quantity: 1,
        price: 0,
        tax: 21,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const getTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    return { subtotal, taxAmount, total };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Validaciones
    if (!formData.contactId) {
      setError('Debes seleccionar un cliente');
      setSaving(false);
      return;
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      setError('Debes agregar al menos un item');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompany.id,
          contactId: formData.contactId,
          date: formData.date,
          expiryDate: formData.expiryDate || null,
          currency: formData.currency,
          notes: formData.notes,
          items: items.map(item => ({
            productId: item.productId || undefined,
            projectId: item.projectId || undefined,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax,
          })),
        }),
      });

      if (res.ok) {
        const quote = await res.json();
        alert('Cotización creada exitosamente');
        router.push(`/dashboard/quotes`);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear cotización');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      setError('Error al crear cotización');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error && !activeCompany) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const totals = getTotals();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Nueva Cotización</h1>
          <p className="text-gray-600 mt-1">
            Crear una nueva cotización para {activeCompany?.name}
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos generales */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente *
              </label>
              <select
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.nif ? `(${client.nif})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF (Fr)</option>
                <option value="MXN">MXN ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    date: e.target.value,
                    expiryDate: calculateExpiryDate(e.target.value)
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Expiración
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas / Observaciones
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Agregar notas u observaciones..."
            />
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Artículos / Servicios</h2>
            <Button type="button" onClick={addItem} size="sm">
              + Agregar Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Producto (Opcional)
                    </label>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
                    >
                      <option value="">Seleccionar producto...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proyecto (Opcional)
                    </label>
                    <select
                      value={item.projectId || ''}
                      onChange={(e) => handleItemChange(index, 'projectId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
                    >
                      <option value="">Seleccionar proyecto...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                      placeholder="Descripción del artículo/servicio"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IVA (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={item.tax}
                      onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtotal
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
                      {item.subtotal.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IVA
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700">
                      {item.taxAmount.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900">
                      {item.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {items.length > 1 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                    {totals.subtotal.toFixed(2)} {getCurrencySymbol(formData.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>IVA:</span>
                  <span className="font-medium">
                    {totals.taxAmount.toFixed(2)} {getCurrencySymbol(formData.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-300">
                  <span>Total:</span>
                  <span>
                    {totals.total.toFixed(2)} {getCurrencySymbol(formData.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear Cotización'}
          </Button>
        </div>
      </form>
    </div>
  );
}
