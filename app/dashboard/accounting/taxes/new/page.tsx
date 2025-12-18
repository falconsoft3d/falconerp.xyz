"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
}

export default function NewTaxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    type: "vat",
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
        router.push("/dashboard/accounting/taxes");
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

      const res = await fetch("/api/accounting/taxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId: company.id,
          name: formData.name,
          rate: parseFloat(formData.rate),
          type: formData.type,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear el impuesto");
      }

      router.push("/dashboard/accounting/taxes");
    } catch (error: any) {
      console.error("Error creating tax:", error);
      alert(error.message || "Error al crear el impuesto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-black">Nuevo Impuesto</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
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
              placeholder="Ej: IVA 21%, Retención 10%"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa (%) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.rate}
              onChange={(e) =>
                setFormData({ ...formData, rate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              required
              placeholder="Ej: 21.00, 10.50"
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
              <option value="vat">IVA</option>
              <option value="retention">Retención</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Creando..." : "Crear Impuesto"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/accounting/taxes")}
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
