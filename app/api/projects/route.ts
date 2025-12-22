import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  companyId: z.string(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  productId: z.string().optional(),
  salePrice: z.number().positive().optional(),
  color: z.string().optional().default('#10b981'),
});

// GET - Listar proyectos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const publicAccess = searchParams.get('public') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID es requerido' },
        { status: 400 }
      );
    }

    // Si es acceso público, solo devolver nombre e ID
    if (publicAccess) {
      const projects = await prisma.project.findMany({
        where: {
          companyId,
          active: true,
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(projects);
    }

    // Para acceso autenticado, devolver información completa
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const projects = await prisma.project.findMany({
      where: {
        userId: effectiveUserId,
        companyId,
        active: true,
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { 
            tasks: true,
            properties: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

// POST - Crear proyecto
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status || 'ACTIVE',
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        productId: validatedData.productId,
        salePrice: validatedData.salePrice,
        color: validatedData.color,
      },
      include: {
        tasks: true,
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al crear proyecto:', error);
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}
