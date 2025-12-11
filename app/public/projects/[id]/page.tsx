'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  assignedTo?: User | null;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  color: string;
  startDate: string | null;
  endDate: string | null;
  tasks: Task[];
}

export default function PublicProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/public/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        setError('Proyecto no encontrado');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetCompleted: boolean) => {
    if (!draggedTask || draggedTask.completed === targetCompleted) {
      setDraggedTask(null);
      return;
    }

    await handleToggleComplete(draggedTask.id, draggedTask.completed);
    setDraggedTask(null);
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    const labels = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', URGENT: 'Urgente' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const getCompletionStats = () => {
    if (!project) return { completed: 0, total: 0, percentage: 0 };
    const completed = project.tasks.filter(t => t.completed).length;
    const total = project.tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Proyecto no encontrado'}</p>
        </div>
      </div>
    );
  }

  const stats = getCompletionStats();
  const completedTasks = project.tasks.filter(t => t.completed);
  const pendingTasks = project.tasks.filter(t => !t.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header del Proyecto */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }}></div>
            <h1 className="text-4xl font-bold text-gray-800">{project.name}</h1>
          </div>
          
          {project.description && (
            <p className="text-gray-600 mb-6">{project.description}</p>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Tareas</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completadas</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{pendingTasks.length}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.percentage}%</div>
              <div className="text-sm text-gray-600">Progreso</div>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="h-4 rounded-full transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
              style={{ width: `${stats.percentage}%`, backgroundColor: project.color }}
            >
              {stats.percentage > 10 && `${stats.percentage}%`}
            </div>
          </div>

          {/* Fechas */}
          {(project.startDate || project.endDate) && (
            <div className="flex gap-4 mt-4 text-sm text-gray-600">
              {project.startDate && (
                <div>
                  <span className="font-medium">Inicio:</span>{' '}
                  {new Date(project.startDate).toLocaleDateString('es-ES')}
                </div>
              )}
              {project.endDate && (
                <div>
                  <span className="font-medium">Fin:</span>{' '}
                  {new Date(project.endDate).toLocaleDateString('es-ES')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columnas de Tareas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tareas Completadas */}
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 transition-all"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(true)}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="text-3xl">✅</div>
              <h2 className="text-2xl font-bold text-gray-800">Completadas</h2>
              <span className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>Aún no hay tareas completadas</p>
                </div>
              ) : (
                completedTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-green-50 border-2 border-green-200 rounded-xl p-4 hover:shadow-md transition-all cursor-move hover:scale-[1.02]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800 line-through">{task.title}</h3>
                          {getPriorityBadge(task.priority)}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {task.completedAt && (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              ✓ {new Date(task.completedAt).toLocaleDateString('es-ES')}
                            </span>
                          )}
                          {task.estimatedHours && (
                            <span className="flex items-center gap-1">
                              ⏱️ {task.estimatedHours}h
                            </span>
                          )}
                          {task.assignedTo && (
                            <span className="flex items-center gap-1">
                              👤 {task.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tareas Pendientes */}
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 transition-all"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(false)}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="text-3xl">⏳</div>
              <h2 className="text-2xl font-bold text-gray-800">Pendientes</h2>
              <span className="ml-auto bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                {pendingTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>¡No hay tareas pendientes!</p>
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 hover:shadow-md transition-all cursor-move hover:scale-[1.02]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-800">{task.title}</h3>
                          {getPriorityBadge(task.priority)}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              📅 {new Date(task.dueDate).toLocaleDateString('es-ES')}
                            </span>
                          )}
                          {task.estimatedHours && (
                            <span className="flex items-center gap-1">
                              ⏱️ {task.estimatedHours}h
                            </span>
                          )}
                          {task.assignedTo && (
                            <span className="flex items-center gap-1">
                              👤 {task.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Vista pública del proyecto • Actualizada en tiempo real</p>
        </div>
      </div>
    </div>
  );
}
