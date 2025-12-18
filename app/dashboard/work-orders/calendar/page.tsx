'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WorkOrderItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  durationHours: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string | null;
  completedAt: string | null;
  product: {
    id: string;
    name: string;
    code: string;
    price: number;
  };
}

interface WorkOrder {
  id: string;
  number: string;
  date: string;
  scheduledDate: string;
  approvedByClient: boolean;
  notes: string | null;
  items: WorkOrderItem[];
  createdBy: {
    name: string;
    email: string;
  };
  responsible: {
    name: string;
    email: string;
  };
}

interface CalendarDay {
  date: Date;
  workOrders: WorkOrder[];
  isCurrentMonth: boolean;
}

type ViewMode = 'day' | 'week' | 'month';

export default function WorkOrdersCalendarPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  // Obtener días de la semana actual
  const getWeekDays = (date: Date): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const currentDay = date.getDay(); // 0 = domingo
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDay);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push({
        date: d,
        workOrders: [],
        isCurrentMonth: d.getMonth() === date.getMonth(),
      });
    }
    
    return days;
  };

  // Obtener solo el día actual
  const getSingleDay = (date: Date): CalendarDay[] => {
    return [{
      date: new Date(date),
      workOrders: [],
      isCurrentMonth: true,
    }];
  };

  // Obtener el primer y último día del mes
  const getMonthDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Días del mes anterior para completar la primera semana
    const firstDayOfWeek = firstDay.getDay(); // 0 = domingo
    const prevMonthDays: CalendarDay[] = [];
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      prevMonthDays.push({
        date: d,
        workOrders: [],
        isCurrentMonth: false,
      });
    }
    
    // Días del mes actual
    const currentMonthDays: CalendarDay[] = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      currentMonthDays.push({
        date: d,
        workOrders: [],
        isCurrentMonth: true,
      });
    }
    
    // Días del mes siguiente para completar la última semana
    const lastDayOfWeek = lastDay.getDay();
    const nextMonthDays: CalendarDay[] = [];
    
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const d = new Date(year, month + 1, i);
      nextMonthDays.push({
        date: d,
        workOrders: [],
        isCurrentMonth: false,
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Asignar órdenes de trabajo a los días correspondientes
  const assignWorkOrdersToDays = (days: CalendarDay[]): CalendarDay[] => {
    console.log('Total órdenes de trabajo:', workOrders.length);
    
    return days.map(day => {
      const dayWorkOrders = workOrders.filter(wo => {
        const woDate = new Date(wo.scheduledDate);
        const matches = (
          woDate.getDate() === day.date.getDate() &&
          woDate.getMonth() === day.date.getMonth() &&
          woDate.getFullYear() === day.date.getFullYear()
        );
        
        if (matches) {
          console.log(`OT ${wo.number} asignada a ${day.date.toLocaleDateString()}`);
        }
        
        return matches;
      });
      
      return {
        ...day,
        workOrders: dayWorkOrders,
      };
    });
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      
      // Obtener la compañía activa
      const companiesRes = await fetch('/api/companies');
      if (!companiesRes.ok) {
        throw new Error('Error al cargar compañías');
      }
      
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);
      
      if (!activeCompany) {
        console.log('No hay compañía activa');
        setLoading(false);
        return;
      }

      setSelectedCompanyId(activeCompany.id);

      const response = await fetch(`/api/work-orders?companyId=${activeCompany.id}`);
      if (!response.ok) {
        throw new Error('Error al cargar órdenes de trabajo');
      }

      const data = await response.json();
      console.log('Órdenes de trabajo cargadas:', data);
      setWorkOrders(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const getDays = (): CalendarDay[] => {
    switch (viewMode) {
      case 'day':
        return assignWorkOrdersToDays(getSingleDay(currentDate));
      case 'week':
        return assignWorkOrdersToDays(getWeekDays(currentDate));
      case 'month':
      default:
        return assignWorkOrdersToDays(getMonthDays(currentDate));
    }
  };

  const days = getDays();
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const prevPeriod = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
        break;
      case 'week':
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
        break;
      case 'month':
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
        break;
    }
  };

  const nextPeriod = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
        break;
      case 'week':
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
        break;
      case 'month':
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
        break;
    }
  };

  const getPeriodLabel = (): string => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'COMPLETED':
        return 'Completada';
      default:
        return status;
    }
  };

  const calculateTotalHours = (items: WorkOrderItem[]) => {
    return items.reduce((total, item) => total + item.durationHours, 0);
  };

  const getOverallStatus = (items: WorkOrderItem[]) => {
    if (items.every(item => item.status === 'COMPLETED')) return 'COMPLETED';
    if (items.some(item => item.status === 'IN_PROGRESS')) return 'IN_PROGRESS';
    return 'PENDING';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario de Órdenes de Trabajo</h1>
          <p className="text-gray-600">Vista mensual de trabajos programados ({workOrders.length} órdenes)</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/work-orders"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            📋 Vista Lista
          </Link>
        </div>
      </div>

      {/* Controles de navegación del calendario */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Selector de vista */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'day'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'week'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'month'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mes
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={prevPeriod}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ← Anterior
          </button>
          
          <div className="flex gap-4 items-center">
            <h2 className="text-2xl font-bold capitalize text-black">
              {getPeriodLabel()}
            </h2>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Hoy
            </button>
          </div>
          
          <button
            onClick={nextPeriod}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Encabezado de días de la semana - solo en vista semanal y mensual */}
        {viewMode !== 'day' && (
          <div className="grid grid-cols-7 border-b">
            {weekDays.map(day => (
              <div
                key={day}
                className="p-4 text-center font-semibold text-gray-700 bg-gray-50"
              >
                {day}
              </div>
            ))}
          </div>
        )}

        {/* Días */}
        <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} auto-rows-fr`}>
          {days.map((day, index) => {
            const isToday =
              day.date.getDate() === new Date().getDate() &&
              day.date.getMonth() === new Date().getMonth() &&
              day.date.getFullYear() === new Date().getFullYear();

            const minHeight = viewMode === 'day' ? 'min-h-[400px]' : viewMode === 'week' ? 'min-h-[200px]' : 'min-h-[120px]';

            return (
              <div
                key={index}
                className={`${minHeight} border-r border-b p-2 ${
                  !day.isCurrentMonth && viewMode === 'month' ? 'bg-gray-50' : 'bg-white'
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div
                  className={`${viewMode === 'day' ? 'text-2xl' : 'text-sm'} font-semibold mb-2 ${
                    !day.isCurrentMonth && viewMode === 'month' ? 'text-gray-400' : 'text-gray-700'
                  } ${isToday ? 'text-blue-600' : ''}`}
                >
                  {viewMode === 'day' 
                    ? day.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                    : day.date.getDate()
                  }
                </div>

                {/* Órdenes de trabajo del día */}
                <div className={viewMode === 'day' ? 'space-y-3' : 'space-y-1'}>
                  {day.workOrders.length === 0 && viewMode === 'day' && (
                    <div className="text-gray-400 text-center py-12">
                      No hay órdenes de trabajo para este día
                    </div>
                  )}
                  {day.workOrders.map(wo => {
                    const totalHours = calculateTotalHours(wo.items);
                    const status = getOverallStatus(wo.items);
                    
                    if (viewMode === 'day') {
                      // Vista detallada para día
                      return (
                        <div
                          key={wo.id}
                          onClick={() => router.push(`/dashboard/work-orders/${wo.id}`)}
                          className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-lg transition-shadow ${getStatusColor(
                            status
                          )}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-lg font-bold">{wo.number}</div>
                              <div className="text-sm text-gray-600">{wo.responsible.name}</div>
                            </div>
                            <div className="text-sm font-semibold">⏱️ {totalHours}h</div>
                          </div>
                          {wo.notes && (
                            <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {wo.notes}
                            </div>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            {wo.items.map((item, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-white rounded border">
                                {item.product.name} ({item.durationHours}h)
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    } else if (viewMode === 'week') {
                      // Vista media para semana
                      return (
                        <div
                          key={wo.id}
                          onClick={() => router.push(`/dashboard/work-orders/${wo.id}`)}
                          className={`text-xs p-2 rounded border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(
                            status
                          )}`}
                          title={`${wo.number} - ${wo.responsible.name} - ${totalHours}h`}
                        >
                          <div className="font-semibold truncate">{wo.number}</div>
                          <div className="text-[10px] truncate">{wo.responsible.name}</div>
                          <div className="text-[10px] flex items-center gap-1">
                            ⏱️ {totalHours}h
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">
                            {wo.items.length} trabajo{wo.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      );
                    } else {
                      // Vista compacta para mes
                      return (
                        <div
                          key={wo.id}
                          onClick={() => router.push(`/dashboard/work-orders/${wo.id}`)}
                          className={`text-xs p-1.5 rounded border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(
                            status
                          )}`}
                          title={`${wo.number} - ${wo.responsible.name} - ${totalHours}h`}
                        >
                          <div className="font-semibold truncate">{wo.number}</div>
                          <div className="text-[10px] truncate">{wo.responsible.name}</div>
                          <div className="text-[10px] flex items-center gap-1">
                            ⏱️ {totalHours}h
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="bg-white rounded-lg shadow p-4 mt-6">
        <h3 className="font-semibold text-gray-700 mb-3">Leyenda de Estados</h3>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-600">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-600">En Progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Completada</span>
          </div>
        </div>
      </div>
    </div>
  );
}
