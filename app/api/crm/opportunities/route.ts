import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOpportunitySchema = z.object({
  pipelineId: z.string(),
  stageId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  value: z.number().default(0),
  currency: z.string().default('EUR'),
  probability: z.number().min(0).max(100).default(50),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  contactId: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  scheduledDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// GET - Listar oportunidades
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    const status = searchParams.get('status'); // OPEN, WON, LOST

    const activeCompany = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
    });

    if (!activeCompany) {
      return NextResponse.json([]);
    }

    const where: any = {
      companyId: activeCompany.id,
    };

    if (pipelineId) {
      where.pipelineId = pipelineId;
    }

    if (status) {
      where.status = status;
    }

    const opportunities = await prisma.crmOpportunity.findMany({
      where,
      include: {
        stage: true,
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            activities: true,
          },
        },
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Error al obtener oportunidades' },
      { status: 500 }
    );
  }
}

// POST - Crear oportunidad
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const activeCompany = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
    });

    if (!activeCompany) {
      return NextResponse.json(
        { error: 'No hay empresa activa' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createOpportunitySchema.parse(body);

    // Convertir fechas si existen
    const expectedCloseDate = validatedData.expectedCloseDate
      ? new Date(validatedData.expectedCloseDate)
      : undefined;

    const scheduledDate = validatedData.scheduledDate
      ? new Date(validatedData.scheduledDate)
      : undefined;

    // Contar oportunidades en la etapa para el order
    const count = await prisma.crmOpportunity.count({
      where: { stageId: validatedData.stageId },
    });

    const opportunity = await prisma.crmOpportunity.create({
      data: {
        ...validatedData,
        expectedCloseDate,
        scheduledDate,
        companyId: activeCompany.id,
        order: count,
      },
      include: {
        stage: true,
        contact: true,
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Error al crear oportunidad' },
      { status: 500 }
    );
  }
}
