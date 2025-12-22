'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

interface ImportInvoicesProps {
  companyId: string;
}

export default function ImportInvoices({ companyId }: ImportInvoicesProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'invoice_out' | 'invoice_in'>('invoice_out');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Por favor selecciona un archivo Excel' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);
      formData.append('type', type);

      const response = await fetch('/api/invoices/import-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar facturas');
      }

      setMessage({ type: 'success', text: data.message });
      setFile(null);
      
      // Mostrar detalles de errores si existen
      if (data.results?.errors?.length > 0) {
        console.log('Errores de importación:', data.results.errors);
      }

      // Recargar la página después de 2 segundos
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Importar Facturas desde Excel</h3>
        
        <div className="space-y-4">
          {/* Tipo de factura */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Tipo de Factura
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="invoice_out"
                  checked={type === 'invoice_out'}
                  onChange={(e) => setType(e.target.value as 'invoice_out')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 font-medium">Venta</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="invoice_in"
                  checked={type === 'invoice_in'}
                  onChange={(e) => setType(e.target.value as 'invoice_in')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 font-medium">Compra</span>
              </label>
            </div>
          </div>

          {/* Selector de archivo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Archivo Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary/90
                cursor-pointer"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-900 font-medium">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </div>

          {/* Formato esperado */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Formato del Excel:
            </h4>
            <div className="text-sm text-gray-900 space-y-1">
              <p>El archivo debe contener las siguientes columnas:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li><strong>numero</strong>: Número de factura (requerido)</li>
                <li><strong>fecha</strong>: Fecha de la factura (requerido)</li>
                <li><strong>cliente</strong>: Nombre del cliente/proveedor (requerido)</li>
                <li><strong>producto</strong>: Descripción del producto/servicio (requerido)</li>
                <li><strong>precio</strong>: Precio unitario</li>
                <li><strong>cant</strong>: Cantidad</li>
                <li><strong>impuesto</strong>: Porcentaje de impuesto (0-100)</li>
              </ul>
            </div>
          </div>

          {/* Mensaje de resultado */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-900 border border-green-200 font-medium'
                  : 'bg-red-50 text-red-900 border border-red-200 font-medium'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Botón de importar */}
          <Button
            onClick={handleImport}
            disabled={loading || !file}
            className="w-full"
          >
            {loading ? 'Importando...' : 'Importar Facturas'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
