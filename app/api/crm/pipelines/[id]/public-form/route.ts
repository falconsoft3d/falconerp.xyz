import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { randomBytes } from 'crypto';

// POST - Generar o regenerar token para formulario público
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const pipeline = await prisma.crmPipeline.findFirst({
      where: {
        id: params.id,
        company: {
          userId: payload.userId,
        },
      },
    });

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline no encontrado' }, { status: 404 });
    }

    // Generar token único
    const publicFormToken = randomBytes(32).toString('hex');

    // Actualizar pipeline con el token
    await prisma.crmPipeline.update({
      where: { id: params.id },
      data: {
        publicFormToken,
        publicFormEnabled: true,
      },
    });

    return NextResponse.json({
      token: publicFormToken,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/public/crm/${publicFormToken}`,
    });
  } catch (error) {
    console.error('Error generating public form token:', error);
    return NextResponse.json(
      { error: 'Error al generar el enlace público' },
      { status: 500 }
    );
  }
}

// PATCH - Habilitar/deshabilitar formulario público
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { enabled } = await req.json();

    const pipeline = await prisma.crmPipeline.findFirst({
      where: {
        id: params.id,
        company: {
          userId: payload.userId,
        },
      },
    });

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline no encontrado' }, { status: 404 });
    }

    const updated = await prisma.crmPipeline.update({
      where: { id: params.id },
      data: {
        publicFormEnabled: enabled,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating public form status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar estado del formulario' },
      { status: 500 }
    );
  }
}
