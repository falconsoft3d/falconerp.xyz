import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCompanySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  nif: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  country: z.string().optional().default(''),
  currency: z.string().optional().default('EUR'),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  logo: z.string().optional().default('').or(z.literal('')),
  primaryColor: z.string().optional().default('#10b981'),
  secondaryColor: z.string().optional().default('#059669'),
  salesInvoicePrefix: z.string().optional().default('INV'),
  salesInvoiceNextNumber: z.number().int().min(1).optional(),
  purchaseInvoicePrefix: z.string().optional().default('INVO'),
  purchaseInvoiceNextNumber: z.number().int().min(1).optional(),
});

// GET /api/companies/[id] - Obtener empresa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        _count: {
          select: {
            contacts: true,
            products: true,
            invoices: true,
          }
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Error al obtener empresa' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Actualizar empresa
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
    const validatedData = updateCompanySchema.parse(body);

    // Filtrar campos vacíos y convertirlos a null
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const company = await prisma.company.updateMany({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      data: cleanData,
    });

    if (company.count === 0) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    const updatedCompany = await prisma.company.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Error al actualizar empresa' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Eliminar empresa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que no sea la única empresa
    const companiesCount = await prisma.company.count({
      where: { userId: payload.userId }
    });

    if (companiesCount <= 1) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu única empresa' },
        { status: 400 }
      );
    }

    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Si la empresa estaba activa, activar otra
    if (company.active) {
      const otherCompany = await prisma.company.findFirst({
        where: {
          userId: payload.userId,
          id: { not: params.id }
        }
      });

      if (otherCompany) {
        await prisma.company.update({
          where: { id: otherCompany.id },
          data: { active: true }
        });
      }
    }

    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Empresa eliminada' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Error al eliminar empresa' },
      { status: 500 }
    );
  }
}
