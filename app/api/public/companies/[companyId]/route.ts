import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.companyId },
      select: {
        id: true,
        name: true,
        logo: true,
        currency: true,
      },
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
      { error: 'Error al obtener información de la empresa' },
      { status: 500 }
    );
  }
}
