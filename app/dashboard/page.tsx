'use client';

import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  productsCount: number;
  contactsCount: number;
  invoicesCount: number;
  totalRevenue: number;
  currency: string;
}

interface MonthlyInvoice {
  month: string;
  total: number;
}

export default function DashboardPage() {
  const { primaryColor, secondaryColor } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    productsCount: 0,
    contactsCount: 0,
    invoicesCount: 0,
    totalRevenue: 0,
    currency: 'EUR',
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<MonthlyInvoice[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDashboardStats();
    fetchInvoicesByMonth();
  }, [selectedYear]);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoicesByMonth = async () => {
    try {
      const res = await fetch(`/api/dashboard/invoices-by-month?year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setChartData(data);
      }
    } catch (error) {
      console.error('Error fetching invoices by month:', error);
    }
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

  const kpiCards = [
    {
      title: 'Productos',
      value: loading ? '...' : stats.productsCount.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'blue',
      link: '/dashboard/products',
    },
    {
      title: 'Contactos',
      value: loading ? '...' : stats.contactsCount.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'green',
      link: '/dashboard/contacts',
    },
    {
      title: 'Facturas',
      value: loading ? '...' : stats.invoicesCount.toString(),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'purple',
      link: '/dashboard/invoices',
    },
    {
      title: 'Facturación Total',
      value: loading ? '...' : `${getCurrencySymbol(stats.currency)}${stats.totalRevenue.toFixed(2)}`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'theme',
      link: '/dashboard/invoices',
    },
  ];
  
  const getStatColor = (color: string) => {
    const colors: { [key: string]: string } = {
      'blue': '#3b82f6',
      'green': '#10b981',
      'purple': '#a855f7',
      'theme': primaryColor,
    };
    return colors[color] || primaryColor;
  };

  const quickActions = [
    {
      title: 'Nuevo Producto',
      description: 'Agrega productos a tu catálogo',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      link: '/dashboard/products/new',
    },
    {
      title: 'Nuevo Cliente',
      description: 'Registra un nuevo cliente',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      link: '/dashboard/customers/new',
    },
    {
      title: 'Nueva Factura',
      description: 'Crea una nueva factura',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/dashboard/invoices/new',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
    

      {/* Estadísticas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Link key={index} href={kpi.link}>
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{kpi.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{kpi.value}</p>
                </div>
                <div 
                  className="p-3 rounded-xl text-white"
                  style={{ backgroundColor: getStatColor(kpi.color) }}
                >
                  {kpi.icon}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Gráfico de Facturas por Mes */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Facturas de Venta por Mes</h3>
            <p className="text-gray-600 text-sm mt-1">Evolución de facturación en {selectedYear}</p>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div style={{ width: '100%', height: '320px' }}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${getCurrencySymbol(stats.currency)}${value.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: number) => [`${getCurrencySymbol(stats.currency)}${value.toFixed(2)}`, 'Total']}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke={primaryColor}
                strokeWidth={3}
                dot={{ fill: primaryColor, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Acciones Rápidas */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.link}>
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div 
                    className="p-4 rounded-full"
                    style={{ 
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor 
                    }}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{action.title}</h4>
                    <p className="text-gray-600 text-sm mt-2">{action.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
