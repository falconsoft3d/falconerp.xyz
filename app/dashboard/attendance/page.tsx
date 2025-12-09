'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/DataTable';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Attendance {
  id: string;
  userId: string;
  user: User;
  date: string;
  checkIn: string;
  checkOut: string | null;
  notes: string | null;
}

export default function AttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  useEffect(() => {
    fetchActiveCompany();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeCompany) {
      fetchAttendances();
    }
  }, [activeCompany, selectedDate]);

  const fetchActiveCompany = async () => {
    try {
      const res = await fetch('/api/companies?active=true');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setActiveCompany(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching active company:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAttendances = async () => {
    if (!activeCompany) return;

    try {
      setLoading(true);
      const res = await fetch(
        `/api/attendance?companyId=${activeCompany.id}&date=${selectedDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setAttendances(data);
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedUser || !activeCompany) return;

    try {
      const today = selectedDate;
      const dateObj = new Date(today);
      dateObj.setHours(0, 0, 0, 0);
      
      const checkInDateTime = checkInTime 
        ? new Date(`${today}T${checkInTime}:00`)
        : new Date();
      
      const checkOutDateTime = checkOutTime 
        ? new Date(`${today}T${checkOutTime}:00`)
        : null;

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          companyId: activeCompany.id,
          date: dateObj.toISOString(),
          checkIn: checkInDateTime.toISOString(),
          checkOut: checkOutDateTime?.toISOString() || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        alert('Asistencia registrada exitosamente');
        setShowCheckInModal(false);
        setSelectedUser('');
        setCheckInTime('');
        setCheckOutTime('');
        setNotes('');
        fetchAttendances();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al registrar asistencia');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar asistencia');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedAttendance) return;

    try {
      const res = await fetch(`/api/attendance/${selectedAttendance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkOut: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        alert('Salida registrada exitosamente');
        setShowCheckOutModal(false);
        setSelectedAttendance(null);
        fetchAttendances();
      } else {
        alert('Error al registrar salida');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar salida');
    }
  };

  const handleDelete = async (item: { id: string }) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;

    try {
      const res = await fetch(`/api/attendance/${item.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Registro eliminado exitosamente');
        fetchAttendances();
      } else {
        alert('Error al eliminar registro');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar registro');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return '-';
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const columns = [
    { 
      key: 'user', 
      label: 'Usuario',
      sortable: true,
      searchable: true,
      render: (attendance: Attendance) => (
        <div>
          <div className="font-medium text-gray-900">{attendance.user.name}</div>
          <div className="text-sm text-gray-500">{attendance.user.email}</div>
        </div>
      )
    },
    { 
      key: 'date', 
      label: 'Fecha',
      sortable: true,
      render: (attendance: Attendance) => new Date(attendance.date).toLocaleDateString('es-ES')
    },
    { 
      key: 'checkIn', 
      label: 'Hora Entrada',
      sortable: true,
      render: (attendance: Attendance) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          {formatTime(attendance.checkIn)}
        </span>
      )
    },
    { 
      key: 'checkOut', 
      label: 'Hora Salida',
      render: (attendance: Attendance) => attendance.checkOut ? (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          {formatTime(attendance.checkOut)}
        </span>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedAttendance(attendance);
            setShowCheckOutModal(true);
          }}
        >
          Registrar Salida
        </Button>
      )
    },
    { 
      key: 'hours', 
      label: 'Horas',
      render: (attendance: Attendance) => (
        <span className="font-medium text-gray-900">
          {calculateHours(attendance.checkIn, attendance.checkOut)}
        </span>
      )
    },
  ];

  if (loading && !activeCompany) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Control de Asistencia</h1>
          <p className="text-sm text-gray-600 mt-1">
            Registra entradas y salidas del personal
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
          <Button onClick={() => setShowCheckInModal(true)}>
            + Registrar Asistencia
          </Button>
        </div>
      </div>

      <DataTable
        title="Asistencias"
        data={attendances}
        columns={columns}
        onDelete={handleDelete}
        emptyMessage="No hay registros de asistencia para esta fecha"
      />

      {/* Modal Registrar Asistencia */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Registrar Asistencia</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuario *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Entrada (opcional)
                  </label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Si no se especifica, se usa la hora actual"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no se especifica, se usa la hora actual
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Salida (opcional)
                  </label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Opcional"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Puedes dejarlo vacío y registrarlo después
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={3}
                    placeholder="Observaciones..."
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCheckInModal(false);
                      setSelectedUser('');
                      setCheckInTime('');
                      setCheckOutTime('');
                      setNotes('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCheckIn} disabled={!selectedUser}>
                    Registrar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Registrar Salida */}
      {showCheckOutModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Registrar Salida</h2>
              
              <div className="space-y-4">
                <p className="text-gray-700">
                  ¿Confirmar salida para <strong>{selectedAttendance.user.name}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Hora de entrada: {formatTime(selectedAttendance.checkIn)}
                </p>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCheckOutModal(false);
                      setSelectedAttendance(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCheckOut}>
                    Confirmar Salida
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
