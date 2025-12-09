import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const date = searchParams.get('date');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId es requerido' }, { status: 400 });
    }

    const where: any = {
      companyId,
    };

    // Filtrar por fecha si se proporciona
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    return NextResponse.json(
      { error: 'Error al obtener registros de asistencia' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    console.log('Datos recibidos:', data);
    const { companyId, userId, checkIn, checkOut, notes, date } = data;

    if (!companyId || !userId) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un registro de asistencia para este usuario en esta fecha
    const checkDate = date ? new Date(date) : new Date();
    checkDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(checkDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        companyId,
        date: {
          gte: checkDate,
          lt: nextDay,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Ya existe un registro de asistencia para este usuario en esta fecha' },
        { status: 400 }
      );
    }

    // Crear las fechas correctamente
    const attendanceDate = date ? new Date(date) : new Date();
    const checkInDate = checkIn ? new Date(checkIn) : new Date();
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    console.log('Fechas a guardar:', {
      date: attendanceDate,
      checkIn: checkInDate,
      checkOut: checkOutDate
    });

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        companyId,
        date: attendanceDate,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        notes: notes || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating attendance:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Error al crear registro de asistencia', details: error.message },
      { status: 500 }
    );
  }
}
