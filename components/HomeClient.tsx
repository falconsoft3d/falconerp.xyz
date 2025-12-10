'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomeClient() {
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
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">FalconERP</span>
            </Link>
            {!loading && (
              <div className="flex items-center space-x-4">
                <Link href="/blog">
                  <button className="px-4 py-2 text-gray-700 hover:text-teal-600 font-medium">
                    Blog
                  </button>
                </Link>
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
                    {process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'true' && (
                      <Link href="/register">
                        <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md transition-all">
                          Registrarse
                        </button>
                      </Link>
                    )}
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
                  {process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'true' && (
                    <Link href="/register">
                      <button className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                        Comenzar Gratis
                      </button>
                    </Link>
                  )}
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

        {/* Contact Form Section */}
        <div className="mt-24 bg-gray-50 rounded-2xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Tienes alguna pregunta?
            </h2>
            <p className="text-xl text-gray-600">
              Contáctanos y te responderemos lo antes posible
            </p>
          </div>
          
          <ContactForm />
        </div>

        {/* CTA Section */}
        {!loading && !isAuthenticated && process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === 'true' && (
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
    </>
  );
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Preparar datos con valores null en lugar de strings vacíos
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        message: formData.message,
      };

      const res = await fetch('/api/web-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', company: '', message: '' });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        const data = await res.json();
        console.error('Error del servidor:', data);
        
        // Formatear errores de validación de forma amigable
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => err.message).join(', ');
          setError(errorMessages);
        } else {
          setError(data.error || 'Error al enviar el mensaje');
        }
      }
    } catch (err) {
      console.error('Error al enviar:', err);
      setError('Error al enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          ¡Mensaje enviado!
        </h3>
        <p className="text-green-700">
          Gracias por contactarnos. Hemos enviado un email de confirmación y te responderemos pronto.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6 max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
            placeholder="Tu nombre"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
            placeholder="tu@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
            placeholder="+34 123 456 789"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Empresa
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
            placeholder="Tu empresa"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje * <span className="text-gray-500 text-xs">(mínimo 10 caracteres)</span>
        </label>
        <textarea
          required
          minLength={10}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900"
          placeholder="Cuéntanos en qué podemos ayudarte... (mínimo 10 caracteres)"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.message.length}/10 caracteres
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-lg shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Enviando...' : 'Enviar Mensaje'}
      </button>
    </form>
  );
}
