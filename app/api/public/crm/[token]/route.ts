import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const publicOpportunitySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  message: z.string().min(1, 'El mensaje es requerido'),
});

// POST - Crear oportunidad desde formulario público
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await req.json();
    const validated = publicOpportunitySchema.parse(body);

    // Buscar pipeline por token
    const pipeline = await prisma.crmPipeline.findFirst({
      where: {
        publicFormToken: params.token,
        publicFormEnabled: true,
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          take: 1, // Primera etapa
        },
      },
    });

    if (!pipeline || pipeline.stages.length === 0) {
      return NextResponse.json(
        { error: 'Formulario no disponible' },
        { status: 404 }
      );
    }

    const firstStage = pipeline.stages[0];

    // Buscar o crear contacto
    let contact = await prisma.contact.findFirst({
      where: {
        email: validated.email,
        companyId: pipeline.companyId,
      },
    });

    if (!contact) {
      // Obtener el userId de la compañía
      const company = await prisma.company.findUnique({
        where: { id: pipeline.companyId },
        select: { userId: true },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Empresa no encontrada' },
          { status: 404 }
        );
      }

      contact = await prisma.contact.create({
        data: {
          name: validated.name,
          email: validated.email,
          phone: validated.phone || '',
          userId: company.userId,
          companyId: pipeline.companyId,
          isCustomer: true,
          isSupplier: false,
        },
      });
    }

    // Contar oportunidades en la primera etapa para el order
    const count = await prisma.crmOpportunity.count({
      where: { stageId: firstStage.id },
    });

    // Crear oportunidad
    const opportunity = await prisma.crmOpportunity.create({
      data: {
        title: `Consulta de ${validated.name}`,
        description: validated.message,
        value: 0,
        currency: 'EUR',
        probability: 50,
        priority: 'MEDIUM',
        status: 'OPEN',
        companyId: pipeline.companyId,
        pipelineId: pipeline.id,
        stageId: firstStage.id,
        contactId: contact.id,
        order: count,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gracias por tu consulta. Nos pondremos en contacto contigo pronto.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating public opportunity:', error);
    return NextResponse.json(
      { error: 'Error al procesar tu consulta' },
      { status: 500 }
    );
  }
}
