import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  role: z.enum(['admin', 'user']).optional(),
  defaultCompanyId: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

// GET /api/users/[id] - Obtener usuario por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: params.id,
        OR: [
          { id: payload.userId },
          { createdById: payload.userId },
        ],
      },
      include: {
        defaultCompany: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            createdUsers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Actualizar usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // No permitir editar el usuario principal (el que se registró)
    const userToUpdate = await prisma.user.findFirst({
      where: {
        id: params.id,
        createdById: payload.userId, // Solo usuarios creados por el usuario autenticado
      },
    });

    if (!userToUpdate) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o no tiene permisos para editarlo' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Si se actualiza el email, verificar que no esté en uso
    if (validatedData.email && validatedData.email !== userToUpdate.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    // Si se especificó una empresa, verificar que pertenezca al usuario
    if (validatedData.defaultCompanyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: validatedData.defaultCompanyId,
          userId: payload.userId,
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Empresa no válida' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      ...validatedData,
    };

    // Si se actualiza la contraseña, encriptarla
    if (validatedData.password) {
      updateData.password = await hashPassword(validatedData.password);
    } else {
      delete updateData.password;
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        defaultCompany: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // No permitir eliminar el usuario principal
    const userToDelete = await prisma.user.findFirst({
      where: {
        id: params.id,
        createdById: payload.userId,
      },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o no tiene permisos para eliminarlo' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
