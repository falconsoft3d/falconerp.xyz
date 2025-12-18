import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Aprobar o rechazar presupuesto (sin autenticación)
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const body = await request.json();
    const { action, rejectionReason } = body; // action: 'approve' o 'reject'

    // Verificar que el presupuesto existe y está activo
    const quote = await prisma.quote.findUnique({
      where: { 
        publicToken: params.token,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Presupuesto no encontrado o enlace inválido' },
        { status: 404 }
      );
    }

    // Verificar que no haya sido aprobado/rechazado previamente
    if (quote.clientApprovalStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Este presupuesto ya ha sido procesado' },
        { status: 400 }
      );
    }

    // Actualizar según la acción
    let updateData: any = {
      clientApprovedAt: new Date(),
    };
    
    if (action === 'approve') {
      updateData.clientApprovalStatus = 'APPROVED';
      updateData.status = 'ORDER'; // Convertir a pedido cuando se aprueba
    } else if (action === 'reject') {
      updateData.clientApprovalStatus = 'REJECTED';
      updateData.clientRejectionReason = rejectionReason || null;
    } else {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      );
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: updateData,
    });

    return NextResponse.json({
      message: action === 'approve' ? 'Presupuesto aprobado exitosamente' : 'Presupuesto rechazado',
      status: updatedQuote.clientApprovalStatus,
    });
  } catch (error) {
    console.error('Error al procesar aprobación:', error);
    return NextResponse.json(
      { error: 'Error al procesar aprobación' },
      { status: 500 }
    );
  }
}
