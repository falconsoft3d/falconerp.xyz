import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createStageSchema = z.object({
  pipelineId: z.string(),
  name: z.string().min(1),
  color: z.string().default('#3b82f6'),
});

// POST - Crear etapa
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createStageSchema.parse(body);

    // Verificar que el pipeline existe y pertenece al usuario
    const pipeline = await prisma.crmPipeline.findFirst({
      where: {
        id: validatedData.pipelineId,
        company: {
          userId: payload.userId,
        },
      },
    });

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline no encontrado' },
        { status: 404 }
      );
    }

    // Contar etapas existentes en el pipeline para el order
    const count = await prisma.crmStage.count({
      where: { pipelineId: validatedData.pipelineId },
    });

    const stage = await prisma.crmStage.create({
      data: {
        ...validatedData,
        order: count,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating stage:', error);
    return NextResponse.json(
      { error: 'Error al crear etapa' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar orden de etapas
export async function PUT(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { stages } = body; // Array de { id, order }

    if (!Array.isArray(stages)) {
      return NextResponse.json(
        { error: 'Se requiere un array de etapas' },
        { status: 400 }
      );
    }

    // Actualizar orden de cada etapa
    await Promise.all(
      stages.map((stage: { id: string; order: number }) =>
        prisma.crmStage.update({
          where: { id: stage.id },
          data: { order: stage.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating stage order:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}
