import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCompanySchema = z.object({
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
  salesInvoiceNextNumber: z.number().int().min(1).optional().default(1),
  purchaseInvoicePrefix: z.string().optional().default('INVO'),
  purchaseInvoiceNextNumber: z.number().int().min(1).optional().default(1),
});

// GET /api/companies - Listar empresas del usuario
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companies = await prisma.company.findMany({
      where: { userId: payload.userId },
      orderBy: [
        { active: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Error al obtener empresas' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Crear nueva empresa
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('User payload:', payload);

    // Verificar que el usuario existe en la base de datos
    const userExists = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!userExists) {
      console.error('Usuario no encontrado en la base de datos:', payload.userId);
      return NextResponse.json(
        { error: 'Usuario no válido. Por favor, inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received body:', body);
    
    const validatedData = createCompanySchema.parse(body);
    console.log('Validated data:', validatedData);

    // Filtrar campos vacíos y convertirlos a null
    const cleanData: any = {};
    for (const [key, value] of Object.entries(validatedData)) {
      cleanData[key] = (typeof value === 'string' && value.trim() === '') ? null : value;
    }
    console.log('Clean data:', cleanData);

    // Si es la primera empresa, marcarla como activa
    const companiesCount = await prisma.company.count({
      where: { userId: payload.userId }
    });

    const company = await prisma.company.create({
      data: {
        name: cleanData.name,
        nif: cleanData.nif,
        address: cleanData.address,
        city: cleanData.city,
        postalCode: cleanData.postalCode,
        country: cleanData.country,
        phone: cleanData.phone,
        email: cleanData.email,
        primaryColor: cleanData.primaryColor || '#10b981',
        secondaryColor: cleanData.secondaryColor || '#059669',
        userId: payload.userId,
        active: companiesCount === 0,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.issues);
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating company:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Error al crear empresa', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
