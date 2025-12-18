'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface User {
  id: string;
  name: string;
  email: string;
  hourlyRate?: number | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  order: number;
  cost: number | null;
  assignedTo?: User | null;
}

interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  type: string;
}

interface ProjectStaff {
  id: string;
  userId: string;
  hourlyRate: number;
  role: string | null;
  user: User;
  createdAt: string;
}

interface ProjectExpense {
  id: string;
  projectId: string;
  type: 'MATERIAL' | 'EQUIPMENT' | 'LABOR';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  color: string;
  companyId: string;
  startDate: string | null;
  endDate: string | null;
  productId: string | null;
  salePrice: number | null;
  product?: Product | null;
  tasks: Task[];
  staff?: ProjectStaff[];
  expenses?: ProjectExpense[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedToId: '',
    estimatedHours: '',
    cost: '',
  });
  const [editTask, setEditTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedToId: '',
    estimatedHours: '',
    cost: '',
  });
  const [newStaff, setNewStaff] = useState({
    userId: '',
    hourlyRate: '',
    role: '',
  });
  const [editStaff, setEditStaff] = useState({
    hourlyRate: '',
    role: '',
  });
  const [newExpense, setNewExpense] = useState({
    type: 'MATERIAL',
    description: '',
    quantity: '',
    unitPrice: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [editExpense, setEditExpense] = useState({
    type: 'MATERIAL',
    description: '',
    quantity: '',
    unitPrice: '',
    date: '',
    notes: '',
  });
  const [showEditProject, setShowEditProject] = useState(false);
  const [editProject, setEditProject] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    productId: '',
    salePrice: '',
    color: '#10b981',
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchUsers();
      fetchExpenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        // Cargar productos después de obtener el proyecto
        if (data.companyId) {
          fetchProducts(data.companyId);
        }
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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const fetchProducts = async (companyId?: string) => {
    try {
      // Usar el companyId proporcionado o del proyecto
      const cId = companyId || project?.companyId;
      if (!cId) return;
      
      const res = await fetch(`/api/products?companyId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  // Funciones para gestión de personal
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.userId || !newStaff.hourlyRate) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newStaff.userId,
          hourlyRate: parseFloat(newStaff.hourlyRate),
          role: newStaff.role || null,
        }),
      });

      if (res.ok) {
        setNewStaff({ userId: '', hourlyRate: '', role: '' });
        setShowAddStaff(false);
        fetchProject();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent, staffId: string) => {
    e.preventDefault();
    if (!editStaff.hourlyRate) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hourlyRate: parseFloat(editStaff.hourlyRate),
          role: editStaff.role || null,
        }),
      });

      if (res.ok) {
        setEditingStaffId(null);
        fetchProject();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('¿Eliminar este miembro del equipo?')) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/staff/${staffId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProject();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStartEditStaff = (staff: ProjectStaff) => {
    setEditingStaffId(staff.id);
    setEditStaff({
      hourlyRate: staff.hourlyRate.toString(),
      role: staff.role || '',
    });
  };

  const handleCancelEditStaff = () => {
    setEditingStaffId(null);
    setEditStaff({ hourlyRate: '', role: '' });
  };

  // Funciones para gestión de gastos
  const fetchExpenses = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Error al cargar gastos:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.type || !newExpense.description || !newExpense.quantity || !newExpense.unitPrice) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newExpense.type,
          description: newExpense.description,
          quantity: parseFloat(newExpense.quantity),
          unitPrice: parseFloat(newExpense.unitPrice),
          date: newExpense.date,
          notes: newExpense.notes || null,
        }),
      });

      if (res.ok) {
        setNewExpense({
          type: 'MATERIAL',
          description: '',
          quantity: '',
          unitPrice: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
        });
        setShowAddExpense(false);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent, expenseId: string) => {
    e.preventDefault();
    if (!editExpense.type || !editExpense.description || !editExpense.quantity || !editExpense.unitPrice) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expenseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: editExpense.type,
          description: editExpense.description,
          quantity: parseFloat(editExpense.quantity),
          unitPrice: parseFloat(editExpense.unitPrice),
          date: editExpense.date,
          notes: editExpense.notes || null,
        }),
      });

      if (res.ok) {
        setEditingExpenseId(null);
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleStartEditExpense = (expense: ProjectExpense) => {
    setEditingExpenseId(expense.id);
    setEditExpense({
      type: expense.type,
      description: expense.description,
      quantity: expense.quantity.toString(),
      unitPrice: expense.unitPrice.toString(),
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
    });
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditExpense({
      type: 'MATERIAL',
      description: '',
      quantity: '',
      unitPrice: '',
      date: '',
      notes: '',
    });
  };

  // Calcular coste total de personal
  const getStaffCosts = () => {
    if (!project?.staff) return { totalHourlyRate: 0, staffCount: 0 };
    const totalHourlyRate = project.staff.reduce((sum, s) => sum + parseFloat(s.hourlyRate.toString()), 0);
    return { totalHourlyRate, staffCount: project.staff.length };
  };

  // Calcular coste total de tareas
  const getTasksCosts = () => {
    if (!project?.tasks) return { totalTasksCost: 0, tasksWithCost: 0 };
    const totalTasksCost = project.tasks.reduce((sum, t) => {
      return sum + (t.cost ? parseFloat(t.cost.toString()) : 0);
    }, 0);
    const tasksWithCost = project.tasks.filter(t => t.cost && t.cost > 0).length;
    return { totalTasksCost, tasksWithCost };
  };

  // Calcular coste total de gastos
  const getExpensesCosts = () => {
    const materials = expenses.filter(e => e.type === 'MATERIAL').reduce((sum, e) => sum + parseFloat(e.totalPrice.toString()), 0);
    const equipment = expenses.filter(e => e.type === 'EQUIPMENT').reduce((sum, e) => sum + parseFloat(e.totalPrice.toString()), 0);
    const labor = expenses.filter(e => e.type === 'LABOR').reduce((sum, e) => sum + parseFloat(e.totalPrice.toString()), 0);
    const total = materials + equipment + labor;
    return { materials, equipment, labor, total, count: expenses.length };
  };

  // Funciones para editar proyecto
  const handleStartEditProject = () => {
    if (!project) return;
    setEditProject({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      productId: project.productId || '',
      salePrice: project.salePrice?.toString() || '',
      color: project.color,
    });
    setShowEditProject(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProject.name) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProject.name,
          description: editProject.description || null,
          status: editProject.status,
          startDate: editProject.startDate || null,
          endDate: editProject.endDate || null,
          productId: editProject.productId || null,
          salePrice: editProject.salePrice ? parseFloat(editProject.salePrice) : null,
          color: editProject.color,
        }),
      });

      if (res.ok) {
        setShowEditProject(false);
        fetchProject();
      }
    } catch (error) {
      console.error('Error:', error);
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
      const taskData = {
        ...newTask,
        projectId,
        estimatedHours: newTask.estimatedHours ? parseFloat(newTask.estimatedHours) : undefined,
        cost: newTask.cost ? parseFloat(newTask.cost) : undefined,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedToId: '', estimatedHours: '', cost: '' });
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

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTask({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedToId: task.assignedTo?.id || '',
      estimatedHours: '',
      cost: task.cost?.toString() || '',
    });
  };
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditTask({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      assignedToId: '',
      estimatedHours: '',
      cost: '',
    });
  };

  const handleUpdateTask = async (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    if (!editTask.title.trim()) return;

    try {
      const taskData = {
        ...editTask,
        estimatedHours: editTask.estimatedHours ? parseFloat(editTask.estimatedHours) : null,
        cost: editTask.cost ? parseFloat(editTask.cost) : null,
      };

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        setEditingTaskId(null);
        setEditingTaskId(null);
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

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/public/projects/${projectId}`;
    navigator.clipboard.writeText(publicUrl);
    alert('¡Enlace copiado al portapapeles! 📋');
  };

  const handleOpenPublicView = () => {
    const publicUrl = `/public/projects/${projectId}`;
    window.open(publicUrl, '_blank');
  };

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
        <div className="flex gap-2">
          <Button
            onClick={handleStartEditProject}
            variant="secondary"
            className="flex items-center gap-2"
          >
            ✏️ Editar
          </Button>
          <Button
            onClick={handleCopyPublicLink}
            variant="secondary"
            className="flex items-center gap-2"
          >
            📋 Copiar Enlace
          </Button>
          <Button
            onClick={handleOpenPublicView}
            className="flex items-center gap-2"
          >
            🔗 Vista Pública
          </Button>
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Editar Proyecto</h2>
            <form onSubmit={handleUpdateProject} className="space-y-4">
              <Input
                label="Nombre del proyecto *"
                value={editProject.name}
                onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editProject.description}
                  onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={editProject.status}
                    onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="ARCHIVED">Archivado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={editProject.color}
                    onChange={(e) => setEditProject({ ...editProject, color: e.target.value })}
                    className="w-full h-10 px-1 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Fecha de inicio"
                  type="date"
                  value={editProject.startDate}
                  onChange={(e) => setEditProject({ ...editProject, startDate: e.target.value })}
                />
                <Input
                  label="Fecha de fin"
                  type="date"
                  value={editProject.endDate}
                  onChange={(e) => setEditProject({ ...editProject, endDate: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto/Servicio</label>
                  <select
                    value={editProject.productId}
                    onChange={(e) => setEditProject({ ...editProject, productId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Sin producto</option>
                    {products.filter(p => p).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.code} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Precio de venta"
                  type="number"
                  step="0.01"
                  value={editProject.salePrice}
                  onChange={(e) => setEditProject({ ...editProject, salePrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEditProject(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                <Input
                  label="Horas estimadas"
                  type="number"
                  step="0.5"
                  min="0"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                  placeholder="ej: 8"
                />
                <Input
                  label="Coste (€)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTask.cost}
                  onChange={(e) => setNewTask({ ...newTask, cost: e.target.value })}
                  placeholder="0.00"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                  <select
                    value={newTask.assignedToId}
                    onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="">Sin asignar</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className={`rounded-lg border transition-all ${
                    task.completed
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-white border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {editingTaskId === task.id ? (
                    // Edit Form
                    <form onSubmit={(e) => handleUpdateTask(e, task.id)} className="p-3 space-y-3">
                      <Input
                        label="Título de la tarea *"
                        value={editTask.title}
                        onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                        placeholder="¿Qué hay que hacer?"
                        required
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea
                          value={editTask.description}
                          onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                          placeholder="Descripción opcional..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                          <select
                            value={editTask.priority}
                            onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
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
                          value={editTask.dueDate}
                          onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                        />
                        <Input
                          label="Horas estimadas"
                          type="number"
                          step="0.5"
                          min="0"
                          value={editTask.estimatedHours}
                          onChange={(e) => setEditTask({ ...editTask, estimatedHours: e.target.value })}
                          placeholder="ej: 8"
                        />
                        <Input
                          label="Coste (€)"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editTask.cost}
                          onChange={(e) => setEditTask({ ...editTask, cost: e.target.value })}
                          placeholder="0.00"
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                          <select
                            value={editTask.assignedToId}
                            onChange={(e) => setEditTask({ ...editTask, assignedToId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                          >
                            <option value="">Sin asignar</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                        <Button type="submit">Guardar Cambios</Button>
                      </div>
                    </form>
                  ) : (
                    // Task Display
                    <div className="flex items-start gap-3 p-3">
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
                          {task.assignedTo && (
                            <span className="flex items-center gap-1">
                              👤 {task.assignedTo.name}
                            </span>
                          )}
                          {task.completedAt && (
                            <span className="text-green-600">
                              ✓ Completada {new Date(task.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Editar tarea"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar tarea"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* KPI de Costes y Facturación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Coste de Personal */}
        <Card>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">💰 Coste Personal</h3>
            <p className="text-2xl font-bold text-gray-800">
              {getStaffCosts().totalHourlyRate.toFixed(2)} €/h
            </p>
            <p className="text-xs text-gray-500">
              {getStaffCosts().staffCount} miembro{getStaffCosts().staffCount !== 1 ? 's' : ''} del equipo
            </p>
          </div>
        </Card>

        {/* Precio de Venta */}
        <Card>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">💵 Precio de Venta</h3>
            <p className="text-2xl font-bold text-gray-800">
              {project.salePrice ? `${parseFloat(project.salePrice.toString()).toFixed(2)} €` : 'No definido'}
            </p>
            {project.product && (
              <p className="text-xs text-gray-500">📦 {project.product.name}</p>
            )}
          </div>
        </Card>

        {/* Margen */}
        <Card>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">📊 Margen</h3>
            {project.salePrice && getStaffCosts().totalHourlyRate > 0 ? (
              <>
                <p className={`text-2xl font-bold ${
                  parseFloat(project.salePrice.toString()) > getStaffCosts().totalHourlyRate 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {(parseFloat(project.salePrice.toString()) - getStaffCosts().totalHourlyRate).toFixed(2)} €
                </p>
                <p className="text-xs text-gray-500">
                  {((parseFloat(project.salePrice.toString()) - getStaffCosts().totalHourlyRate) / parseFloat(project.salePrice.toString()) * 100).toFixed(1)}% margen
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Datos incompletos</p>
            )}
          </div>
        </Card>

        {/* Fechas del Proyecto */}
        <Card>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">📅 Duración</h3>
            {project.startDate && project.endDate ? (
              <>
                <p className="text-sm text-gray-800">
                  Inicio: {new Date(project.startDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-800">
                  Fin: {new Date(project.endDate).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Fechas no definidas</p>
            )}
          </div>
        </Card>
      </div>

      {/* Personal del Proyecto */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">👥 Equipo del Proyecto</h2>
            <Button onClick={() => setShowAddStaff(!showAddStaff)}>
              {showAddStaff ? 'Cancelar' : '+ Agregar Personal'}
            </Button>
          </div>

          {/* Formulario Agregar Personal */}
          {showAddStaff && (
            <form onSubmit={handleAddStaff} className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
                  <select
                    value={newStaff.userId}
                    onChange={(e) => setNewStaff({ ...newStaff, userId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                    required
                  >
                    <option value="">Seleccionar usuario...</option>
                    {users
                      .filter(u => !project?.staff?.some(s => s.userId === u.id))
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.hourlyRate ? `(${user.hourlyRate}€/h)` : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <Input
                  label="Coste por Hora (€) *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newStaff.hourlyRate}
                  onChange={(e) => setNewStaff({ ...newStaff, hourlyRate: e.target.value })}
                  placeholder="ej: 25.00"
                  required
                />
                <Input
                  label="Rol en el Proyecto"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  placeholder="ej: Desarrollador, PM..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddStaff(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agregar al Equipo</Button>
              </div>
            </form>
          )}

          {/* Lista de Personal */}
          <div className="space-y-2">
            {!project?.staff || project.staff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">👤</div>
                <p>No hay personal asignado. ¡Agrega el primer miembro!</p>
              </div>
            ) : (
              project.staff.map((staff) => (
                <div key={staff.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  {editingStaffId === staff.id ? (
                    <form onSubmit={(e) => handleUpdateStaff(e, staff.id)} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Coste por Hora (€) *"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editStaff.hourlyRate}
                          onChange={(e) => setEditStaff({ ...editStaff, hourlyRate: e.target.value })}
                          required
                        />
                        <Input
                          label="Rol en el Proyecto"
                          value={editStaff.role}
                          onChange={(e) => setEditStaff({ ...editStaff, role: e.target.value })}
                          placeholder="ej: Desarrollador, PM..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={handleCancelEditStaff}>
                          Cancelar
                        </Button>
                        <Button type="submit">Guardar Cambios</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-800">{staff.user.name}</h3>
                          {staff.role && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {staff.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>📧 {staff.user.email}</span>
                          <span className="font-semibold text-green-600">
                            💰 {parseFloat(staff.hourlyRate.toString()).toFixed(2)} €/hora
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEditStaff(staff)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Gastos del Proyecto */}
      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">💰 Gastos del Proyecto</h2>
            <Button onClick={() => setShowAddExpense(!showAddExpense)}>
              {showAddExpense ? 'Cancelar' : '+ Agregar Gasto'}
            </Button>
          </div>

          {/* Resumen de Gastos */}
          {expenses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getExpensesCosts().materials.toFixed(2)}€
                </div>
                <div className="text-xs text-gray-600">Materiales</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {getExpensesCosts().equipment.toFixed(2)}€
                </div>
                <div className="text-xs text-gray-600">Equipos</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {getExpensesCosts().labor.toFixed(2)}€
                </div>
                <div className="text-xs text-gray-600">Mano de Obra</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getExpensesCosts().total.toFixed(2)}€
                </div>
                <div className="text-xs text-gray-600">Total Gastos</div>
              </div>
            </div>
          )}

          {/* Formulario Agregar Gasto */}
          {showAddExpense && (
            <form onSubmit={handleAddExpense} className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto *</label>
                  <select
                    value={newExpense.type}
                    onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as 'MATERIAL' | 'EQUIPMENT' | 'LABOR' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                    required
                  >
                    <option value="MATERIAL">💎 Materiales</option>
                    <option value="EQUIPMENT">🔧 Equipos</option>
                    <option value="LABOR">👷 Mano de Obra</option>
                  </select>
                </div>
                <Input
                  label="Descripción *"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="ej: Cemento Portland..."
                  required
                />
                <Input
                  label="Cantidad *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.quantity}
                  onChange={(e) => setNewExpense({ ...newExpense, quantity: e.target.value })}
                  placeholder="ej: 10"
                  required
                />
                <Input
                  label="Precio Unitario (€) *"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newExpense.unitPrice}
                  onChange={(e) => setNewExpense({ ...newExpense, unitPrice: e.target.value })}
                  placeholder="ej: 25.50"
                  required
                />
                <Input
                  label="Fecha *"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Notas"
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                placeholder="Notas adicionales..."
              />
              {newExpense.quantity && newExpense.unitPrice && (
                <div className="text-right text-lg font-bold text-gray-800">
                  Total: {(parseFloat(newExpense.quantity) * parseFloat(newExpense.unitPrice)).toFixed(2)}€
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddExpense(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Agregar Gasto</Button>
              </div>
            </form>
          )}

          {/* Lista de Gastos */}
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💰</div>
                <p>No hay gastos registrados. ¡Agrega el primero!</p>
              </div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  {editingExpenseId === expense.id ? (
                    <form onSubmit={(e) => handleUpdateExpense(e, expense.id)} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Gasto *</label>
                          <select
                            value={editExpense.type}
                            onChange={(e) => setEditExpense({ ...editExpense, type: e.target.value as 'MATERIAL' | 'EQUIPMENT' | 'LABOR' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                            required
                          >
                            <option value="MATERIAL">💎 Materiales</option>
                            <option value="EQUIPMENT">🔧 Equipos</option>
                            <option value="LABOR">👷 Mano de Obra</option>
                          </select>
                        </div>
                        <Input
                          label="Descripción *"
                          value={editExpense.description}
                          onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
                          required
                        />
                        <Input
                          label="Cantidad *"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editExpense.quantity}
                          onChange={(e) => setEditExpense({ ...editExpense, quantity: e.target.value })}
                          required
                        />
                        <Input
                          label="Precio Unitario (€) *"
                          type="number"
                          step="0.01"
                          min="0"
                          value={editExpense.unitPrice}
                          onChange={(e) => setEditExpense({ ...editExpense, unitPrice: e.target.value })}
                          required
                        />
                        <Input
                          label="Fecha *"
                          type="date"
                          value={editExpense.date}
                          onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
                          required
                        />
                      </div>
                      <Input
                        label="Notas"
                        value={editExpense.notes}
                        onChange={(e) => setEditExpense({ ...editExpense, notes: e.target.value })}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={handleCancelEditExpense}>
                          Cancelar
                        </Button>
                        <Button type="submit">Guardar Cambios</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {expense.type === 'MATERIAL' && '💎'}
                            {expense.type === 'EQUIPMENT' && '🔧'}
                            {expense.type === 'LABOR' && '👷'}
                          </span>
                          <h3 className="font-semibold text-gray-800">{expense.description}</h3>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                            {expense.type === 'MATERIAL' && 'Material'}
                            {expense.type === 'EQUIPMENT' && 'Equipo'}
                            {expense.type === 'LABOR' && 'Mano de Obra'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>📦 Cantidad: {parseFloat(expense.quantity.toString())}</span>
                          <span>💵 P. Unitario: {parseFloat(expense.unitPrice.toString()).toFixed(2)}€</span>
                          <span className="font-semibold text-green-600">
                            💰 Total: {parseFloat(expense.totalPrice.toString()).toFixed(2)}€
                          </span>
                          <span>📅 {new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                        {expense.notes && (
                          <p className="text-xs text-gray-500 mt-1">📝 {expense.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEditExpense(expense)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
