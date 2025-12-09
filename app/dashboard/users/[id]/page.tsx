'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  defaultCompanyId: string | null;
  createdById: string | null;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    active: true,
    defaultCompanyId: '',
  });

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [userRes, companiesRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch('/api/companies'),
      ]);

      if (userRes.ok && companiesRes.ok) {
        const userData = await userRes.json();
        const companiesData = await companiesRes.json();
        
        setUser(userData);
        setCompanies(companiesData);
        setFormData({
          name: userData.name,
          email: userData.email,
          password: '',
          role: userData.role,
          active: userData.active,
          defaultCompanyId: userData.defaultCompanyId || '',
        });
      } else {
        setError('Error al cargar el usuario');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error al cargar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active,
        defaultCompanyId: formData.defaultCompanyId || undefined,
      };

      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        router.push('/dashboard/users');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600">Usuario no encontrado</p>
            <Button onClick={() => router.push('/dashboard/users')} className="mt-4">
              Volver a usuarios
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isPrincipalUser = !user.createdById;

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard/users');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Editar Usuario</h2>
            <p className="text-gray-600 mt-1">Actualiza la información del usuario</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/users/new">
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Nuevo
              </Button>
            </Link>
            {!isPrincipalUser && (
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </Button>
            )}
          </div>
        </div>
        {isPrincipalUser && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg text-sm">
            <span className="font-medium">Usuario Principal:</span> No puedes editar tu propio usuario desde aquí
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nombre Completo"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isPrincipalUser}
              placeholder="Ej: Juan Pérez"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isPrincipalUser}
              placeholder="usuario@ejemplo.com"
            />

            <Input
              label="Nueva Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isPrincipalUser}
              placeholder="Dejar en blanco para mantener la actual"
              helperText="Solo completa este campo si deseas cambiar la contraseña"
            />

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isPrincipalUser}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Los administradores tienen acceso completo al sistema
              </p>
            </div>

            <div>
              <label htmlFor="defaultCompanyId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Empresa Asignada
              </label>
              <select
                id="defaultCompanyId"
                name="defaultCompanyId"
                value={formData.defaultCompanyId}
                onChange={handleChange}
                disabled={isPrincipalUser}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Sin empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Solo puedes asignar empresas que tú has creado
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                disabled={isPrincipalUser}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Usuario activo
              </label>
            </div>
            <p className="text-sm text-gray-500 -mt-2 ml-6">
              Los usuarios inactivos no pueden iniciar sesión
            </p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
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
              disabled={saving || isPrincipalUser}
              className="flex-1"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
