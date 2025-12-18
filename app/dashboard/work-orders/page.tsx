'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
}

interface WorkOrderItem {
  id: string;
  productId: string;
  product: Product;
  description: string;
  quantity: number;
  durationHours: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
}

interface WorkOrder {
  id: string;
  number: string;
  date: string;
  scheduledDate: string;
  approvedByClient: boolean;
  userId: string;
  user: User;
  responsibleId: string;
  responsible: User;
  notes: string | null;
  items: WorkOrderItem[];
  createdAt: string;
  publicToken: string | null;
}

export default function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResponsible, setFilterResponsible] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    scheduledDate: '',
    approvedByClient: false,
    responsibleId: '',
    notes: '',
    items: [{ productId: '', description: '', quantity: 1 }],
  });

  useEffect(() => {
    fetchWorkOrders();
    fetchUsers();
    fetchProducts();
  }, []);

  useEffect(() => {
    filterWorkOrders();
  }, [workOrders, searchTerm, filterResponsible, filterApproved]);

  const filterWorkOrders = () => {
    let filtered = [...workOrders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (wo) =>
          wo.number.toLowerCase().includes(term) ||
          wo.responsible.name.toLowerCase().includes(term) ||
          wo.notes?.toLowerCase().includes(term)
      );
    }

    if (filterResponsible) {
      filtered = filtered.filter((wo) => wo.responsibleId === filterResponsible);
    }

    if (filterApproved !== '') {
      const approved = filterApproved === 'true';
      filtered = filtered.filter((wo) => wo.approvedByClient === approved);
    }

    setFilteredWorkOrders(filtered);
  };

  const getWorkOrderStatus = (wo: WorkOrder) => {
    if (wo.items.length === 0) return 'PENDING';
    
    const allCompleted = wo.items.every(item => item.status === 'COMPLETED');
    if (allCompleted) return 'COMPLETED';
    
    const anyInProgress = wo.items.some(item => item.status === 'IN_PROGRESS');
    if (anyInProgress) return 'IN_PROGRESS';
    
    return 'PENDING';
  };

  const getWorkOrderProgress = (wo: WorkOrder) => {
    if (wo.items.length === 0) return 0;
    const completed = wo.items.filter(item => item.status === 'COMPLETED').length;
    return Math.round((completed / wo.items.length) * 100);
  };

  const handleCompleteWorkOrder = async (woId: string) => {
    setCompletingId(woId);
    setError('');

    try {
      const wo = workOrders.find(w => w.id === woId);
      if (!wo) return;

      // Completar todos los items pendientes o en progreso
      const promises = wo.items
        .filter(item => item.status !== 'COMPLETED')
        .map(item => 
          fetch(`/api/work-orders/${woId}/items/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete' }),
          })
        );

      await Promise.all(promises);
      await fetchWorkOrders();
    } catch (error) {
      console.error('Error:', error);
      setError('Error al completar orden de trabajo');
    } finally {
      setCompletingId(null);
    }
  };

  const handleReopenWorkOrder = async (woId: string) => {
    setCompletingId(woId);
    setError('');

    try {
      const wo = workOrders.find(w => w.id === woId);
      if (!wo) return;

      // Reiniciar todos los items
      const promises = wo.items.map(item => 
        fetch(`/api/work-orders/${woId}/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' }),
        })
      );

      await Promise.all(promises);
      await fetchWorkOrders();
    } catch (error) {
      console.error('Error:', error);
      setError('Error al reabrir orden de trabajo');
    } finally {
      setCompletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
    };
    const labels = {
      PENDING: '⏳ Pendiente',
      IN_PROGRESS: '🔄 En Proceso',
      COMPLETED: '✅ Finalizada',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const fetchWorkOrders = async () => {
    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/work-orders?companyId=${activeCompany.id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkOrders(data);
      } else {
        const errorData = await res.json();
        console.error('Error del servidor:', errorData);
        setError(`Error al cargar órdenes: ${errorData.details || errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Error al cargar órdenes: ${error instanceof Error ? error.message : 'Error de conexión'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) return;

      const res = await fetch(`/api/products?companyId=${activeCompany.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa');
        return;
      }

      const url = editingId ? `/api/work-orders/${editingId}` : '/api/work-orders';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        companyId: activeCompany.id,
        items: formData.items.filter(item => item.productId && item.description),
      };

      console.log('Enviando datos:', payload);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Respuesta:', data);

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          scheduledDate: '',
          approvedByClient: false,
          responsibleId: '',
          notes: '',
          items: [{ productId: '', description: '', quantity: 1 }],
        });
        fetchWorkOrders();
      } else {
        setError(data.error || data.details?.[0]?.message || 'Error al guardar orden');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar orden');
    }
  };

  const handleEdit = (wo: WorkOrder) => {
    setEditingId(wo.id);
    setFormData({
      scheduledDate: wo.scheduledDate.substring(0, 16),
      approvedByClient: wo.approvedByClient,
      responsibleId: wo.responsibleId,
      notes: wo.notes || '',
      items: wo.items.map(item => ({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
      })),
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta orden de trabajo?')) return;

    try {
      const res = await fetch(`/api/work-orders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWorkOrders();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar orden');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al eliminar orden');
    }
  };

  const handleShareLink = async (wo: WorkOrder) => {
    try {
      let token = wo.publicToken;
      
      // Si no tiene token, generar uno nuevo
      if (!token) {
        const res = await fetch(`/api/work-orders/${wo.id}/public-link`, {
          method: 'POST',
        });
        
        if (res.ok) {
          const data = await res.json();
          token = data.publicToken;
          await fetchWorkOrders(); // Refrescar lista
        } else {
          setError('Error al generar enlace');
          return;
        }
      }
      
      // Copiar enlace al portapapeles
      const baseUrl = window.location.origin;
      const publicUrl = `${baseUrl}/public/work-orders/${token}`;
      await navigator.clipboard.writeText(publicUrl);
      alert('✓ Enlace copiado al portapapeles');
    } catch (error) {
      console.error('Error:', error);
      setError('Error al compartir enlace');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      scheduledDate: '',
      approvedByClient: false,
      responsibleId: '',
      notes: '',
      items: [{ productId: '', description: '', quantity: 1 }],
    });
    setError('');
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', description: '', quantity: 1 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando órdenes de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Órdenes de Trabajo</h1>
          <p className="text-gray-600 mt-1">Gestiona las órdenes de trabajo</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/work-orders/calendar')}
          >
            📅 Vista Calendario
          </Button>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <span className="mr-2">+</span>
              Nueva Orden
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b pb-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
              </h2>
              {editingId && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-teal-600">
                      {workOrders.find(wo => wo.id === editingId)?.number}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Creado por:</span>
                      <span>{workOrders.find(wo => wo.id === editingId)?.user.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Fecha de creación:</span>
                      <span>
                        {workOrders.find(wo => wo.id === editingId)?.createdAt && 
                          new Date(workOrders.find(wo => wo.id === editingId)!.createdAt).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Programada *
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable *
                </label>
                <select
                  value={formData.responsibleId}
                  onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Seleccionar responsable</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.approvedByClient}
                    onChange={(e) => setFormData({ ...formData, approvedByClient: e.target.checked })}
                    className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Aprobado por cliente
                  </span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Trabajos</h3>
                <Button type="button" variant="outline" onClick={addItem}>
                  + Agregar trabajo
                </Button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-4">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 text-sm"
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.code} - {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-5">
                      <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Descripción del trabajo"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit">
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filtros */}
      {!showForm && workOrders.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <Input
                  type="text"
                  placeholder="Número, responsable, notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsable
                </label>
                <select
                  value={filterResponsible}
                  onChange={(e) => setFilterResponsible(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Todos</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aprobación
                </label>
                <select
                  value={filterApproved}
                  onChange={(e) => setFilterApproved(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Todos</option>
                  <option value="true">Aprobado</option>
                  <option value="false">Pendiente</option>
                </select>
              </div>

              {(searchTerm || filterResponsible || filterApproved) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterResponsible('');
                    setFilterApproved('');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600">
              Mostrando {filteredWorkOrders.length} de {workOrders.length} órdenes
            </div>
          </div>
        </Card>
      )}

      {workOrders.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay órdenes de trabajo
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza creando tu primera orden de trabajo
            </p>
            <Button onClick={() => setShowForm(true)}>Crear Orden</Button>
          </div>
        </Card>
      ) : filteredWorkOrders.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontraron órdenes
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar los filtros de búsqueda
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterResponsible('');
                setFilterApproved('');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </Card>
      ) : (
        !showForm && (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número OT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado / Progreso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Programada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsable
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aprobación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trabajos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWorkOrders.map((wo) => {
                    const status = getWorkOrderStatus(wo);
                    const progress = getWorkOrderProgress(wo);
                    const isCompleting = completingId === wo.id;
                    return (
                      <tr key={wo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {wo.number}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="space-y-2">
                            {getStatusBadge(status)}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  progress === 100 ? 'bg-green-600' : progress > 0 ? 'bg-blue-600' : 'bg-gray-400'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500">
                              {progress}% ({wo.items.filter(i => i.status === 'COMPLETED').length}/{wo.items.length})
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(wo.scheduledDate).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {wo.responsible.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              wo.approvedByClient
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {wo.approvedByClient ? '✓ Aprobado' : '⏳ Pendiente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {wo.items.length} trabajo(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleCompleteWorkOrder(wo.id)}
                                disabled={isCompleting}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                title="Finalizar orden completa"
                              >
                                {isCompleting ? '...' : '✓ Finalizar'}
                              </button>
                            )}
                            {status === 'COMPLETED' && (
                              <button
                                onClick={() => handleReopenWorkOrder(wo.id)}
                                disabled={isCompleting}
                                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                                title="Reabrir orden"
                              >
                                {isCompleting ? '...' : '↺ Reabrir'}
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/dashboard/work-orders/${wo.id}`)}
                              className="text-teal-600 hover:text-teal-900"
                              title="Ver/Ejecutar"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleShareLink(wo)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Compartir enlace público"
                            >
                              🔗
                            </button>
                            <button
                              onClick={() => handleEdit(wo)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(wo.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
