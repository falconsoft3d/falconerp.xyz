'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface WebContact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function WebContactsPage() {
  const [contacts, setContacts] = useState<WebContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedContact, setSelectedContact] = useState<WebContact | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchContacts();
  }, [filter]);

  const fetchContacts = async () => {
    try {
      const url = filter === 'ALL' 
        ? '/api/web-contacts' 
        : `/api/web-contacts?status=${filter}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
      } else {
        setError('Error al cargar contactos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/web-contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddNotes = async () => {
    if (!selectedContact) return;

    try {
      const res = await fetch(`/api/web-contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (res.ok) {
        setSelectedContact(null);
        setNotes('');
        fetchContacts();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este contacto?')) return;

    try {
      const res = await fetch(`/api/web-contacts/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONTACTED: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      PENDING: '⏳ Pendiente',
      CONTACTED: '💬 Contactado',
      CLOSED: '✓ Cerrado',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Contactos Web</h1>
        <div className="flex gap-2">
          <Button
            variant={filter === 'ALL' ? 'primary' : 'secondary'}
            onClick={() => setFilter('ALL')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'PENDING' ? 'primary' : 'secondary'}
            onClick={() => setFilter('PENDING')}
          >
            Pendientes
          </Button>
          <Button
            variant={filter === 'CONTACTED' ? 'primary' : 'secondary'}
            onClick={() => setFilter('CONTACTED')}
          >
            Contactados
          </Button>
          <Button
            variant={filter === 'CLOSED' ? 'primary' : 'secondary'}
            onClick={() => setFilter('CLOSED')}
          >
            Cerrados
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {contacts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg">No hay contactos</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {contact.name}
                      </h3>
                      {getStatusBadge(contact.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📧 {contact.email}</p>
                      {contact.phone && <p>📱 {contact.phone}</p>}
                      {contact.company && <p>🏢 {contact.company}</p>}
                      <p className="text-xs text-gray-500">
                        📅 {new Date(contact.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setNotes(contact.notes || '');
                      }}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="Agregar notas"
                    >
                      📝
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Mensaje:</p>
                  <p className="text-sm text-gray-600">{contact.message}</p>
                </div>

                {contact.notes && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-1">Notas:</p>
                    <p className="text-sm text-blue-600">{contact.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {contact.status !== 'CONTACTED' && (
                    <Button
                      variant="secondary"
                      onClick={() => handleStatusChange(contact.id, 'CONTACTED')}
                    >
                      Marcar como Contactado
                    </Button>
                  )}
                  {contact.status !== 'CLOSED' && (
                    <Button
                      variant="secondary"
                      onClick={() => handleStatusChange(contact.id, 'CLOSED')}
                    >
                      Cerrar
                    </Button>
                  )}
                  {contact.status === 'CLOSED' && (
                    <Button
                      variant="secondary"
                      onClick={() => handleStatusChange(contact.id, 'PENDING')}
                    >
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para agregar notas */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Agregar Notas - {selectedContact.name}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Escribe tus notas aquí..."
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddNotes}>Guardar</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedContact(null);
                  setNotes('');
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
