'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
  id: string;
  contactId: string;
  responsibility: string;
  contact: Contact;
}

interface Property {
  id: string;
  code: string;
  address: string;
  block: string | null;
  number: string | null;
  projectId: string | null;
  responsableId: string | null;
  constructionDate: Date | null;
  contractAmount: number | null;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  notes: string | null;
  contacts: PropertyContact[];
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
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
    responsableId: '',
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
  }, [propertyId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Obtener empresa activa
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa. Por favor selecciona una empresa.');
        setLoading(false);
        return;
      }

      setSelectedCompanyId(activeCompany.id);
      await Promise.all([
        loadProperty(),
        loadProjects(activeCompany.id),
        loadContacts(activeCompany.id)
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      setError('Error al cargar datos iniciales');
      setLoading(false);
    }
  };

  const loadProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setProperty(data);
        
        setFormData({
          code: data.code || '',
          address: data.address || '',
          block: data.block || '',
          number: data.number || '',
          projectId: data.projectId || '',
          responsableId: data.responsableId || '',
          constructionDate: data.constructionDate ? new Date(data.constructionDate).toISOString().split('T')[0] : '',
          contractAmount: data.contractAmount?.toString() || '',
          contractStartDate: data.contractStartDate ? new Date(data.contractStartDate).toISOString().split('T')[0] : '',
          contractEndDate: data.contractEndDate ? new Date(data.contractEndDate).toISOString().split('T')[0] : '',
          notes: data.notes || '',
        });

        setPropertyContacts(data.contacts || []);
      } else {
        alert('Error al cargar la propiedad');
        router.push('/dashboard/properties');
      }
    } catch (error) {
      console.error('Error al cargar propiedad:', error);
      alert('Error al cargar la propiedad');
    } finally {
      setLoading(false);
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
    
    setSaving(true);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          address: formData.address,
          block: formData.block || null,
          number: formData.number || null,
          projectId: formData.projectId || null,
          responsableId: formData.responsableId || null,
          constructionDate: formData.constructionDate || null,
          contractAmount: formData.contractAmount ? parseFloat(formData.contractAmount) : null,
          contractStartDate: formData.contractStartDate || null,
          contractEndDate: formData.contractEndDate || null,
          notes: formData.notes || null,
          contacts: propertyContacts.map(pc => ({
            contactId: pc.contactId,
            responsibility: pc.responsibility,
          })),
        }),
      });

      if (response.ok) {
        alert('Propiedad actualizada correctamente');
        router.push('/dashboard/properties');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar la propiedad');
      }
    } catch (error) {
      console.error('Error al actualizar propiedad:', error);
      alert('Error al actualizar la propiedad');
    } finally {
      setSaving(false);
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
      {
        id: `temp-${Date.now()}`,
        contactId: newContact.contactId,
        responsibility: newContact.responsibility,
        contact,
      },
    ]);

    setNewContact({ contactId: '', responsibility: '' });
  };

  const handleRemoveContact = (contactId: string) => {
    setPropertyContacts(propertyContacts.filter(pc => pc.contactId !== contactId));
  };

  const handleDuplicate = async () => {
    if (!confirm('¿Deseas duplicar esta propiedad?')) return;

    try {
      setSaving(true);
      
      // Generar nuevo código agregando sufijo
      const newCode = `${property.code}-copia-${Date.now().toString().slice(-4)}`;

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          code: newCode,
          address: property.address,
          block: property.block,
          number: property.number,
          projectId: property.projectId,
          constructionDate: property.constructionDate,
          contractAmount: property.contractAmount,
          contractStartDate: property.contractStartDate,
          contractEndDate: property.contractEndDate,
          notes: property.notes ? `${property.notes}\n\n(Copia de ${property.code})` : `Copia de ${property.code}`,
          contacts: propertyContacts.map(pc => ({
            contactId: pc.contactId,
            responsibility: pc.responsibility,
          })),
        }),
      });

      if (response.ok) {
        const newProperty = await response.json();
        alert('Propiedad duplicada correctamente');
        router.push(`/dashboard/properties/${newProperty.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Error al duplicar la propiedad');
      }
    } catch (error) {
      console.error('Error al duplicar propiedad:', error);
      alert('Error al duplicar la propiedad');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Cargando propiedad...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Propiedad no encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Editar Propiedad</h1>
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Duplicar
        </button>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsable
            </label>
            <select
              value={formData.responsableId}
              onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
            >
              <option value="">Sin responsable</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
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
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="w-full text-black">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Contacto</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Responsabilidad</th>
                    <th className="text-right py-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyContacts.map((pc) => (
                    <tr key={pc.id} className="border-b last:border-0">
                      <td className="py-2">{pc.contact.name}</td>
                      <td className="py-2 text-sm text-gray-600">{pc.contact.email || '-'}</td>
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
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
