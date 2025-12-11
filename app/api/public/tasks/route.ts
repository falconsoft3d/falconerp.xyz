import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener tareas asignadas a un usuario por su token de asistencia
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token es requerido' },
        { status: 400 }
      );
    }

    // Buscar el usuario por su token de asistencia
    const user = await prisma.user.findFirst({
      where: {
        attendanceToken: token,
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 404 }
      );
    }

    // Obtener todas las tareas asignadas al usuario que no están completadas
    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: user.id,
        completed: false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
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

// PUT - Marcar tarea como completada
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const body = await request.json();
    const { taskId, completed } = body;

    if (!token || !taskId) {
      return NextResponse.json(
        { error: 'Token y taskId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findFirst({
      where: {
        attendanceToken: token,
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 404 }
      );
    }

    // Verificar que la tarea está asignada al usuario
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignedToId: user.id,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada o no asignada a este usuario' },
        { status: 404 }
      );
    }

    // Actualizar la tarea
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}
