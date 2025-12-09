import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET: Obtener comentarios de una factura
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Verificar que la factura pertenece al usuario
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: user.userId,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const comments = await prisma.invoiceComment.findMany({
      where: {
        invoiceId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Error al obtener comentarios' },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo comentario
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const invoiceId = params.id;
    const { comment } = await req.json();

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: 'El comentario es requerido' }, { status: 400 });
    }

    // Verificar que la factura pertenece al usuario
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: user.userId,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const newComment = await prisma.invoiceComment.create({
      data: {
        invoiceId,
        userId: user.userId,
        userName: user.name,
        comment: comment.trim(),
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Error al crear comentario' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un comentario
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'ID del comentario requerido' }, { status: 400 });
    }

    const comment = await prisma.invoiceComment.findFirst({
      where: {
        id: commentId,
        userId: user.userId,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    await prisma.invoiceComment.delete({
      where: {
        id: commentId,
      },
    });

    return NextResponse.json({ message: 'Comentario eliminado' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Error al eliminar comentario' },
      { status: 500 }
    );
  }
}
