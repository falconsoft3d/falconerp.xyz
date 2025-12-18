import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const equipmentSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  ownerId: z.string().optional().nullable(),
  licensePlate: z.string().optional().nullable(),
  kilometers: z.number().min(0).optional().nullable(),
  hours: z.number().min(0).optional().nullable(),
});

// GET - Obtener equipo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    const equipment = await prisma.equipment.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
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

    if (!equipment) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    return NextResponse.json(
      { error: 'Error al obtener equipo' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar equipo
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
    const validatedData = equipmentSchema.parse(body);

    // Verificar que el equipo existe y pertenece al usuario
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no exista otro equipo con el mismo código
    if (validatedData.code !== existingEquipment.code) {
      const duplicateEquipment = await prisma.equipment.findUnique({
        where: {
          companyId_code: {
            companyId: existingEquipment.companyId,
            code: validatedData.code,
          },
        },
      });

      if (duplicateEquipment) {
        return NextResponse.json(
          { error: 'Ya existe un equipo con este código' },
          { status: 400 }
        );
      }
    }

    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        ownerId: validatedData.ownerId || null,
        licensePlate: validatedData.licensePlate || null,
        kilometers: validatedData.kilometers ?? 0,
        hours: validatedData.hours ?? 0,
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

    return NextResponse.json(equipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al actualizar equipo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar equipo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar equipo (soft delete)
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

    // Verificar que el equipo existe y pertenece al usuario
    const existingEquipment = await prisma.equipment.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
    });

    if (!existingEquipment) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.equipment.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Equipo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar equipo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar equipo' },
      { status: 500 }
    );
  }
}
