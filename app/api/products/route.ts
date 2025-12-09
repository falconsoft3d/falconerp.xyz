import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validación para productos
const productSchema = z.object({
  companyId: z.string(),
  code: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  price: z.number().optional().default(0),
  tax: z.number().min(0).max(100).optional().default(21),
  stock: z.number().int().min(0).optional().default(0),
  minStock: z.number().int().min(0).optional(),
  category: z.string().optional(),
  unit: z.string().optional().default('unidad'),
  active: z.boolean().optional().default(true),
});

// GET - Listar productos
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID es requerido' },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        userId: payload.userId,
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}

// POST - Crear producto
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = productSchema.parse(body);

    // Generar código automáticamente si no se proporciona
    let productCode = validatedData.code || '';
    if (!productCode || productCode.trim() === '') {
      // Obtener el último producto para generar código secuencial
      const lastProduct = await prisma.product.findFirst({
        where: { companyId: validatedData.companyId },
        orderBy: { createdAt: 'desc' },
      });
      const nextNumber = lastProduct ? parseInt(lastProduct.code.replace(/\D/g, '') || '0') + 1 : 1;
      productCode = `PROD${String(nextNumber).padStart(4, '0')}`;
    }

    // Verificar que el código no exista en la misma empresa
    const existingProduct = await prisma.product.findUnique({
      where: {
        companyId_code: {
          companyId: validatedData.companyId,
          code: productCode,
        },
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese código en esta empresa' },
        { status: 400 }
      );
    }

    // Filtrar campos vacíos y convertirlos a null
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const product = await prisma.product.create({
      data: {
        ...cleanData,
        code: productCode,
        userId: payload.userId,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}
