'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  nif?: string;
  active: boolean;
}

export default function CompanySelector() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
        const active = data.find((c: Company) => c.active);
        setActiveCompany(active || null);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (companyId: string) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/activate`, {
        method: 'POST',
      });

      if (res.ok) {
        await fetchCompanies();
        // Emitir evento para que el layout actualice los colores
        window.dispatchEvent(new Event('companyChanged'));
        router.refresh();
      }
    } catch (error) {
      console.error('Error activating company:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-lg">
        <div className="h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-teal-700">Cargando...</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="px-4 py-2 bg-amber-50 rounded-lg">
        <span className="text-sm text-amber-700">No hay empresas creadas</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="company-select" className="text-sm font-medium text-gray-700">
        Empresa:
      </label>
      <select
        id="company-select"
        value={activeCompany?.id || ''}
        onChange={(e) => handleCompanyChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} {company.nif ? `(${company.nif})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
