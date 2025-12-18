'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';

interface Company {
  name: string;
  logo: string | null;
}

interface User {
  name: string;
  email: string;
}

interface Product {
  code: string;
  name: string;
}

interface WorkOrderItem {
  id: string;
  productId: string;
  product: Product;
  description: string;
  quantity: number;
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
  responsible: User;
  company: Company;
  notes: string | null;
  items: WorkOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export default function PublicWorkOrderPage() {
  const params = useParams();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkOrder();
    // Auto-refresh cada 30 segundos para ver actualizaciones
    const interval = setInterval(fetchWorkOrder, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWorkOrder = async () => {
    try {
      const res = await fetch(`/api/public/work-orders/${params.token}`);
      if (res.ok) {
        const data = await res.json();
        setWorkOrder(data);
        setError('');
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
    if (!workOrder || workOrder.items.length === 0) return 0;
    const completed = workOrder.items.filter(item => item.status === 'COMPLETED').length;
    return Math.round((completed / workOrder.items.length) * 100);
  };

  const getOverallStatus = () => {
    if (!workOrder || workOrder.items.length === 0) return 'PENDING';
    
    const allCompleted = workOrder.items.every(item => item.status === 'COMPLETED');
    if (allCompleted) return 'COMPLETED';
    
    const anyInProgress = workOrder.items.some(item => item.status === 'IN_PROGRESS');
    if (anyInProgress) return 'IN_PROGRESS';
    
    return 'PENDING';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando orden de trabajo...</p>
        </div>
      </div>
    );
  }

  if (error || !workOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Orden no encontrada</h2>
            <p className="text-gray-600">
              {error || 'El enlace puede ser inválido o la orden ya no está disponible.'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const progress = getOverallProgress();
  const overallStatus = getOverallStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Encabezado con logo de empresa */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {workOrder.company.logo && (
                <img
                  src={workOrder.company.logo}
                  alt={workOrder.company.name}
                  className="h-16 mb-4 object-contain"
                />
              )}
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {workOrder.number}
              </h1>
              <p className="text-lg text-gray-600">{workOrder.company.name}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(overallStatus)}
              <p className="text-sm text-gray-500 mt-2">
                Actualizado: {new Date(workOrder.updatedAt).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        </Card>

        {/* Información general */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Responsable</p>
              <p className="text-base font-medium text-gray-900">{workOrder.responsible.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha Programada</p>
              <p className="text-base font-medium text-gray-900">
                {new Date(workOrder.scheduledDate).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Aprobación del Cliente</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  workOrder.approvedByClient
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {workOrder.approvedByClient ? '✓ Aprobado' : '⏳ Pendiente de Aprobación'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Creación</p>
              <p className="text-base font-medium text-gray-900">
                {new Date(workOrder.createdAt).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Progreso general */}
        <Card>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Progreso General</h2>
              <span className="text-2xl font-bold text-teal-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-teal-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              {workOrder.items.filter(item => item.status === 'COMPLETED').length} de{' '}
              {workOrder.items.length} trabajos completados
            </div>
          </div>
        </Card>

        {/* Lista de trabajos */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Trabajos</h2>
          <div className="space-y-4">
            {workOrder.items.map((item, index) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.product.code} - {item.product.name}
                        </h3>
                      </div>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <p className="text-sm text-gray-500">
                        Cantidad: <strong>{item.quantity}</strong>
                      </p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Línea de tiempo */}
                  {(item.startedAt || item.completedAt) && (
                    <div className="border-t pt-3 mt-3">
                      <div className="flex gap-6 text-sm text-gray-600">
                        {item.startedAt && (
                          <div>
                            <span className="text-gray-500">Iniciado:</span>{' '}
                            <strong>
                              {new Date(item.startedAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </div>
                        )}
                        {item.completedAt && (
                          <div>
                            <span className="text-gray-500">Finalizado:</span>{' '}
                            <strong>
                              {new Date(item.completedAt).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Notas */}
        {workOrder.notes && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Notas</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{workOrder.notes}</p>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>Esta página se actualiza automáticamente cada 30 segundos</p>
          <p className="mt-1">Última actualización: {new Date().toLocaleTimeString('es-ES')}</p>
        </div>
      </div>
    </div>
  );
}
