import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// GET - Listar gastos del proyecto
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id: projectId } = await params;

    const expenses = await prisma.projectExpense.findMany({
      where: { projectId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Error al obtener gastos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo gasto
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { type, description, quantity, unitPrice, date, notes } = body;

    if (!type || !description || !quantity || !unitPrice) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que el tipo sea válido
    if (!['MATERIAL', 'EQUIPMENT', 'LABOR'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de gasto inválido' },
        { status: 400 }
      );
    }

    const quantityNum = parseFloat(quantity);
    const unitPriceNum = parseFloat(unitPrice);
    const totalPrice = quantityNum * unitPriceNum;

    const expense = await prisma.projectExpense.create({
      data: {
        projectId,
        type,
        description,
        quantity: quantityNum,
        unitPrice: unitPriceNum,
        totalPrice: totalPrice,
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Error al crear gasto', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
