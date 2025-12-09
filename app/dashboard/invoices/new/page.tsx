'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Contact {
  id: string;
  name: string;
  nif: string | null;
  email: string | null;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  tax: number;
}

interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  price: number;
  tax: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [clients, setClients] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Función para calcular fecha de vencimiento (1 mes después)
  const calculateDueDate = (invoiceDate: string): string => {
    const date = new Date(invoiceDate);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    contactId: '',
    date: today,
    dueDate: calculateDueDate(today),
    currency: 'EUR',
    status: 'DRAFT' as 'DRAFT' | 'VALIDATED',
    paymentStatus: 'UNPAID' as 'UNPAID' | 'PAID',
    notes: '',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: '',
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
        // Mostrar todos los contactos
        setClients(data);
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

  const calculateItemTotals = (item: Partial<InvoiceItem>): InvoiceItem => {
    const quantity = item.quantity || 0;
    const price = item.price || 0;
    const tax = item.tax || 0;
    const subtotal = quantity * price;
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount;

    return {
      productId: item.productId,
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
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompany.id,
          contactId: formData.contactId,
          date: formData.date,
          dueDate: formData.dueDate || null,
          currency: formData.currency,
          status: formData.status,
          notes: formData.notes,
          items: items.map(item => ({
            productId: item.productId || undefined,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            tax: item.tax,
          })),
        }),
      });

      if (res.ok) {
        const invoice = await res.json();
        alert('Factura creada exitosamente');
        router.push(`/dashboard/invoices`);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear factura');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError('Error al crear factura');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
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

  const totals = getTotals();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Nueva Factura de Venta</h2>
        <p className="text-gray-600 mt-1">Crea una nueva factura para un cliente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Información General</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactId" className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                id="contactId"
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="">Selecciona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.nif && `- ${client.nif}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                id="currency"
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
              label="Fecha de Emisión"
              type="date"
              value={formData.date}
              onChange={(e) => {
                const newDate = e.target.value;
                setFormData({ 
                  ...formData, 
                  date: newDate,
                  dueDate: calculateDueDate(newDate)
                });
              }}
              required
            />

            <Input
              label="Fecha de Vencimiento"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Validación
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="DRAFT">Borrador</option>
                <option value="VALIDATED">Validada</option>
              </select>
            </div>

            <div>
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Pago
              </label>
              <select
                id="paymentStatus"
                value={formData.paymentStatus || 'UNPAID'}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="UNPAID">Sin pagar</option>
                <option value="PAID">Pagada</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Líneas de Factura</h3>
            <Button type="button" variant="outline" onClick={addItem}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Línea
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Producto
                    </label>
                    <select
                      value={item.productId || ''}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900"
                    >
                      <option value="">Seleccionar...</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.code} - {product.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cant.
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IVA%
                    </label>
                    <input
                      type="number"
                      value={item.tax}
                      onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.01"
                      required
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 bg-white text-gray-900"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-2 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded text-gray-900">
                        {getCurrencySymbol(formData.currency)}{item.total.toFixed(2)}
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {getCurrencySymbol(formData.currency)}{totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA:</span>
                  <span className="font-medium text-gray-900">
                    {getCurrencySymbol(formData.currency)}{totals.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-teal-600">
                    {getCurrencySymbol(formData.currency)}{totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notas</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
            placeholder="Notas adicionales..."
          />
        </Card>

        <div className="flex gap-4">
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
                Creando Factura...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Crear y Ver Factura
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
