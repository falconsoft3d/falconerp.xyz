import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const updatePropertySchema = z.object({
  code: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  block: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  responsableId: z.string().optional().nullable(),
  constructionDate: z.string().optional().nullable(),
  contractAmount: z.number().optional().nullable(),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  contacts: z.array(z.object({
    contactId: z.string(),
    responsibility: z.string(),
  })).optional(),
});

// GET - Obtener una propiedad
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

    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
        active: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        responsable: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(property);
  } catch (error) {
    console.error('Error al obtener propiedad:', error);
    return NextResponse.json(
      { error: 'Error al obtener propiedad' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar propiedad
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
    
    const validatedData = updatePropertySchema.parse(body);

    // Verificar que la propiedad existe
    const existing = await prisma.property.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
        active: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }

    // Si se actualiza el código, verificar que no exista otro con el mismo
    if (validatedData.code && validatedData.code !== existing.code) {
      const duplicate = await prisma.property.findUnique({
        where: {
          companyId_code: {
            companyId: existing.companyId,
            code: validatedData.code,
          },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe una propiedad con este código' },
          { status: 400 }
        );
      }
    }

    // Actualizar la propiedad
    const updateData: any = {};
    
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.address !== undefined) updateData.address = validatedData.address;
    if (validatedData.block !== undefined) updateData.block = validatedData.block;
    if (validatedData.number !== undefined) updateData.number = validatedData.number;
    if (validatedData.projectId !== undefined) updateData.projectId = validatedData.projectId;
    if (validatedData.responsableId !== undefined) updateData.responsableId = validatedData.responsableId;
    if (validatedData.constructionDate !== undefined) {
      updateData.constructionDate = validatedData.constructionDate ? new Date(validatedData.constructionDate) : null;
    }
    if (validatedData.contractAmount !== undefined) updateData.contractAmount = validatedData.contractAmount;
    if (validatedData.contractStartDate !== undefined) {
      updateData.contractStartDate = validatedData.contractStartDate ? new Date(validatedData.contractStartDate) : null;
    }
    if (validatedData.contractEndDate !== undefined) {
      updateData.contractEndDate = validatedData.contractEndDate ? new Date(validatedData.contractEndDate) : null;
    }
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    // Si se proporcionan contactos, actualizar
    if (validatedData.contacts !== undefined) {
      // Eliminar contactos existentes
      await prisma.propertyContact.deleteMany({
        where: { propertyId: params.id },
      });

      // Crear nuevos contactos
      updateData.contacts = {
        create: validatedData.contacts.map(c => ({
          contactId: c.contactId,
          responsibility: c.responsibility,
        })),
      };
    }

    const property = await prisma.property.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        responsable: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        contacts: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(property);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error al actualizar propiedad:', error);
    return NextResponse.json(
      { error: 'Error al actualizar propiedad' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar propiedad (soft delete)
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

    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
        active: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }

    await prisma.property.update({
      where: { id: params.id },
      data: { active: false },
    });

    return NextResponse.json({ message: 'Propiedad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    return NextResponse.json(
      { error: 'Error al eliminar propiedad' },
      { status: 500 }
    );
  }
}
