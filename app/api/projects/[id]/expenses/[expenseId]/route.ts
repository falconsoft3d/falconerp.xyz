import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// PUT - Actualizar gasto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
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

    const { expenseId } = await params;
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

    const expense = await prisma.projectExpense.update({
      where: { id: expenseId },
      data: {
        type,
        description,
        quantity: quantityNum,
        unitPrice: unitPriceNum,
        totalPrice: totalPrice,
        date: date ? new Date(date) : undefined,
        notes: notes || null,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Error al actualizar gasto', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar gasto
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
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

    const { expenseId } = await params;

    await prisma.projectExpense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ message: 'Gasto eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    );
  }
}
