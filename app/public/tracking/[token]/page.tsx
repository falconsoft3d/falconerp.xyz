'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Tracking {
  id: string;
  trackingNumber: string;
  description: string;
  status: string;
  origin: string | null;
  destination: string | null;
  carrier: string | null;
  weight: number | null;
  requestedDate: string;
  receivedDate: string | null;
  paidDate: string | null;
  shippedDate: string | null;
  inTransitDate: string | null;
  deliveredDate: string | null;
  notes: string | null;
  company: {
    name: string;
    logo: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
  };
  contact: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  user: {
    name: string;
    email: string | null;
  } | null;
}

const statusLabels: Record<string, string> = {
  REQUESTED: 'Solicitado',
  RECEIVED: 'Recibido en Oficina',
  PAID: 'Pagado',
  SHIPPED: 'Enviado',
  IN_TRANSIT: 'En Tránsito',
  DELIVERED: 'Entregado',
};

const statusOrder = ['REQUESTED', 'RECEIVED', 'PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];

export default function PublicTrackingPage() {
  const params = useParams();
  const token = params.token as string;
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTracking();
  }, [token]);

  const fetchTracking = async () => {
    try {
      const response = await fetch(`/api/public/tracking/${token}`);
      if (response.ok) {
        const data = await response.json();
        setTracking(data);
      } else {
        setError('Seguimiento no encontrado');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDate = (status: string) => {
    if (!tracking) return null;
    const dateMap: Record<string, string | null> = {
      REQUESTED: tracking.requestedDate,
      RECEIVED: tracking.receivedDate,
      PAID: tracking.paidDate,
      SHIPPED: tracking.shippedDate,
      IN_TRANSIT: tracking.inTransitDate,
      DELIVERED: tracking.deliveredDate,
    };
    return dateMap[status];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentStatusIndex = tracking ? statusOrder.indexOf(tracking.status) : -1;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{error}</h1>
          <p className="mt-2 text-gray-600">Verifica el enlace de seguimiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Logo y nombre de empresa */}
            <div>
              {tracking.company.logo && (
                <img src={tracking.company.logo} alt={tracking.company.name} className="h-16 mb-3" />
              )}
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{tracking.company.name}</h1>
              <p className="text-sm text-gray-500 mb-3">Seguimiento de Envío</p>
              
              {/* Datos de la empresa */}
              <div className="space-y-1 text-sm">
                {tracking.company.phone && (
                  <div className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {tracking.company.phone}
                  </div>
                )}
                {tracking.company.email && (
                  <div className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {tracking.company.email}
                  </div>
                )}
                {tracking.company.address && (
                  <div className="flex items-start text-gray-700">
                    <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {tracking.company.address}
                      {tracking.company.city && `, ${tracking.company.city}`}
                      {tracking.company.country && `, ${tracking.company.country}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Vendedor */}
            {tracking.user && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Atendido por:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {tracking.user.name}
                  </div>
                  {tracking.user.email && (
                    <div className="flex items-center text-gray-700">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {tracking.user.email}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Número de seguimiento y días */}
            <div className="text-right">
              <p className="text-sm text-gray-500">Número de Seguimiento</p>
              <p className="text-2xl font-bold text-gray-900">{tracking.trackingNumber}</p>
              <div className="mt-3 pt-3 border-t">
                <div className="text-3xl font-bold text-indigo-600">
                  {(() => {
                    const startDate = new Date(tracking.requestedDate);
                    const endDate = tracking.deliveredDate ? new Date(tracking.deliveredDate) : new Date();
                    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays;
                  })()}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {(() => {
                    const startDate = new Date(tracking.requestedDate);
                    const endDate = tracking.deliveredDate ? new Date(tracking.deliveredDate) : new Date();
                    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays === 1 ? 'día' : 'días';
                  })()} {tracking.deliveredDate ? 'totales' : 'transcurridos'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Estado del Envío</h2>
          <div className="relative">
            {statusOrder.map((status, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              const statusDate = getStatusDate(status);

              return (
                <div key={status} className="relative pb-8 last:pb-0">
                  {index !== statusOrder.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-full ${
                        isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <div className="relative flex items-start">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        isCompleted
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          isCompleted ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {statusLabels[status]}
                      </p>
                      {statusDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(statusDate)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalles del Envío */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles del Envío</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Descripción</dt>
              <dd className="mt-1 text-sm text-gray-900">{tracking.description}</dd>
            </div>
            {tracking.origin && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Origen</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.origin}</dd>
              </div>
            )}
            {tracking.destination && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Destino</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.destination}</dd>
              </div>
            )}
            {tracking.carrier && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Transportista</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.carrier}</dd>
              </div>
            )}
            {tracking.weight && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Peso</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.weight} kg</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contacto */}
        {tracking.contact && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Información de Contacto</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{tracking.contact.name}</dd>
              </div>
              {tracking.contact.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tracking.contact.email}</dd>
                </div>
              )}
              {tracking.contact.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tracking.contact.phone}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
