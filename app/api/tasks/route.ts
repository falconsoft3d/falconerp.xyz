import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const taskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
});

// GET - Listar tareas de un proyecto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const publicAccess = searchParams.get('public') === 'true';

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID es requerido' },
        { status: 400 }
      );
    }

    // Si es acceso público, solo devolver título e ID de tareas no completadas
    if (publicAccess) {
      const tasks = await prisma.task.findMany({
        where: {
          projectId,
          completed: false,
        },
        select: {
          id: true,
          title: true,
        },
        orderBy: [
          { order: 'asc' },
        ],
      });

      return NextResponse.json(tasks);
    }

    // Para acceso autenticado, devolver información completa
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const tasks = await prisma.task.findMany({
      where: {
        userId: effectiveUserId,
        projectId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { completed: 'asc' },
        { order: 'asc' },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    );
  }
}

// POST - Crear tarea
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    // Obtener el último order para este proyecto
    const lastTask = await prisma.task.findFirst({
      where: {
        projectId: validatedData.projectId,
      },
      orderBy: { order: 'desc' },
    });

    const task = await prisma.task.create({
      data: {
        userId: effectiveUserId,
        projectId: validatedData.projectId,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority || 'MEDIUM',
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        assignedToId: validatedData.assignedToId || null,
        estimatedHours: validatedData.estimatedHours || null,
        order: (lastTask?.order || 0) + 1,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al crear tarea:', error);
    return NextResponse.json(
      { error: 'Error al crear tarea' },
      { status: 500 }
    );
  }
}
