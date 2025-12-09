'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/DataTable';

interface Company {
  id: string;
  name: string;
  nif: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
}

export default function CompaniesListPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Company>[] = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
      searchable: true,
    },
    {
      key: 'nif',
      label: 'NIF/CIF',
      sortable: true,
      searchable: true,
    },
    {
      key: 'city',
      label: 'Ciudad',
      sortable: true,
      searchable: true,
    },
    {
      key: 'phone',
      label: 'Teléfono',
      searchable: true,
    },
    {
      key: 'email',
      label: 'Email',
      searchable: true,
    },
    {
      key: 'active',
      label: 'Estado',
      sortable: true,
      render: (company) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          company.active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {company.active ? 'Activa' : 'Inactiva'}
        </span>
      ),
    },
  ];

  const handleEdit = (company: Company) => {
    router.push(`/dashboard/companies/${company.id}`);
  };

  const handleDelete = async (company: Company) => {
    if (!confirm(`¿Estás seguro de eliminar la empresa "${company.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCompanies();
      } else {
        alert('Error al eliminar empresa');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Error al eliminar empresa');
    }
  };

  return (
    <DataTable
      title="Empresas"
      data={companies}
      columns={columns}
      createLink="/dashboard/companies/new"
      createLabel="Nueva Empresa"
      onEdit={handleEdit}
      onDelete={handleDelete}
      loading={loading}
      emptyMessage="No hay empresas registradas"
    />
  );
}
