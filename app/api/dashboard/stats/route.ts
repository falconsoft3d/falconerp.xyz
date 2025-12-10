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

    // Contar facturas de venta
    const salesInvoicesCount = await prisma.invoice.count({
      where: {
        companyId: activeCompany.id,
        type: 'SALE',
      },
    });

    // Contar facturas de compra
    const purchaseInvoicesCount = await prisma.invoice.count({
      where: {
        companyId: activeCompany.id,
        type: 'PURCHASE',
      },
    });

    // Contar proyectos
    const projectsCount = await prisma.project.count({
      where: {
        companyId: activeCompany.id,
      },
    });

    // Contar contactos web
    const webContactsCount = await prisma.webContact.count({
      where: {
        status: {
          in: ['PENDING', 'CONTACTED'],
        },
      },
    });

    // Calcular facturación de ventas
    const salesInvoices = await prisma.invoice.findMany({
      where: {
        companyId: activeCompany.id,
        type: 'SALE',
      },
      select: {
        total: true,
        currency: true,
      },
    });

    // Calcular facturación de compras
    const purchaseInvoices = await prisma.invoice.findMany({
      where: {
        companyId: activeCompany.id,
        type: 'PURCHASE',
      },
      select: {
        total: true,
        currency: true,
      },
    });

    // Agrupar ventas por moneda y sumar
    const salesRevenueByCurrency: { [key: string]: number } = {};
    salesInvoices.forEach(invoice => {
      const currency = invoice.currency || 'EUR';
      if (!salesRevenueByCurrency[currency]) {
        salesRevenueByCurrency[currency] = 0;
      }
      salesRevenueByCurrency[currency] += invoice.total;
    });

    // Agrupar compras por moneda y sumar
    const purchaseRevenueByCurrency: { [key: string]: number } = {};
    purchaseInvoices.forEach(invoice => {
      const currency = invoice.currency || 'EUR';
      if (!purchaseRevenueByCurrency[currency]) {
        purchaseRevenueByCurrency[currency] = 0;
      }
      purchaseRevenueByCurrency[currency] += invoice.total;
    });

    // Usar la moneda principal (la que tiene más ingresos en ventas o EUR por defecto)
    const primaryCurrency = Object.keys(salesRevenueByCurrency).sort(
      (a, b) => salesRevenueByCurrency[b] - salesRevenueByCurrency[a]
    )[0] || 'EUR';

    const totalSalesRevenue = salesRevenueByCurrency[primaryCurrency] || 0;
    const totalPurchaseRevenue = purchaseRevenueByCurrency[primaryCurrency] || 0;

    return NextResponse.json({
      productsCount,
      contactsCount,
      salesInvoicesCount,
      purchaseInvoicesCount,
      projectsCount,
      webContactsCount,
      totalSalesRevenue,
      totalPurchaseRevenue,
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
