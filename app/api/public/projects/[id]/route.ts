import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: [
            { completed: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' }
          ]
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching public project:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyecto' },
      { status: 500 }
    );
  }
}
