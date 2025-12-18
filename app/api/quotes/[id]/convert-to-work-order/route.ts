import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la cotización con sus items y productos
    const quote = await prisma.quote.findFirst({
      where: {
        id: params.id,
        userId: payload.userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        company: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si ya tiene una orden de trabajo
    if (quote.workOrderId) {
      return NextResponse.json(
        { error: 'Esta cotización ya tiene una orden de trabajo' },
        { status: 400 }
      );
    }

    // Filtrar solo productos de tipo servicio
    const serviceItems = quote.items.filter(
      item => item.product.type === 'service'
    );

    if (serviceItems.length === 0) {
      return NextResponse.json(
        { error: 'No hay productos de tipo servicio en esta cotización' },
        { status: 400 }
      );
    }

    // Obtener el número siguiente para la orden de trabajo
    const currentYear = new Date().getFullYear();
    const prefix = `OT-${currentYear}`;
    
    // Buscar la última orden del año actual
    const lastWorkOrder = await prisma.workOrder.findFirst({
      where: {
        companyId: quote.companyId,
        number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastWorkOrder) {
      const lastNumberPart = lastWorkOrder.number.split('-')[2];
      nextNumber = parseInt(lastNumberPart) + 1;
    }

    const workOrderNumber = `${prefix}-${String(nextNumber).padStart(3, '0')}`;

    // Crear la orden de trabajo
    const workOrder = await prisma.workOrder.create({
      data: {
        userId: payload.userId,
        companyId: quote.companyId,
        number: workOrderNumber,
        date: new Date(),
        scheduledDate: new Date(), // Por defecto la fecha actual, puede ser modificada
        responsibleId: payload.userId,
        notes: `Orden de trabajo generada desde cotización ${quote.number}`,
        items: {
          create: serviceItems.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            durationHours: 1, // Duración por defecto de 1 hora
            status: 'PENDING',
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Actualizar la cotización con el ID de la orden de trabajo
    await prisma.quote.update({
      where: { id: quote.id },
      data: { workOrderId: workOrder.id },
    });

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { error: 'Error al crear orden de trabajo' },
      { status: 500 }
    );
  }
}
