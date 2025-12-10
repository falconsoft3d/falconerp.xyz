import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getEffectiveUserId } from '@/lib/user-helpers';

// Schema de validación para productos
const productSchema = z.object({
  companyId: z.string(),
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

    // Obtener el ID efectivo (si fue creado por otro usuario, usar el del padre)
    const effectiveUserId = await getEffectiveUserId(payload.userId);
    
    console.log('🔍 Consultando productos con filtros:');
    console.log('  - userId:', payload.userId);
    console.log('  - effectiveUserId:', effectiveUserId);
    console.log('  - companyId:', companyId);

    const products = await prisma.product.findMany({
      where: {
        userId: effectiveUserId,
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Productos encontrados: ${products.length}`);
    if (products.length > 0) {
      console.log('Primeros 3 productos:', products.slice(0, 3).map(p => ({ id: p.id, name: p.name, companyId: p.companyId })));
    }

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

    const effectiveUserId = await getEffectiveUserId(payload.userId);

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

    const product = await prisma.product.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        code: productCode,
        name: validatedData.name,
        description: validatedData.description || null,
        image: validatedData.image || null,
        type: validatedData.type || 'storable',
        price: validatedData.price || 0,
        tax: validatedData.tax || 21,
        stock: validatedData.type === 'service' ? 0 : (validatedData.stock || 0),
        minStock: validatedData.type === 'service' ? null : (validatedData.minStock || null),
        category: validatedData.category || null,
        unit: validatedData.unit || 'unidad',
        active: validatedData.active !== undefined ? validatedData.active : true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Error de validación Zod:', error.issues);
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
