'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MenuCounts {
  journals: number;
  accounts: number;
  taxes: number;
}

export default function AccountingPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<MenuCounts>({ journals: 0, accounts: 0, taxes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
  }, []);

  async function loadCounts() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Obtener empresa activa
      const companyRes = await fetch('/api/companies', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!companyRes.ok) {
        throw new Error('Error al cargar la empresa');
      }

      const companies = await companyRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        return;
      }

      // Cargar contadores en paralelo
      const [journalsRes, accountsRes, taxesRes] = await Promise.all([
        fetch(`/api/accounting/journals?companyId=${activeCompany.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/accounting/accounts?companyId=${activeCompany.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/accounting/taxes?companyId=${activeCompany.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [journals, accounts, taxes] = await Promise.all([
        journalsRes.ok ? journalsRes.json() : [],
        accountsRes.ok ? accountsRes.json() : [],
        taxesRes.ok ? taxesRes.json() : [],
      ]);

      setCounts({
        journals: journals.length || 0,
        accounts: accounts.length || 0,
        taxes: taxes.length || 0,
      });
    } catch (error) {
      console.error('Error loading counts:', error);
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    {
      name: 'Diarios',
      href: '/dashboard/accounting/journal',
      count: counts.journals,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Cuentas',
      href: '/dashboard/accounting/accounts',
      count: counts.accounts,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      name: 'Impuestos',
      href: '/dashboard/accounting/taxes',
      count: counts.taxes,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Contabilidad</h1>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">{item.icon}</div>
                  <span className="text-lg font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                  {item.count}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
