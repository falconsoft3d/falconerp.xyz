import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateOpportunitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  value: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'WON', 'LOST']).optional(),
  contactId: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const moveOpportunitySchema = z.object({
  stageId: z.string(),
  order: z.number().optional(),
});

// GET - Obtener una oportunidad
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const opportunity = await prisma.crmOpportunity.findFirst({
      where: {
        id: params.id,
        company: {
          userId: payload.userId,
        },
      },
      include: {
        stage: true,
        pipeline: true,
        contact: true,
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Oportunidad no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { error: 'Error al obtener oportunidad' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar oportunidad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateOpportunitySchema.parse(body);

    // Convertir fecha si existe
    const expectedCloseDate = validatedData.expectedCloseDate
      ? new Date(validatedData.expectedCloseDate)
      : undefined;

    // Si el status cambia a WON o LOST, establecer closedDate
    const closedDate =
      validatedData.status && validatedData.status !== 'OPEN'
        ? new Date()
        : undefined;

    const opportunity = await prisma.crmOpportunity.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        expectedCloseDate,
        closedDate,
      },
      include: {
        stage: true,
        contact: true,
      },
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Error al actualizar oportunidad' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar oportunidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.crmOpportunity.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      { error: 'Error al eliminar oportunidad' },
      { status: 500 }
    );
  }
}

// PATCH - Mover oportunidad a otra etapa
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = moveOpportunitySchema.parse(body);

    // Si se proporciona order, usarlo; si no, poner al final de la etapa
    let order = validatedData.order;
    if (order === undefined) {
      const count = await prisma.crmOpportunity.count({
        where: { stageId: validatedData.stageId },
      });
      order = count;
    }

    const opportunity = await prisma.crmOpportunity.update({
      where: { id: params.id },
      data: {
        stageId: validatedData.stageId,
        order,
      },
      include: {
        stage: true,
        contact: true,
      },
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error moving opportunity:', error);
    return NextResponse.json(
      { error: 'Error al mover oportunidad' },
      { status: 500 }
    );
  }
}
