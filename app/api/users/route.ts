import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'user']).default('user'),
  defaultCompanyId: z.string().optional(),
});

// GET /api/users - Listar usuarios creados por el usuario autenticado
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener usuarios creados por este usuario (incluyéndose a sí mismo)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: payload.userId }, // El usuario mismo
          { createdById: payload.userId }, // Usuarios que este usuario creó
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
      orderBy: { createdAt: 'desc' },
    });

    // No devolver las contraseñas
    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST /api/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Verificar que el email no esté en uso
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está en uso' },
        { status: 400 }
      );
    }

    // Si se especificó una empresa, verificar que pertenezca al usuario
    if (validatedData.defaultCompanyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: validatedData.defaultCompanyId,
          userId: payload.userId, // Solo empresas del usuario autenticado
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Empresa no válida' },
          { status: 400 }
        );
      }
    }

    // Encriptar contraseña
    const hashedPassword = await hashPassword(validatedData.password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        createdById: payload.userId,
        defaultCompanyId: validatedData.defaultCompanyId,
        active: true,
      },
      include: {
        defaultCompany: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // No devolver la contraseña
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
