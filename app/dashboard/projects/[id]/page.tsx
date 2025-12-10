'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  order: number;
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

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        setError('Error al cargar proyecto');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      });

      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          projectId,
        }),
      });

      if (res.ok) {
        setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
        setShowNewTask(false);
        fetchProject();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error('Error:', error);
    }
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error || 'Proyecto no encontrado'}
      </div>
    );
  }

  const stats = getCompletionStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Link href="/dashboard/projects" className="text-teal-600 hover:text-teal-700 text-sm mb-2 inline-block">
            ← Volver a Proyectos
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }}></div>
            <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
          </div>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Progreso del Proyecto</h3>
            <span className="text-2xl font-bold" style={{ color: project.color }}>
              {stats.percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.percentage}%`, backgroundColor: project.color }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>✅ {stats.completed} completadas</span>
            <span>📋 {stats.total} tareas totales</span>
          </div>
        </div>
      </Card>

      {/* Tasks Section */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Tareas</h2>
            <Button onClick={() => setShowNewTask(!showNewTask)}>
              {showNewTask ? 'Cancelar' : '+ Nueva Tarea'}
            </Button>
          </div>

          {/* New Task Form */}
          {showNewTask && (
            <form onSubmit={handleAddTask} className="bg-gray-50 p-4 rounded-lg space-y-3">
              <Input
                label="Título de la tarea *"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="¿Qué hay que hacer?"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <Input
                  label="Fecha límite"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowNewTask(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agregar Tarea</Button>
              </div>
            </form>
          )}

          {/* Tasks List */}
          <div className="space-y-2">
            {project.tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No hay tareas. ¡Agrega la primera!</p>
              </div>
            ) : (
              project.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    task.completed
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id, task.completed)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />

                  {/* Task Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-medium ${
                          task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {task.dueDate && (
                        <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                      {task.completedAt && (
                        <span className="text-green-600">
                          ✓ Completada {new Date(task.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Eliminar tarea"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
