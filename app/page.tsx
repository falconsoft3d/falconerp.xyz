'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">FalconERP</span>
            </div>
            {!loading && (
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <button className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium">
                        Dashboard
                      </button>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow-md transition-all"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <button className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium">
                        Iniciar Sesión
                      </button>
                    </Link>
                    <Link href="/register">
                      <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md transition-all">
                        Registrarse
                      </button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gestiona tu Negocio Completo
            <span className="block text-teal-600 mt-2">con un ERP Simple y Potente</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Sistema completo de gestión empresarial: productos, clientes, facturas y control de inventario. 
            Todo lo que necesitas para tu negocio en un solo lugar.
          </p>
          {!loading && (
            <div className="flex justify-center space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <button className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                    Ir al Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <button className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                      Comenzar Gratis
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200">
                      Ver Demo
                    </button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Gestión de Productos</h3>
            <p className="text-gray-600">
              Administra tu catálogo de productos con precios, stock y categorías. Control total de tu inventario.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Base de Clientes</h3>
            <p className="text-gray-600">
              Organiza la información de tus clientes con datos completos de contacto y seguimiento de facturas.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Facturación Rápida</h3>
            <p className="text-gray-600">
              Crea facturas profesionales en segundos con cálculo automático de IVA y totales. Perfecto para tu negocio.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Todo lo que Necesitas para tu Negocio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">📦</div>
              <p className="text-gray-600 font-semibold">Productos</p>
              <p className="text-sm text-gray-500">Gestión completa</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">👥</div>
              <p className="text-gray-600 font-semibold">Clientes</p>
              <p className="text-sm text-gray-500">Base de datos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">📄</div>
              <p className="text-gray-600 font-semibold">Facturas</p>
              <p className="text-sm text-gray-500">Profesionales</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">📊</div>
              <p className="text-gray-600 font-semibold">Reportes</p>
              <p className="text-sm text-gray-500">En tiempo real</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!loading && !isAuthenticated && (
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              ¿Listo para Simplificar la Gestión de tu Negocio?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Comienza hoy mismo y lleva el control total de tu empresa
            </p>
            <Link href="/register">
              <button className="px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                Crear Cuenta Gratis
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">FalconERP</span>
              </div>
              <p className="text-gray-400">
                Sistema ERP simple y completo para tu negocio
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-gray-400">
                {isAuthenticated ? (
                  <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                ) : (
                  <>
                    <li><Link href="/login" className="hover:text-white">Iniciar Sesión</Link></li>
                    <li><Link href="/register" className="hover:text-white">Registrarse</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Términos y Condiciones</li>
                <li>Política de Privacidad</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 FalconERP. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
