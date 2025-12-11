'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface TodayAttendance {
  id: string;
  checkIn: string;
  checkOut: string | null;
  notes: string | null;
}

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

interface AttendanceData {
  user: User;
  company: Company;
  todayAttendance: TodayAttendance | null;
}

export default function AttendanceMobilePage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AttendanceData | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');

  useEffect(() => {
    if (token) {
      fetchAttendanceData();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchMyTasks();
    }
  }, [token]);

  useEffect(() => {
    if (data?.company.id) {
      fetchProjects();
    }
  }, [data?.company.id]);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    } else {
      setTasks([]);
      setSelectedTask('');
    }
  }, [selectedProject]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('=== Fetching attendance data ===');
      const res = await fetch(`/api/public/attendance/${token}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error fetching data:', errorData);
        setError(errorData.error || 'Error al cargar los datos');
        return;
      }

      const data = await res.json();
      console.log('Attendance data received:', data);
      setData(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/projects?companyId=${data?.company.id}&public=true`);
      if (res.ok) {
        const projectsData = await res.json();
        setProjects(projectsData);
      }
    } catch (err) {
      console.error('Error al cargar proyectos:', err);
    }
  };

  const fetchTasks = async (projectId: string) => {
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}&public=true`);
      if (res.ok) {
        const tasksData = await res.json();
        setTasks(tasksData);
      }
    } catch (err) {
      console.error('Error al cargar tareas:', err);
      setTasks([]);
    }
  };

  const fetchMyTasks = async () => {
    if (!token) return;
    
    try {
      const res = await fetch(`/api/public/tasks?token=${token}`);
      if (res.ok) {
        const tasksData = await res.json();
        setMyTasks(tasksData);
      }
    } catch (err) {
      console.error('Error al cargar mis tareas:', err);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/public/tasks?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          completed: !completed,
        }),
      });

      if (res.ok) {
        // Actualizar la lista de tareas
        fetchMyTasks();
      }
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
    }
  };

  const handleAction = async (action: 'check-in' | 'check-out') => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      console.log('=== Frontend: Sending request ===');
      console.log('Action:', action);
      console.log('Notes:', notes);
      console.log('Project:', selectedProject);
      console.log('Task:', selectedTask);

      const res = await fetch(`/api/public/attendance/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          notes: notes.trim() || null,
          projectId: selectedProject || null,
          taskId: selectedTask || null
        })
      });

      console.log('Response status:', res.status);
      const result = await res.json();
      console.log('Response data:', result);

      if (!res.ok) {
        console.log('Error response:', result);
        setError(result.error || 'Error al registrar');
        return;
      }

      console.log('Success! Message:', result.message);
      setSuccess(result.message);
      setNotes('');
      setShowNotes(false);
      setSelectedProject('');
      setSelectedTask('');
      
      // Recargar datos primero
      await fetchAttendanceData();
      
      // Mantener el mensaje de éxito por más tiempo
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const primaryColor = data.company.primaryColor || '#0284c7';
  // Determinar si hay un registro abierto (entrada sin salida)
  const hasOpenAttendance = data.todayAttendance && !data.todayAttendance.checkOut;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(to bottom right, ${primaryColor}15, ${primaryColor}05)`
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
        {/* Header con logo y empresa */}
        <div className="text-center mb-8">
          {data.company.logo ? (
            <img 
              src={data.company.logo} 
              alt={data.company.name}
              className="h-16 w-auto mx-auto mb-4"
            />
          ) : (
            <div 
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-white text-2xl font-bold">
                {data.company.name.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-800">{data.company.name}</h1>
          <p className="text-gray-600 mt-1">Control de Asistencia</p>
        </div>

        {/* Información del usuario */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3">
            {data.user.image ? (
              <img 
                src={data.user.image} 
                alt={data.user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {data.user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800">{data.user.name}</p>
              <p className="text-sm text-gray-600">{data.user.email}</p>
            </div>
          </div>
        </div>

        {/* Estado actual */}
        {data.todayAttendance && (
          <div className={`${hasOpenAttendance ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} border-2 rounded-2xl p-4 mb-6`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">{hasOpenAttendance ? '🟢' : '✅'}</div>
              <div className="flex-1">
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Entrada:</span>{' '}
                    {new Date(data.todayAttendance.checkIn).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {data.todayAttendance.checkOut && (
                    <p className="text-gray-600">
                      <span className="font-medium">Salida:</span>{' '}
                      {new Date(data.todayAttendance.checkOut).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-800 mt-2">
                  {hasOpenAttendance ? 'Registro Activo' : 'Último Registro'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensajes de éxito/error */}
        {success && (
          <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 mb-6 text-center animate-pulse">
            <div className="text-5xl mb-2">✅</div>
            <p className="text-green-800 font-bold text-lg">{success}</p>
          </div>
        )}

        {error && data && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 mb-6 text-center">
            <div className="text-5xl mb-2">❌</div>
            <p className="text-red-800 font-bold text-lg">{error}</p>
          </div>
        )}

        {/* Selector de Proyecto */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proyecto (opcional)
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">Sin proyecto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Tarea */}
        {selectedProject && tasks.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarea (opcional)
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="">Sin tarea específica</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Agregar Nota */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📝 Agregar Nota</h3>
          {!showNotes ? (
            <button
              onClick={() => setShowNotes(true)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar nota
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">
                  Notas (opcional)
                </label>
                <button
                  onClick={() => {
                    setShowNotes(false);
                    setNotes('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar nota..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Mis Tareas */}
        {myTasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">✅ Mis Tareas</h3>
            <div className="border-2 border-gray-200 rounded-xl p-3 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {myTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleTask(task.id, task.completed);
                      }}
                      className="mt-0.5 w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      {task.project && (
                        <div className="flex items-center gap-1 mt-1">
                          <div 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: task.project.color }}
                          ></div>
                          <span className="text-xs text-gray-600 truncate">
                            {task.project.name}
                          </span>
                        </div>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          📅 {new Date(task.dueDate).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="space-y-3">
          {/* Mostrar botón de ENTRADA si no hay registro abierto */}
          {!hasOpenAttendance && (
            <button
              onClick={() => handleAction('check-in')}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Registrar Entrada
                </>
              )}
            </button>
          )}

          {/* Mostrar botón de SALIDA si hay un registro abierto */}
          {hasOpenAttendance && (
            <button
              onClick={() => handleAction('check-out')}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Registrar Salida
                </>
              )}
            </button>
          )}
        </div>

        {/* Hora actual */}
        <div className="mt-8 text-center">
          <p className="text-4xl font-bold text-gray-800">
            {new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
