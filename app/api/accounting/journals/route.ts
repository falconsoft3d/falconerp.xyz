import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const journalSchema = z.object({
  companyId: z.string(),
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['sale', 'purchase', 'bank', 'cash', 'general', 'opening', 'closing']),
  description: z.string().optional().nullable(),
});

// GET - Listar diarios contables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID es requerido' },
        { status: 400 }
      );
    }

    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const journals = await prisma.journal.findMany({
      where: {
        userId: effectiveUserId,
        companyId,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(journals);
  } catch (error) {
    console.error('Error al obtener diarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener diarios' },
      { status: 500 }
    );
  }
}

// POST - Crear diario contable
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    
    const validatedData = journalSchema.parse(body);

    // Verificar que el código no exista
    const existing = await prisma.journal.findUnique({
      where: {
        companyId_code: {
          companyId: validatedData.companyId,
          code: validatedData.code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un diario con este código' },
        { status: 400 }
      );
    }

    const journal = await prisma.journal.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        code: validatedData.code,
        name: validatedData.name,
        type: validatedData.type,
        description: validatedData.description || null,
      },
    });

    return NextResponse.json(journal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error al crear diario:', error);
    return NextResponse.json(
      { error: 'Error al crear diario' },
      { status: 500 }
    );
  }
}
