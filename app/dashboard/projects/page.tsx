'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  dueDate: string | null;
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
  _count: {
    tasks: number;
  };
  createdAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const companiesRes = await fetch('/api/companies');
      const companies = await companiesRes.json();
      const activeCompany = companies.find((c: { active: boolean; id: string }) => c.active);

      if (!activeCompany) {
        setError('No hay empresa activa');
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/projects?companyId=${activeCompany.id}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      } else {
        setError('Error al cargar proyectos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      ACTIVE: '🚀 Activo',
      COMPLETED: '✅ Completado',
      ARCHIVED: '📦 Archivado',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.ACTIVE}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getCompletionPercentage = (project: Project) => {
    if (project._count.tasks === 0) return 0;
    const completed = project.tasks.filter(t => t.completed).length;
    return Math.round((completed / project._count.tasks) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Proyectos</h1>
          <p className="text-gray-600 mt-1">Gestiona tus proyectos y tareas</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <span className="mr-2">+</span>
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay proyectos
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza creando tu primer proyecto
            </p>
            <Link href="/dashboard/projects/new">
              <Button>Crear Proyecto</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const completion = getCompletionPercentage(project);
            return (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        ></div>
                        <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">
                          {project.name}
                        </h3>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                  </div>

                  {/* Description */}
                  {project.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-semibold text-gray-800">
                        {completion}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${completion}%`,
                          backgroundColor: project.color,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <span>
                        ✅ {project.tasks.filter(t => t.completed).length} / {project._count.tasks} tareas
                      </span>
                    </div>
                    {project.endDate && (
                      <span className="text-xs">
                        📅 {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
