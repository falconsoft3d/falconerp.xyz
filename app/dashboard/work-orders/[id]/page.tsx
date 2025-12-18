'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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

export default function WorkOrderExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    fetchWorkOrder();
  }, []);

  const fetchWorkOrder = async () => {
    try {
      const res = await fetch(`/api/work-orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setWorkOrder(data);
        // Si ya tiene token, generar la URL
        if (data.publicToken) {
          const baseUrl = window.location.origin;
          setPublicUrl(`${baseUrl}/public/work-orders/${data.publicToken}`);
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Error al cargar la orden');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePublicLink = async () => {
    setGeneratingLink(true);
    setError('');

    try {
      const res = await fetch(`/api/work-orders/${params.id}/public-link`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/public/work-orders/${data.publicToken}`;
        setPublicUrl(url);
        await fetchWorkOrder(); // Actualizar para obtener el token
      } else {
        const data = await res.json();
        setError(data.error || 'Error al generar enlace');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al generar enlace');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (publicUrl) {
      try {
        await navigator.clipboard.writeText(publicUrl);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
      } catch (error) {
        console.error('Error al copiar:', error);
        setError('Error al copiar enlace');
      }
    }
  };

  const handleItemAction = async (itemId: string, action: 'start' | 'complete' | 'reset') => {
    setUpdatingItemId(itemId);
    setError('');

    try {
      const res = await fetch(`/api/work-orders/${params.id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        await fetchWorkOrder();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar línea');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al actualizar línea');
    } finally {
      setUpdatingItemId(null);
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
      COMPLETED: '✅ Completado',
    };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getOverallProgress = () => {
    if (!workOrder) return 0;
    const completed = workOrder.items.filter(item => item.status === 'COMPLETED').length;
    return Math.round((completed / workOrder.items.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando orden de trabajo...</p>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error || 'Orden de trabajo no encontrada'}
      </div>
    );
  }

  const progress = getOverallProgress();
  const allCompleted = workOrder.items.every(item => item.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/work-orders')}>
              ← Volver
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">{workOrder.number}</h1>
            {allCompleted && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✅ Finalizada
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <span className="font-medium">Responsable:</span>
              <span>{workOrder.responsible.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Fecha programada:</span>
              <span>
                {new Date(workOrder.scheduledDate).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Creado por:</span>
              <span>{workOrder.user.name}</span>
            </div>
          </div>
        </div>

        {/* Botón para compartir */}
        <div className="flex flex-col gap-2">
          {!publicUrl ? (
            <Button
              onClick={handleGeneratePublicLink}
              disabled={generatingLink}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generatingLink ? '...' : '🔗 Generar Enlace Público'}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={handleCopyLink}
                className="bg-purple-600 hover:bg-purple-700 w-full"
              >
                {showCopySuccess ? '✓ Copiado!' : '📋 Copiar Enlace'}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(publicUrl, '_blank')}
                className="text-sm w-full"
              >
                👁️ Ver Vista Pública
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Barra de progreso */}
      <Card>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Progreso General</span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-teal-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500">
            {workOrder.items.filter(item => item.status === 'COMPLETED').length} de {workOrder.items.length} trabajos completados
          </div>
        </div>
      </Card>

      {/* Lista de trabajos */}
      <div className="space-y-4">
        {workOrder.items.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Header del trabajo */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.product.code} - {item.product.name}
                    </h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <p className="text-gray-600 mb-2">{item.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Cantidad: <strong>{item.quantity}</strong></span>
                    <span>⏱️ Duración: <strong>{item.durationHours}h</strong></span>
                    {item.startedAt && (
                      <span>
                        Iniciado: {new Date(item.startedAt).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {item.completedAt && (
                      <span>
                        Finalizado: {new Date(item.completedAt).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  {item.status === 'PENDING' && (
                    <Button
                      onClick={() => handleItemAction(item.id, 'start')}
                      disabled={updatingItemId === item.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updatingItemId === item.id ? '...' : '▶️ Iniciar'}
                    </Button>
                  )}
                  
                  {item.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={() => handleItemAction(item.id, 'complete')}
                      disabled={updatingItemId === item.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {updatingItemId === item.id ? '...' : '✓ Finalizar'}
                    </Button>
                  )}
                  
                  {item.status === 'COMPLETED' && (
                    <Button
                      variant="outline"
                      onClick={() => handleItemAction(item.id, 'reset')}
                      disabled={updatingItemId === item.id}
                    >
                      {updatingItemId === item.id ? '...' : '↺ Reiniciar'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Notas */}
      {workOrder.notes && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Notas</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{workOrder.notes}</p>
        </Card>
      )}
    </div>
  );
}
