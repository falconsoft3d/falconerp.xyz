"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  active: boolean;
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Obtener empresa activa
      const companyRes = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!companyRes.ok) {
        throw new Error("Error al cargar la empresa");
      }

      const companies = await companyRes.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        alert("No hay empresa activa");
        return;
      }

      // Cargar cuentas
      const res = await fetch(
        `/api/accounting/accounts?companyId=${activeCompany.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Error al cargar las cuentas");
      }

      const data = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error loading accounts:", error);
      alert("Error al cargar las cuentas contables");
    } finally {
      setLoading(false);
    }
  }

  function getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      asset: "Activo",
      liability: "Pasivo",
      equity: "Patrimonio",
      income: "Ingreso",
      expense: "Gasto",
    };
    return labels[type] || type;
  }

  function getTypeBadgeColor(type: string): string {
    const colors: { [key: string]: string } = {
      asset: "bg-green-100 text-green-800",
      liability: "bg-red-100 text-red-800",
      equity: "bg-blue-100 text-blue-800",
      income: "bg-purple-100 text-purple-800",
      expense: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Cuentas Contables</h1>
        <button
          onClick={() => router.push("/dashboard/accounting/accounts/new")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Nueva Cuenta
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay cuentas contables creadas</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {account.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(
                        account.type
                      )}`}
                    >
                      {getTypeLabel(account.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {account.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
