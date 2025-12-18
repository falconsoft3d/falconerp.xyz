"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
}

export default function NewAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "asset",
  });

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al cargar la empresa");
      }

      const companies = await res.json();
      const activeCompany = companies.find((c: any) => c.active);

      if (!activeCompany) {
        alert("No hay empresa activa");
        router.push("/dashboard/accounting/accounts");
        return;
      }

      setCompany(activeCompany);
    } catch (error) {
      console.error("Error loading company:", error);
      alert("Error al cargar la empresa");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!company) {
      alert("No hay empresa activa");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/accounting/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: company.id,
          code: formData.code,
          name: formData.name,
          type: formData.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la cuenta");
      }

      router.push("/dashboard/accounting/accounts");
    } catch (error: any) {
      console.error("Error creating account:", error);
      alert(error.message || "Error al crear la cuenta contable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-black">Nueva Cuenta Contable</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
              placeholder="Ej: 1001, 4001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
              placeholder="Ej: Caja, Bancos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
            >
              <option value="asset">Activo</option>
              <option value="liability">Pasivo</option>
              <option value="equity">Patrimonio</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Creando..." : "Crear Cuenta"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/accounting/accounts")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
