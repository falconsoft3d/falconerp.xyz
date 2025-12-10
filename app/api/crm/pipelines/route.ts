import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPipelineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// GET - Listar pipelines
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener empresa activa
    const activeCompany = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
    });

    if (!activeCompany) {
      return NextResponse.json([]);
    }

    const pipelines = await prisma.crmPipeline.findMany({
      where: {
        companyId: activeCompany.id,
      },
      include: {
        stages: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            opportunities: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { order: 'asc' },
      ],
    });

    return NextResponse.json(pipelines);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Error al obtener pipelines' },
      { status: 500 }
    );
  }
}

// POST - Crear pipeline
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
    const validatedData = createPipelineSchema.parse(body);

    // Contar pipelines existentes para el order
    const count = await prisma.crmPipeline.count({
      where: { companyId: activeCompany.id },
    });

    const pipeline = await prisma.crmPipeline.create({
      data: {
        ...validatedData,
        companyId: activeCompany.id,
        order: count,
      },
      include: {
        stages: true,
      },
    });

    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating pipeline:', error);
    return NextResponse.json(
      { error: 'Error al crear pipeline' },
      { status: 500 }
    );
  }
}
