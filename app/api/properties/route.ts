import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';
import { z } from 'zod';

const propertySchema = z.object({
  companyId: z.string(),
  code: z.string().min(1),
  address: z.string().min(1),
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
  })).optional().default([]),
});

// GET - Listar propiedades
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

    const properties = await prisma.property.findMany({
      where: {
        userId: effectiveUserId,
        companyId,
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    return NextResponse.json(
      { error: 'Error al obtener propiedades' },
      { status: 500 }
    );
  }
}

// POST - Crear propiedad
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    
    const validatedData = propertySchema.parse(body);

    // Verificar que el código no exista
    const existing = await prisma.property.findUnique({
      where: {
        companyId_code: {
          companyId: validatedData.companyId,
          code: validatedData.code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una propiedad con este código' },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        code: validatedData.code,
        address: validatedData.address,
        block: validatedData.block || null,
        number: validatedData.number || null,
        projectId: validatedData.projectId || null,
        responsableId: validatedData.responsableId || null,
        constructionDate: validatedData.constructionDate ? new Date(validatedData.constructionDate) : null,
        contractAmount: validatedData.contractAmount || null,
        contractStartDate: validatedData.contractStartDate ? new Date(validatedData.contractStartDate) : null,
        contractEndDate: validatedData.contractEndDate ? new Date(validatedData.contractEndDate) : null,
        notes: validatedData.notes || null,
        contacts: {
          create: validatedData.contacts.map(c => ({
            contactId: c.contactId,
            responsibility: c.responsibility,
          })),
        },
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

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error al crear propiedad:', error);
    return NextResponse.json(
      { error: 'Error al crear propiedad' },
      { status: 500 }
    );
  }
}
