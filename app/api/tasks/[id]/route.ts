import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1, 'El título es requerido').optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
});

// PUT - Actualizar tarea
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    
    if (validatedData.assignedToId !== undefined) {
      updateData.assignedToId = validatedData.assignedToId || null;
    }
    
    if (validatedData.estimatedHours !== undefined) {
      updateData.estimatedHours = validatedData.estimatedHours || null;
    }
    
    if (validatedData.completed !== undefined) {
      updateData.completed = validatedData.completed;
      if (validatedData.completed) {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    
    if (validatedData.dueDate !== undefined) {
      updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }

    const task = await prisma.task.updateMany({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
      data: updateData,
    });

    if (task.count === 0) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Tarea actualizada' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al actualizar tarea:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tarea' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar tarea
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const task = await prisma.task.deleteMany({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
    });

    if (task.count === 0) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Tarea eliminada' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tarea' },
      { status: 500 }
    );
  }
}
