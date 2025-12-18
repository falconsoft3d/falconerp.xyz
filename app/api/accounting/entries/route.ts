import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { getEffectiveUserId } from '@/lib/user-helpers';

// Schema de validación para líneas del asiento
const entryLineSchema = z.object({
  accountId: z.string().min(1, 'La cuenta es requerida'),
  description: z.string().nullable().optional(),
  debit: z.number().min(0, 'El debe debe ser mayor o igual a 0'),
  credit: z.number().min(0, 'El haber debe ser mayor o igual a 0'),
});

// Schema de validación para el asiento contable
const entrySchema = z.object({
  companyId: z.string().min(1, 'La compañía es requerida'),
  date: z.string().min(1, 'La fecha es requerida'),
  reference: z.string().nullable().optional(),
  description: z.string().min(1, 'La descripción es requerida'),
  lines: z.array(entryLineSchema).min(2, 'Se requieren al menos 2 líneas'),
});

// GET - Listar asientos contables
export async function GET(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'El ID de compañía es requerido' },
        { status: 400 }
      );
    }

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: effectiveUserId,
        companyId,
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Error al obtener los asientos contables' },
      { status: 500 }
    );
  }
}

// POST - Crear asiento contable
export async function POST(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await req.json();

    console.log('Body recibido:', JSON.stringify(body, null, 2));

    // Convertir strings a números para debit y credit
    const processedBody = {
      ...body,
      lines: body.lines?.map((line: any) => ({
        ...line,
        debit: typeof line.debit === 'string' ? parseFloat(line.debit) : line.debit,
        credit: typeof line.credit === 'string' ? parseFloat(line.credit) : line.credit,
      }))
    };

    const validatedData = entrySchema.parse(processedBody);

    // Validar que el asiento esté balanceado
    const totalDebit = validatedData.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = validatedData.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { error: 'El asiento no está balanceado. El total del Debe debe ser igual al total del Haber.' },
        { status: 400 }
      );
    }

    // Generar número de asiento
    const lastEntry = await prisma.journalEntry.findFirst({
      where: {
        companyId: validatedData.companyId,
      },
      orderBy: {
        number: 'desc',
      },
    });

    const nextNumber = lastEntry ? String(parseInt(lastEntry.number) + 1).padStart(6, '0') : '000001';

    // Crear asiento con líneas en una transacción
    const entry = await prisma.journalEntry.create({
      data: {
        userId: effectiveUserId,
        companyId: validatedData.companyId,
        number: nextNumber,
        date: new Date(validatedData.date),
        reference: validatedData.reference,
        description: validatedData.description,
        lines: {
          create: validatedData.lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Error al crear el asiento contable' },
      { status: 500 }
    );
  }
}
