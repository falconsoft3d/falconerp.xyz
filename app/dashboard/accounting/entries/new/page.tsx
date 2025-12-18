'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface EntryLine {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export default function NewEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
  });
  const [lines, setLines] = useState<EntryLine[]>([
    { accountId: '', description: '', debit: 0, credit: 0 },
    { accountId: '', description: '', debit: 0, credit: 0 },
  ]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!companiesRes.ok) return;

      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) return;

      const response = await fetch(`/api/accounting/accounts?companyId=${activeCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', description: '', debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      alert('Debe haber al menos 2 líneas en el asiento');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof EntryLine, value: string | number) => {
    const newLines = [...lines];
    if (field === 'debit' || field === 'credit') {
      newLines[index][field] = Number(value);
    } else {
      newLines[index][field] = value as string;
    }
    setLines(newLines);
  };

  const calculateTotals = () => {
    const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit), 0);
    const difference = totalDebit - totalCredit;
    return { totalDebit, totalCredit, difference };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { totalDebit, totalCredit, difference } = calculateTotals();
    
    if (Math.abs(difference) > 0.01) {
      alert('El asiento no está balanceado. El total del Debe debe ser igual al total del Haber.');
      return;
    }

    if (lines.some(line => !line.accountId)) {
      alert('Todas las líneas deben tener una cuenta seleccionada');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!companiesRes.ok) {
        alert('Error al cargar la empresa');
        setLoading(false);
        return;
      }

      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        alert('Por favor selecciona una compañía primero');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/accounting/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyId: activeCompany.id,
          ...formData,
          lines: lines.map(line => ({
            accountId: line.accountId,
            description: line.description || null,
            debit: Number(line.debit),
            credit: Number(line.credit),
          })),
        }),
      });

      if (response.ok) {
        router.push('/dashboard/accounting/entries');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear el asiento');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      alert('Error al crear el asiento');
    } finally {
      setLoading(false);
    }
  };

  const { totalDebit, totalCredit, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nuevo Asiento Contable</h1>
        <p className="mt-2 text-gray-600">
          Crea un nuevo asiento contable de partida doble
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del asiento */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Datos del Asiento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: FAC-001"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción del asiento"
                required
              />
            </div>
          </div>
        </div>

        {/* Líneas del asiento */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Líneas del Asiento
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Agregar Línea
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cuenta *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Debe
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Haber
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lines.map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <select
                        value={line.accountId}
                        onChange={(e) => updateLine(index, 'accountId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                        required
                      >
                        <option value="">Seleccionar cuenta</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                        placeholder="Descripción de la línea"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={line.debit}
                        onChange={(e) => updateLine(index, 'debit', e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-right text-gray-900"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={line.credit}
                        onChange={(e) => updateLine(index, 'credit', e.target.value)}
                        step="0.01"
                        min="0"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-right text-gray-900"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-red-600 hover:text-red-800"
                        disabled={lines.length <= 2}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Fila de totales */}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={2} className="px-4 py-3 text-right text-sm text-gray-900">
                    TOTALES:
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    €{formatCurrency(totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    €{formatCurrency(totalCredit)}
                  </td>
                  <td></td>
                </tr>
                {/* Diferencia */}
                {!isBalanced && (
                  <tr className="bg-red-50">
                    <td colSpan={2} className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                      DIFERENCIA:
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                      €{formatCurrency(Math.abs(difference))}
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!isBalanced && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                ⚠️ El asiento no está balanceado. El total del Debe debe ser igual al total del Haber.
              </p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !isBalanced}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Asiento'}
          </button>
        </div>
      </form>
    </div>
  );
}
