'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function UploadInvoicePage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [formData, setFormData] = useState({
    userName: '',
    supplierName: '',
    amount: '',
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!formData.file) {
      setError('Debes seleccionar un archivo');
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('userName', formData.userName);
      data.append('supplierName', formData.supplierName);
      data.append('amount', formData.amount);
      data.append('file', formData.file);

      const response = await fetch(`/api/public/upload-invoice/${params.token}`, {
        method: 'POST',
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir factura');
      }

      setSuccess(true);
      setInvoiceData(result.invoice);
      setFormData({
        userName: '',
        supplierName: '',
        amount: '',
        file: null,
      });
      // Limpiar input file
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">FalconERP</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Subir Factura de Compra
              </h2>
              <p className="text-gray-600">
                Completa el formulario para registrar una factura de proveedor
              </p>
            </div>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold">¡Factura creada exitosamente!</span>
                </div>
                {invoiceData && (
                  <div className="text-sm mt-2">
                    <p><strong>Número:</strong> {invoiceData.invoiceNumber}</p>
                    <p><strong>Proveedor:</strong> {invoiceData.supplier}</p>
                    <p><strong>Monto:</strong> {invoiceData.amount} EUR</p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Tu nombre"
                type="text"
                placeholder="Juan Pérez"
                required
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                helperText="Nombre de quien registra la factura"
              />

              <Input
                label="Nombre del proveedor"
                type="text"
                placeholder="Empresa Proveedora S.L."
                required
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              />

              <Input
                label="Monto total"
                type="number"
                step="0.01"
                placeholder="1250.50"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                helperText="Monto en euros (EUR)"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo de factura *
                </label>
                <input
                  id="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos permitidos: PDF, JPG, PNG (máximo 10MB)
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
              >
                Subir Factura
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Esta URL es privada y segura. Solo personas con el enlace pueden acceder.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-400">
            <p>© 2025 FalconERP. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
