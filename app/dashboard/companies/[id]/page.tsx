'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showSmtpHelp, setShowSmtpHelp] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [generatingApiKey, setGeneratingApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [generatingUploadToken, setGeneratingUploadToken] = useState(false);
  const [uploadToken, setUploadToken] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTokenCopied, setUploadTokenCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nif: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    currency: 'EUR',
    phone: '',
    email: '',
    logo: '',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    salesInvoicePrefix: 'INV',
    salesInvoiceNextNumber: 1,
    purchaseInvoicePrefix: 'INVO',
    purchaseInvoiceNextNumber: 1,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    emailTemplate: '',
    apiEnabled: false,
    uploadTokenEnabled: false,
  });

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const res = await fetch(`/api/companies/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          nif: data.nif || '',
          address: data.address || '',
          city: data.city || '',
          postalCode: data.postalCode || '',
          country: data.country || '',
          currency: data.currency || 'EUR',
          phone: data.phone || '',
          email: data.email || '',
          logo: data.logo || '',
          primaryColor: data.primaryColor || '#10b981',
          secondaryColor: data.secondaryColor || '#059669',
          salesInvoicePrefix: data.salesInvoicePrefix || 'INV',
          salesInvoiceNextNumber: data.salesInvoiceNextNumber || 1,
          purchaseInvoicePrefix: data.purchaseInvoicePrefix || 'INVO',
          purchaseInvoiceNextNumber: data.purchaseInvoiceNextNumber || 1,
          smtpHost: data.smtpHost || 'smtp.gmail.com',
          smtpPort: data.smtpPort || 587,
          smtpUser: data.smtpUser || '',
          smtpPassword: data.smtpPassword || '',
          emailTemplate: data.emailTemplate || '',
          apiEnabled: data.apiEnabled || false,
          uploadTokenEnabled: data.uploadTokenEnabled || false,
        });
        if (data.logo) {
          setLogoPreview(data.logo);
        }
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
        if (data.uploadToken) {
          setUploadToken(data.uploadToken);
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          setUploadUrl(`${baseUrl}/upload/${data.uploadToken}`);
        }
      } else {
        setError('Error al cargar empresa');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setError('Error al cargar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // Disparar evento para actualizar el tema
        window.dispatchEvent(new Event('companyChanged'));
        router.push('/dashboard/companies');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar empresa');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      setError('Error al actualizar empresa');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea PNG
      if (!file.type.includes('png')) {
        setError('Solo se permiten archivos PNG');
        return;
      }
      
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('El archivo no debe superar 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({
          ...formData,
          logo: base64String,
        });
        setLogoPreview(base64String);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando empresa...</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta empresa?')) {
      return;
    }

    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/dashboard/companies');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar empresa');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Error al eliminar empresa');
    }
  };

  const handleTestEmail = async () => {
    if (!formData.smtpHost || !formData.smtpUser || !formData.smtpPassword) {
      alert('Por favor completa primero la configuración SMTP antes de hacer la prueba.');
      return;
    }

    if (!confirm(`¿Enviar un correo de prueba a ${formData.smtpUser}?`)) {
      return;
    }

    try {
      setTestingEmail(true);
      const res = await fetch(`/api/companies/${companyId}/test-email`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ ${data.message}\n\nRevisa tu bandeja de entrada.`);
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing email:', error);
      alert('Error al enviar correo de prueba');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (apiKey && !confirm('¿Estás seguro de generar una nueva API Key? La anterior dejará de funcionar.')) {
      return;
    }

    try {
      setGeneratingApiKey(true);
      const res = await fetch(`/api/companies/${companyId}/api-key`, {
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        setApiKey(data.apiKey);
        setFormData({ ...formData, apiEnabled: data.apiEnabled });
        alert('✅ API Key generada exitosamente. Cópiala y guárdala en un lugar seguro.');
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      alert('Error al generar API Key');
    } finally {
      setGeneratingApiKey(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const generateUploadToken = async () => {
    try {
      setGeneratingUploadToken(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${id}/upload-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al generar token');

      const data = await response.json();
      setUploadToken(data.uploadToken);
      setUploadUrl(data.uploadUrl);
      setFormData({ ...formData, uploadTokenEnabled: true });
      alert('Token de subida generado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar token de subida');
    } finally {
      setGeneratingUploadToken(false);
    }
  };

  const disableUploadToken = async () => {
    if (!confirm('¿Estás seguro de que deseas deshabilitar el token de subida? El enlace público dejará de funcionar.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/companies/${id}/upload-token`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Error al deshabilitar token');

      setFormData({ ...formData, uploadTokenEnabled: false });
      setUploadToken('');
      setUploadUrl('');
      alert('Token de subida deshabilitado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al deshabilitar token de subida');
    }
  };

  const copyUploadUrl = () => {
    navigator.clipboard.writeText(uploadUrl);
    setUploadTokenCopied(true);
    setTimeout(() => setUploadTokenCopied(false), 2000);
  };

  const handleApiEnabledToggle = () => {
    if (!apiKey) {
      alert('Primero debes generar una API Key');
      return;
    }
    setFormData({ ...formData, apiEnabled: !formData.apiEnabled });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Editar Empresa</h2>
          <p className="text-gray-600 mt-1">Modifica los datos de tu empresa</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/companies/new">
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear Nueva
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </Button>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nombre de la Empresa"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej: Mi Empresa S.L."
            />

            <Input
              label="NIF/CIF"
              name="nif"
              value={formData.nif}
              onChange={handleChange}
              placeholder="B12345678"
            />

            <Input
              label="Dirección"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle Principal 123"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Madrid"
              />

              <Input
                label="Código Postal"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="28001"
              />
            </div>

            <Input
              label="País"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder="España"
            />

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Moneda
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="EUR">EUR (€) - Euro</option>
                <option value="USD">USD ($) - Dólar estadounidense</option>
                <option value="GBP">GBP (£) - Libra esterlina</option>
                <option value="CHF">CHF (Fr) - Franco suizo</option>
                <option value="JPY">JPY (¥) - Yen japonés</option>
                <option value="CNY">CNY (¥) - Yuan chino</option>
                <option value="MXN">MXN ($) - Peso mexicano</option>
                <option value="ARS">ARS ($) - Peso argentino</option>
                <option value="COP">COP ($) - Peso colombiano</option>
                <option value="CLP">CLP ($) - Peso chileno</option>
              </select>
            </div>

            <Input
              label="Teléfono"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+34 123 456 789"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contacto@miempresa.com"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo de la Empresa (PNG)
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".png,image/png"
                  onChange={handleLogoChange}
                  className="block w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500">
                  Sube un archivo PNG (máximo 2MB). Se guardará en formato base64.
                </p>
                {logoPreview && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                    <div className="inline-block p-2 bg-gray-100 rounded-lg">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Secuencias de Facturas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Facturas de Venta</h4>
                <Input
                  label="Prefijo"
                  name="salesInvoicePrefix"
                  value={formData.salesInvoicePrefix}
                  onChange={handleChange}
                  placeholder="INV"
                  helperText="Ej: INV generará INV-001, INV-002..."
                />
                <Input
                  label="Próximo Número"
                  name="salesInvoiceNextNumber"
                  type="number"
                  min="1"
                  value={formData.salesInvoiceNextNumber}
                  onChange={(e) => setFormData({ ...formData, salesInvoiceNextNumber: parseInt(e.target.value) || 1 })}
                  helperText="Próximo número de factura de venta a generar"
                />
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Facturas de Compra</h4>
                <Input
                  label="Prefijo"
                  name="purchaseInvoicePrefix"
                  value={formData.purchaseInvoicePrefix}
                  onChange={handleChange}
                  placeholder="INVO"
                  helperText="Ej: INVO generará INVO-001, INVO-002..."
                />
                <Input
                  label="Próximo Número"
                  name="purchaseInvoiceNextNumber"
                  type="number"
                  min="1"
                  value={formData.purchaseInvoiceNextNumber}
                  onChange={(e) => setFormData({ ...formData, purchaseInvoiceNextNumber: parseInt(e.target.value) || 1 })}
                  helperText="Próximo número de factura de compra a generar"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Configuración de Email (Gmail SMTP)</h3>
              <button
                type="button"
                onClick={() => setShowSmtpHelp(!showSmtpHelp)}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showSmtpHelp ? 'Ocultar' : 'Ver'} Ayuda
              </button>
            </div>

            {showSmtpHelp && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cómo configurar Gmail para enviar correos
                </h4>
                <ol className="space-y-3 text-sm text-blue-900">
                  <li className="flex items-start">
                    <span className="font-bold mr-2 bg-blue-200 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                    <div>
                      <strong>Habilita la verificación en 2 pasos</strong>
                      <p className="text-blue-800 mt-1">Ve a tu cuenta de Google → Seguridad → Verificación en 2 pasos y actívala</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2 bg-blue-200 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                    <div>
                      <strong>Genera una contraseña de aplicación</strong>
                      <p className="text-blue-800 mt-1">Ve a: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">https://myaccount.google.com/apppasswords</a></p>
                      <p className="text-blue-800 mt-1">Selecciona "Correo" y "Otro dispositivo", ponle un nombre (ej: "ERP") y genera</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2 bg-blue-200 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                    <div>
                      <strong>Copia la contraseña generada</strong>
                      <p className="text-blue-800 mt-1">Google te mostrará una contraseña de 16 caracteres. Cópiala y pégala en el campo "Contraseña SMTP" abajo</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2 bg-blue-200 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">4</span>
                    <div>
                      <strong>Completa el campo Usuario SMTP</strong>
                      <p className="text-blue-800 mt-1">
                        Ingresa tu correo completo de Gmail (ejemplo@gmail.com). El nombre del remitente será automáticamente el nombre de tu empresa.
                      </p>
                    </div>
                  </li>
                </ol>
                <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
                  <p className="text-sm text-blue-900"><strong>⚠️ Importante:</strong> Los campos Host (smtp.gmail.com) y Puerto (587) ya están configurados automáticamente.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Host SMTP"
                name="smtpHost"
                value={formData.smtpHost}
                onChange={handleChange}
                placeholder="smtp.gmail.com"
                helperText="Servidor SMTP de Gmail"
              />

              <Input
                label="Puerto SMTP"
                name="smtpPort"
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })}
                placeholder="587"
                helperText="Puerto TLS (587 para Gmail)"
              />

              <Input
                label="Usuario SMTP (Gmail)"
                name="smtpUser"
                type="email"
                value={formData.smtpUser}
                onChange={handleChange}
                placeholder="tucorreo@gmail.com"
                helperText="Tu dirección de Gmail completa"
              />

              <Input
                label="Contraseña SMTP"
                name="smtpPassword"
                type="password"
                value={formData.smtpPassword}
                onChange={handleChange}
                placeholder="Contraseña de aplicación"
                helperText="Contraseña de 16 caracteres generada en Google"
              />
            </div>

            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <strong>ℹ️ Nota:</strong> El nombre del remitente será automáticamente el nombre de tu empresa y el email será el Usuario SMTP configurado arriba.
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestEmail}
                disabled={testingEmail || !formData.smtpHost || !formData.smtpUser || !formData.smtpPassword}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {testingEmail ? 'Enviando Prueba...' : 'Enviar Email de Prueba'}
              </Button>
            </div>

            <div className="mt-6">
              <label htmlFor="emailTemplate" className="block text-sm font-medium text-gray-700 mb-2">
                Plantilla de Correo Personalizada (Opcional)
              </label>
              <textarea
                id="emailTemplate"
                name="emailTemplate"
                value={formData.emailTemplate}
                onChange={handleChange}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 font-mono text-sm"
                placeholder="Deja este campo vacío para usar la plantilla predeterminada. Si deseas personalizarla, puedes usar HTML con variables como: {{invoice.number}}, {{company.name}}, {{contact.name}}, {{invoice.total}}, etc."
              />
              <p className="mt-2 text-sm text-gray-500">
                Si está vacío, se usará una plantilla profesional predeterminada. Puedes personalizar con HTML y usar variables como: <code className="bg-gray-100 px-1 rounded">{'{{company.name}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{invoice.number}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{contact.name}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{invoice.total}}'}</code>
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">API de Facturas</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Consulta tus facturas de venta vía API REST
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.apiEnabled}
                  onChange={handleApiEnabledToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {formData.apiEnabled ? 'Habilitada' : 'Deshabilitada'}
                </span>
              </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3 text-sm text-blue-800">
                  <p className="font-semibold mb-1">¿Cómo usar la API?</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Genera una API Key haciendo clic en "Generar API Key"</li>
                    <li>Copia la clave y guárdala en un lugar seguro</li>
                    <li>Habilita la API con el interruptor de arriba</li>
                    <li>Usa la clave en el header <code className="bg-blue-100 px-1 rounded">X-API-Key</code> de tus peticiones</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateApiKey}
                    disabled={generatingApiKey}
                    className="flex-shrink-0"
                  >
                    {generatingApiKey ? (
                      <>
                        <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        {apiKey ? 'Regenerar API Key' : 'Generar API Key'}
                      </>
                    )}
                  </Button>
                </div>

                {apiKey && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tu API Key
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={apiKey}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={copyApiKey}
                        >
                          {apiKeyCopied ? (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copiado
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-red-600">
                        ⚠️ Guarda esta clave de forma segura. No la compartas públicamente.
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Endpoint de la API:</p>
                      <code className="text-sm text-gray-700 bg-white px-3 py-2 rounded border border-gray-300 block">
                        GET {typeof window !== 'undefined' ? window.location.origin : ''}/api/public/invoices
                      </code>
                      <p className="text-xs text-gray-600 mt-2">
                        Incluye el header: <code className="bg-white px-1 rounded">X-API-Key: {'{tu_api_key}'}</code>
                      </p>
                      <details className="mt-3">
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                          Ver ejemplo con cURL
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
{`curl -X GET '${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/invoices' \\
  -H 'X-API-Key: ${apiKey}'`}
                        </pre>
                      </details>
                      <details className="mt-2">
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                          Parámetros de consulta opcionales
                        </summary>
                        <ul className="mt-2 text-xs text-gray-600 space-y-1 list-disc list-inside">
                          <li><code>status</code>: DRAFT, PENDING, PAID, CANCELLED</li>
                          <li><code>paymentStatus</code>: PENDING, PARTIAL, PAID, OVERDUE</li>
                          <li><code>startDate</code>: Fecha inicio (YYYY-MM-DD)</li>
                          <li><code>endDate</code>: Fecha fin (YYYY-MM-DD)</li>
                          <li><code>limit</code>: Máximo de resultados (1-100, default: 100)</li>
                          <li><code>offset</code>: Offset para paginación (default: 0)</li>
                        </ul>
                      </details>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">URL de Subida Pública de Facturas</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Genera una URL pública para que proveedores o empleados puedan subir facturas de compra directamente sin necesidad de iniciar sesión.
              </p>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.uploadTokenEnabled}
                    onChange={(e) => setFormData({ ...formData, uploadTokenEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {formData.uploadTokenEnabled ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                </label>
              </div>

              {!uploadToken ? (
                <Button
                  type="button"
                  onClick={generateUploadToken}
                  disabled={generatingUploadToken}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {generatingUploadToken ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Generar Token de Subida
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Pública de Subida
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={uploadUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyUploadUrl}
                      >
                        {uploadTokenCopied ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copiado
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-amber-600">
                      ⚠️ No compartas este enlace públicamente. Solo envíalo a personas de confianza.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-2">¿Qué permite este enlace?</p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Subir facturas de compra con adjuntos (PDF, JPG, PNG)</li>
                      <li>Crear automáticamente contactos de proveedores si no existen</li>
                      <li>No requiere inicio de sesión</li>
                      <li>Límite de archivo: 10MB</li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={generateUploadToken}
                      disabled={generatingUploadToken}
                      variant="outline"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerar Token
                    </Button>
                    <Button
                      type="button"
                      onClick={disableUploadToken}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Deshabilitar Token
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Colores del Tema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Color Principal
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="#10b981"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Color Secundario
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="secondaryColor"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                    placeholder="#059669"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
