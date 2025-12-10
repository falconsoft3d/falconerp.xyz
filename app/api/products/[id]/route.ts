import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getEffectiveUserId } from '@/lib/user-helpers';

// Schema de validación para actualizar producto
const updateProductSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  image: z.string().optional().nullable(),
  type: z.enum(['storable', 'service']).optional().default('storable'),
  price: z.number().optional().default(0),
  tax: z.number().min(0).max(100).optional().default(21),
  stock: z.number().int().optional().default(0),
  minStock: z.number().int().optional(),
  category: z.string().optional(),
  unit: z.string().optional().default('unidad'),
});

// GET - Obtener un producto
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

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID es requerido' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
        companyId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar producto
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
    console.log('🔍 Body recibido para actualizar:', body);
    const validatedData = updateProductSchema.parse(body);

    // Filtrar campos vacíos y convertirlos a null
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    // Si el tipo es 'service', establecer stock en 0 y minStock en null
    if (cleanData.type === 'service') {
      cleanData.stock = 0;
      cleanData.minStock = null;
    }

    const product = await prisma.product.updateMany({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
      data: cleanData,
    });

    if (product.count === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Producto actualizado' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Error de validación Zod al actualizar:', error.issues);
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar producto
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

    const product = await prisma.product.deleteMany({
      where: {
        id: params.id,
        userId: effectiveUserId,
      },
    });

    if (product.count === 0) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
