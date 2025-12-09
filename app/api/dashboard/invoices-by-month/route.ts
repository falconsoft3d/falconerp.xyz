import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[Invoices by Month] Iniciando petición');
    const payload = await verifyAuth(request);
    console.log('[Invoices by Month] Payload:', payload);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = payload.userId;

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    console.log('[Invoices by Month] Año solicitado:', year);

    // Obtener la empresa activa del usuario (o la primera si ninguna está activa)
    let activeCompany = await prisma.company.findFirst({
      where: {
        userId,
        active: true,
      },
    });

    // Si no hay empresa activa, tomar la primera empresa del usuario
    if (!activeCompany) {
      activeCompany = await prisma.company.findFirst({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (!activeCompany) {
      return NextResponse.json([]);
    }

    // Obtener facturas del año especificado
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59`);

    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: activeCompany.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
        total: true,
        currency: true,
      },
    });

    // Agrupar por mes
    const monthlyData: { [key: string]: number } = {};
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Inicializar todos los meses en 0
    months.forEach((month, index) => {
      monthlyData[month] = 0;
    });

    // Sumar totales por mes
    invoices.forEach(invoice => {
      const month = new Date(invoice.date).getMonth();
      const monthName = months[month];
      monthlyData[monthName] += invoice.total;
    });

    // Convertir a array para el gráfico
    const chartData = months.map(month => ({
      month,
      total: monthlyData[month],
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('[Invoices by Month] Error completo:', error);
    console.error('[Invoices by Month] Error mensaje:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Invoices by Month] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Error al obtener facturas por mes', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
