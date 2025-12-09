'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/Button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  defaultCompany?: {
    id: string;
    name: string;
  } | null;
  createdById: string | null;
  createdAt: string;
  _count: {
    createdUsers: number;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };



  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { 
      key: 'role', 
      label: 'Rol',
      render: (user: User) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {user.role === 'admin' ? 'Administrador' : 'Usuario'}
        </span>
      )
    },
    { 
      key: 'defaultCompany', 
      label: 'Empresa',
      render: (user: User) => user.defaultCompany?.name || 'Sin empresa'
    },
    { 
      key: 'active', 
      label: 'Estado',
      render: (user: User) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.active ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    { 
      key: 'type', 
      label: 'Tipo',
      render: (user: User) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.createdById ? 'bg-gray-100 text-gray-800' : 'bg-indigo-100 text-indigo-800'
        }`}>
          {user.createdById ? 'Creado' : 'Principal'}
        </span>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Usuarios</h2>
          <p className="text-gray-600 mt-1">Gestiona los usuarios de tu organización</p>
        </div>
        <Link href="/dashboard/users/new">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      <DataTable
        data={users}
        columns={columns}
        onEdit={(user) => router.push(`/dashboard/users/${user.id}`)}
        searchKeys={['name', 'email']}
        emptyMessage="No hay usuarios registrados"
      />
    </div>
  );
}
