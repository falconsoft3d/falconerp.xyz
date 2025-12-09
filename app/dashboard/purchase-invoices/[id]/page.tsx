'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Contact {
  id: string;
  name: string;
  nif?: string;
  email?: string;
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

interface Invoice {
  id: string;
  number: string;
  supplierReference?: string;
  date: string;
  dueDate: string | null;
  currency: string;
  status: string;
  paymentStatus: string;
  notes: string | null;
  contactId: string;
  company?: {
    name: string;
    nif?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
  contact?: {
    name: string;
    nif?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    id: string;
    productId: string | null;
    description: string;
    quantity: number;
    price: number;
    tax: number;
  }>;
}

export default function EditPurchaseInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const getDefaultDueDate = () => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    number: '',
    contactId: '',
    supplierReference: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: getDefaultDueDate(),
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
    const initialize = async () => {
      await fetchActiveCompany();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (activeCompany && invoiceId) {
      Promise.all([
        fetchSuppliers(activeCompany.id),
        fetchProducts(activeCompany.id),
        fetchInvoice(),
      ]);
    }
  }, [activeCompany, invoiceId]);

  const fetchActiveCompany = async () => {
    try {
      const res = await fetch('/api/companies?active=true');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setActiveCompany(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching active company:', error);
    }
  };

  const fetchSuppliers = async (companyId: string) => {
    try {
      const res = await fetch(`/api/contacts?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        const suppliersList = data.filter((c: any) => c.isSupplier);
        setSuppliers(suppliersList);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
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
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${invoiceId}`);
      
      if (!res.ok) {
        throw new Error('Error al cargar la factura');
      }

      const data = await res.json();
      setInvoice(data);

      setFormData({
        number: data.number || '',
        contactId: data.contactId || '',
        supplierReference: data.supplierReference || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : getDefaultDueDate(),
        currency: data.currency || 'EUR',
        status: data.status || 'DRAFT',
        paymentStatus: data.paymentStatus || 'UNPAID',
        notes: data.notes || '',
      });

      if (data.items && data.items.length > 0) {
        const loadedItems = data.items.map((item: any) => ({
          productId: item.productId || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          tax: item.tax || 21,
          subtotal: (item.quantity || 0) * (item.price || 0),
          taxAmount: ((item.quantity || 0) * (item.price || 0) * (item.tax || 0)) / 100,
          total: (item.quantity || 0) * (item.price || 0) * (1 + (item.tax || 0) / 100),
        }));
        setItems(loadedItems);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading invoice:', error);
      setError('Error al cargar la factura');
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].description = product.name;
        newItems[index].price = product.price;
        newItems[index].tax = product.tax;
      }
    }

    const quantity = newItems[index].quantity;
    const price = newItems[index].price;
    const tax = newItems[index].tax;

    newItems[index].subtotal = quantity * price;
    newItems[index].taxAmount = (quantity * price * tax) / 100;
    newItems[index].total = quantity * price * (1 + tax / 100);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contactId) {
      setError('Debes seleccionar un proveedor');
      return;
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      setError('Debes agregar al menos un producto');
      return;
    }

    if (formData.status === 'VALIDATED') {
      setError('No puedes editar una factura validada');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const totals = getTotals();
      const payload = {
        companyId: activeCompany.id,
        contactId: formData.contactId,
        type: 'PURCHASE',
        number: formData.number,
        supplierReference: formData.supplierReference,
        date: formData.date,
        dueDate: formData.dueDate,
        currency: formData.currency,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        items: items.filter(item => item.description).map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          tax: item.tax,
          subtotal: item.subtotal,
          taxAmount: item.taxAmount,
          total: item.total,
        })),
      };

      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar la factura');
      }

      alert('Factura actualizada exitosamente');
      router.push('/dashboard/purchase-invoices');
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Error al actualizar la factura');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Error al eliminar la factura');
      }

      alert('Factura eliminada exitosamente');
      router.push('/dashboard/purchase-invoices');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la factura');
    }
  };

  const handleDuplicate = async () => {
    if (!invoice) return;

    try {
      const totals = getTotals();
      const payload = {
        companyId: activeCompany.id,
        contactId: formData.contactId,
        type: 'PURCHASE',
        supplierReference: formData.supplierReference,
        date: new Date().toISOString().split('T')[0],
        dueDate: getDefaultDueDate(),
        currency: formData.currency,
        status: 'DRAFT',
        paymentStatus: 'UNPAID',
        notes: formData.notes,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
        items: items.filter(item => item.description).map(item => ({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          tax: item.tax,
          subtotal: item.subtotal,
          taxAmount: item.taxAmount,
          total: item.total,
        })),
      };

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Error al duplicar la factura');
      }

      const data = await res.json();
      alert('Factura duplicada exitosamente');
      router.push(`/dashboard/purchase-invoices/${data.id}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al duplicar la factura');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </div>
    );
  }

  const totals = getTotals();
  const isValidated = formData.status === 'VALIDATED';

  return (
    <div className="p-6">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Factura de Compra</h1>
          <p className="text-sm text-gray-600 mt-1">
            {formData.number}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/purchase-invoices')}
          >
            Volver
          </Button>
          <Button
            variant="secondary"
            onClick={handleDuplicate}
          >
            Duplicar
          </Button>
          <Button
            variant="secondary"
            onClick={handlePrint}
          >
            Imprimir
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={isValidated}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg no-print">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {isValidated && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg no-print">
          <p className="text-yellow-800">
            Esta factura está validada y no puede ser editada. Solo puedes cambiar el estado de pago.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="print-content">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Información General</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Factura *
                    </label>
                    <Input
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      disabled={isValidated}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Proveedor *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.contactId}
                      onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                      disabled={isValidated}
                      required
                    >
                      <option value="">Seleccionar proveedor</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referencia del Proveedor
                    </label>
                    <Input
                      value={formData.supplierReference}
                      onChange={(e) => setFormData({ ...formData, supplierReference: e.target.value })}
                      disabled={isValidated}
                      placeholder="Ref. del proveedor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha *
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      disabled={isValidated}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Vencimiento
                    </label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      disabled={isValidated}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Moneda *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      disabled={isValidated}
                      required
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={isValidated}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            </Card>

            <Card className="print-content">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Productos / Servicios</h2>
                  {!isValidated && (
                    <Button type="button" variant="secondary" onClick={addItem} className="no-print">
                      + Agregar Línea
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">Producto</th>
                        <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">Descripción</th>
                        <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Cant.</th>
                        <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Precio</th>
                        <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">IVA %</th>
                        <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Total</th>
                        {!isValidated && <th className="w-20 no-print"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-2">
                            <select
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              disabled={isValidated}
                            >
                              <option value="">-</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.code} - {product.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              disabled={isValidated}
                              className="text-sm"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              disabled={isValidated}
                              className="text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                              disabled={isValidated}
                              className="text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.tax}
                              onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                              disabled={isValidated}
                              className="text-sm text-right"
                            />
                          </td>
                          <td className="py-2 px-2 text-right text-sm font-medium">
                            {item.total.toFixed(2)} {formData.currency}
                          </td>
                          {!isValidated && (
                            <td className="py-2 px-2 text-center no-print">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="p-6 no-print">
                <h2 className="text-lg font-semibold mb-4">Estado</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado de la Factura
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'VALIDATED' })}
                      disabled={isValidated}
                    >
                      <option value="DRAFT">Borrador</option>
                      <option value="VALIDATED">Validada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado de Pago
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as 'UNPAID' | 'PAID' })}
                    >
                      <option value="UNPAID">No Pagada</option>
                      <option value="PAID">Pagada</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="print-content">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Resumen</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{totals.subtotal.toFixed(2)} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">{totals.taxAmount.toFixed(2)} {formData.currency}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total:</span>
                    <span>{totals.total.toFixed(2)} {formData.currency}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6 no-print"
                  disabled={saving || isValidated}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
