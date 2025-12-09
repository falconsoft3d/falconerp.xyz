import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('[Dashboard Stats] Iniciando petición');
    const payload = await verifyAuth(request);
    console.log('[Dashboard Stats] Payload:', payload);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const userId = payload.userId;

    // Obtener la empresa activa del usuario (o la primera si ninguna está activa)
    console.log('[Dashboard Stats] Buscando empresa activa para userId:', userId);
    let activeCompany = await prisma.company.findFirst({
      where: {
        userId,
        active: true,
      },
    });
    console.log('[Dashboard Stats] Empresa activa encontrada:', activeCompany?.id);

    // Si no hay empresa activa, tomar la primera empresa del usuario
    if (!activeCompany) {
      console.log('[Dashboard Stats] No hay empresa activa, buscando primera empresa');
      activeCompany = await prisma.company.findFirst({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      console.log('[Dashboard Stats] Primera empresa encontrada:', activeCompany?.id);
    }

    if (!activeCompany) {
      return NextResponse.json({
        productsCount: 0,
        contactsCount: 0,
        invoicesCount: 0,
        totalRevenue: 0,
        currency: 'EUR',
      });
    }

    // Contar productos
    const productsCount = await prisma.product.count({
      where: {
        companyId: activeCompany.id,
      },
    });

    // Contar contactos
    const contactsCount = await prisma.contact.count({
      where: {
        companyId: activeCompany.id,
      },
    });

    // Contar facturas
    const invoicesCount = await prisma.invoice.count({
      where: {
        companyId: activeCompany.id,
      },
    });

    // Calcular facturación total (todas las facturas, no solo validadas)
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId: activeCompany.id,
        // Removido el filtro de status: 'VALIDATED' para mostrar todas las facturas
      },
      select: {
        total: true,
        currency: true,
      },
    });

    // Agrupar por moneda y sumar
    const revenueByurrency: { [key: string]: number } = {};
    invoices.forEach(invoice => {
      const currency = invoice.currency || 'EUR';
      if (!revenueByurrency[currency]) {
        revenueByurrency[currency] = 0;
      }
      revenueByurrency[currency] += invoice.total;
    });

    // Usar la moneda principal (la que tiene más ingresos o EUR por defecto)
    const primaryCurrency = Object.keys(revenueByurrency).sort(
      (a, b) => revenueByurrency[b] - revenueByurrency[a]
    )[0] || 'EUR';

    const totalRevenue = revenueByurrency[primaryCurrency] || 0;

    return NextResponse.json({
      productsCount,
      contactsCount,
      invoicesCount,
      totalRevenue,
      currency: primaryCurrency,
    });
  } catch (error) {
    console.error('[Dashboard Stats] Error completo:', error);
    console.error('[Dashboard Stats] Error mensaje:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Dashboard Stats] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Error al obtener estadísticas', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
