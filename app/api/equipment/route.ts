import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const equipmentSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  companyId: z.string(),
  ownerId: z.string().optional().nullable(),
  licensePlate: z.string().optional().nullable(),
  kilometers: z.number().min(0).optional().nullable(),
  hours: z.number().min(0).optional().nullable(),
});

// GET - Listar equipos
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

    const equipment = await prisma.equipment.findMany({
      where: {
        userId: effectiveUserId,
        companyId,
        active: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Error al obtener equipos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST - Crear equipo
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    
    console.log('Datos recibidos en POST:', body);
    
    const validatedData = equipmentSchema.parse(body);

    // Verificar que no exista un equipo con el mismo código en esta empresa
    const existingEquipment = await prisma.equipment.findUnique({
      where: {
        companyId_code: {
          companyId: validatedData.companyId,
          code: validatedData.code,
        },
      },
    });

    if (existingEquipment) {
      return NextResponse.json(
        { error: 'Ya existe un equipo con este código' },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        code: validatedData.code,
        name: validatedData.name,
        ownerId: validatedData.ownerId || null,
        licensePlate: validatedData.licensePlate || null,
        kilometers: validatedData.kilometers || 0,
        hours: validatedData.hours || 0,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al crear equipo:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Error al crear equipo',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
