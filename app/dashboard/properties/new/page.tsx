'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface PropertyContact {
  contactId: string;
  responsibility: string;
  contact?: Contact;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    address: '',
    block: '',
    number: '',
    projectId: '',
    constructionDate: '',
    contractAmount: '',
    contractStartDate: '',
    contractEndDate: '',
    notes: '',
  });

  const [propertyContacts, setPropertyContacts] = useState<PropertyContact[]>([]);
  const [newContact, setNewContact] = useState({
    contactId: '',
    responsibility: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa. Por favor selecciona una empresa.');
        setLoadingData(false);
        return;
      }

      setSelectedCompanyId(activeCompany.id);
      await Promise.all([
        loadProjects(activeCompany.id),
        loadContacts(activeCompany.id)
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError('Error al cargar datos iniciales');
    } finally {
      setLoadingData(false);
    }
  };

  const loadProjects = async (companyId: string) => {
    try {
      const response = await fetch(`/api/projects?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
    }
  };

  const loadContacts = async (companyId: string) => {
    try {
      const response = await fetch(`/api/contacts?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error al cargar contactos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompanyId) {
      alert('Por favor selecciona una empresa');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          code: formData.code,
          address: formData.address,
          block: formData.block || null,
          number: formData.number || null,
          projectId: formData.projectId || null,
          constructionDate: formData.constructionDate || null,
          contractAmount: formData.contractAmount ? parseFloat(formData.contractAmount) : null,
          contractStartDate: formData.contractStartDate || null,
          contractEndDate: formData.contractEndDate || null,
          notes: formData.notes || null,
          contacts: propertyContacts,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/properties');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear la propiedad');
      }
    } catch (error) {
      console.error('Error al crear propiedad:', error);
      alert('Error al crear la propiedad');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    if (!newContact.contactId || !newContact.responsibility) {
      alert('Por favor selecciona un contacto y especifica la responsabilidad');
      return;
    }

    const contact = contacts.find(c => c.id === newContact.contactId);
    if (!contact) return;

    if (propertyContacts.some(pc => pc.contactId === newContact.contactId)) {
      alert('Este contacto ya está agregado');
      return;
    }

    setPropertyContacts([
      ...propertyContacts,
      { ...newContact, contact },
    ]);

    setNewContact({ contactId: '', responsibility: '' });
  };

  const handleRemoveContact = (contactId: string) => {
    setPropertyContacts(propertyContacts.filter(pc => pc.contactId !== contactId));
  };

  if (loadingData) {
    return (
      <div className="p-8">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  if (!selectedCompanyId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            {error || 'Por favor selecciona una empresa para crear una propiedad.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Nueva Propiedad</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proyecto
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            >
              <option value="">Sin proyecto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bloque
            </label>
            <input
              type="text"
              value={formData.block}
              onChange={(e) => setFormData({ ...formData, block: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Construcción
            </label>
            <input
              type="date"
              value={formData.constructionDate}
              onChange={(e) => setFormData({ ...formData, constructionDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Importe de Contrato
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.contractAmount}
              onChange={(e) => setFormData({ ...formData, contractAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio Contrato
            </label>
            <input
              type="date"
              value={formData.contractStartDate}
              onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin Contrato
            </label>
            <input
              type="date"
              value={formData.contractEndDate}
              onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            />
          </div>
        </div>

        {/* Sección de Contactos */}
        <div className="border-t pt-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-black">Contactos</h2>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <select
                value={newContact.contactId}
                onChange={(e) => setNewContact({ ...newContact, contactId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
              >
                <option value="">Seleccionar contacto</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Responsabilidad (ej: Presidente Bloque A)"
                value={newContact.responsibility}
                onChange={(e) => setNewContact({ ...newContact, responsibility: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
              />
            </div>
            <button
              type="button"
              onClick={handleAddContact}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Agregar
            </button>
          </div>

          {propertyContacts.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 text-black">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Contacto</th>
                    <th className="text-left py-2">Responsabilidad</th>
                    <th className="text-right py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyContacts.map((pc) => (
                    <tr key={pc.contactId} className="border-b last:border-0">
                      <td className="py-2">{pc.contact?.name}</td>
                      <td className="py-2">{pc.responsibility}</td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(pc.contactId)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-black"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Propiedad'}
          </button>
        </div>
      </form>
    </div>
  );
}
