'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Equipment {
  id: string;
  code: string;
  name: string;
  ownerId: string | null;
  owner: Contact | null;
  licensePlate: string | null;
  kilometers: number | null;
  hours: number | null;
  createdAt: string;
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    ownerId: '',
    licensePlate: '',
    kilometers: 0,
    hours: 0,
  });

  useEffect(() => {
    fetchEquipment();
    fetchContacts();
  }, []);

  useEffect(() => {
    filterEquipment();
  }, [equipment, searchTerm, filterOwner]);

  const filterEquipment = () => {
    let filtered = [...equipment];

    // Filtro de búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (eq) =>
          eq.code.toLowerCase().includes(term) ||
          eq.name.toLowerCase().includes(term) ||
          eq.licensePlate?.toLowerCase().includes(term) ||
          eq.owner?.name.toLowerCase().includes(term)
      );
    }

    // Filtro por propietario
    if (filterOwner) {
      filtered = filtered.filter((eq) => eq.ownerId === filterOwner);
    }

    setFilteredEquipment(filtered);
  };

  const fetchEquipment = async () => {
    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/equipment?companyId=${activeCompany.id}`);
      if (res.ok) {
        const data = await res.json();
        setEquipment(data);
      } else {
        const errorData = await res.json();
        console.error('Error del servidor:', errorData);
        setError(`Error al cargar equipos: ${errorData.details || errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(`Error al cargar equipos: ${error instanceof Error ? error.message : 'Error de conexión'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) return;

      const res = await fetch(`/api/contacts?companyId=${activeCompany.id}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa');
        return;
      }

      const url = editingId ? `/api/equipment/${editingId}` : '/api/equipment';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        companyId: activeCompany.id,
        ownerId: formData.ownerId || null,
        licensePlate: formData.licensePlate || null,
        kilometers: formData.kilometers ? Number(formData.kilometers) : 0,
        hours: formData.hours ? Number(formData.hours) : 0,
      };

      console.log('Enviando datos:', payload);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Respuesta:', data);

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          code: '',
          name: '',
          ownerId: '',
          licensePlate: '',
          kilometers: 0,
          hours: 0,
        });
        fetchEquipment();
      } else {
        setError(data.error || data.details?.[0]?.message || 'Error al guardar equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar equipo');
    }
  };

  const handleEdit = (equip: Equipment) => {
    setEditingId(equip.id);
    setFormData({
      code: equip.code,
      name: equip.name,
      ownerId: equip.ownerId || '',
      licensePlate: equip.licensePlate || '',
      kilometers: equip.kilometers || 0,
      hours: equip.hours || 0,
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este equipo?')) return;

    try {
      const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEquipment();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al eliminar equipo');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      code: '',
      name: '',
      ownerId: '',
      licensePlate: '',
      kilometers: 0,
      hours: 0,
    });
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando equipos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Equipos</h1>
          <p className="text-gray-600 mt-1">Gestiona tus equipos y maquinaria</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <span className="mr-2">+</span>
            Nuevo Equipo
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingId ? 'Editar Equipo' : 'Nuevo Equipo'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <Input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="Ej: EQ-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ej: Excavadora CAT 320"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propietario (Contacto)
                </label>
                <select
                  value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black"
                >
                  <option value="">Sin propietario</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matrícula
                </label>
                <Input
                  type="text"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  placeholder="Ej: ABC-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilómetros
                </label>
                <Input
                  type="number"
                  value={formData.kilometers}
                  onChange={(e) => setFormData({ ...formData, kilometers: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas
                </label>
                <Input
                  type="number"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit">
                {editingId ? 'Actualizar' : 'Crear'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filtros y controles */}
      {!showForm && equipment.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              {/* Buscador */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <Input
                  type="text"
                  placeholder="Código, nombre, matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por propietario */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propietario
                </label>
                <select
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Todos</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle vista */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Vista de lista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title="Vista de tarjetas"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              {/* Botón limpiar filtros */}
              {(searchTerm || filterOwner) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterOwner('');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="text-sm text-gray-600">
              Mostrando {filteredEquipment.length} de {equipment.length} equipos
            </div>
          </div>
        </Card>
      )}

      {equipment.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚜</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay equipos
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza registrando tu primer equipo
            </p>
            <Button onClick={() => setShowForm(true)}>Crear Equipo</Button>
          </div>
        </Card>
      ) : filteredEquipment.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontraron equipos
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar los filtros de búsqueda
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterOwner('');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </Card>
      ) : (
        !showForm && (
          <>
            {/* Vista de lista (tabla) */}
            {viewMode === 'list' && (
              <Card>
                <div className="overflow-x-auto">
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
                          Propietario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Matrícula
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kilómetros
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Horas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEquipment.map((equip) => (
                        <tr key={equip.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {equip.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {equip.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {equip.owner ? equip.owner.name : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {equip.licensePlate || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {equip.kilometers ? equip.kilometers.toLocaleString() + ' km' : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {equip.hours ? equip.hours.toLocaleString() + ' h' : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(equip)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(equip.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Vista de tarjetas */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipment.map((equip) => (
              <Card key={equip.id} className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {equip.name}
                      </h3>
                      <p className="text-sm text-gray-500">Código: {equip.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(equip)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(equip.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {equip.owner && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">👤 Propietario:</span>
                        <span className="text-gray-700 font-medium">
                          {equip.owner.name}
                        </span>
                      </div>
                    )}

                    {equip.licensePlate && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">🚗 Matrícula:</span>
                        <span className="text-gray-700 font-medium">
                          {equip.licensePlate}
                        </span>
                      </div>
                    )}

                    {equip.kilometers !== null && equip.kilometers > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📏 Kilómetros:</span>
                        <span className="text-gray-700 font-medium">
                          {equip.kilometers.toLocaleString()} km
                        </span>
                      </div>
                    )}

                    {equip.hours !== null && equip.hours > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">⏱️ Horas:</span>
                        <span className="text-gray-700 font-medium">
                          {equip.hours.toLocaleString()} h
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Creado: {new Date(equip.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
            )}
          </>
        )
      )}
    </div>
  );
}
