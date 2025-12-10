import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { verifyToken } from '@/lib/jwt';
import { sendContactEmail } from '@/lib/email';

// Schema de validación para crear contacto
const createContactSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
});

// POST - Crear contacto web (público)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));
    const validatedData = createContactSchema.parse(body);
    console.log('Validated data:', JSON.stringify(validatedData, null, 2));

    // Crear contacto en la base de datos
    const contact = await prisma.webContact.create({
      data: validatedData,
    });

    // Enviar email de confirmación al contacto
    try {
      await sendContactEmail({
        to: validatedData.email,
        subject: 'Hemos recibido tu contacto - FalconERP',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
              .message-box { background: white; border-left: 4px solid #0d9488; padding: 20px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ ¡Gracias por contactarnos!</h1>
              </div>
              <div class="content">
                <p>Hola <strong>${validatedData.name}</strong>,</p>
                <p>Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
                <div class="message-box">
                  <p><strong>Tu mensaje:</strong></p>
                  <p>${validatedData.message}</p>
                </div>
                <p>Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo pronto.</p>
                <br>
                <p>Saludos cordiales,</p>
                <p><strong>Equipo FalconERP</strong></p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} FalconERP. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
      // No fallar si el email no se envía
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Full error object:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation issues:', JSON.stringify(error.issues, null, 2));
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error al crear contacto:', error);
    return NextResponse.json(
      { error: 'Error al crear contacto', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET - Listar contactos (requiere autenticación)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
      await verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '40');
    const skip = (page - 1) * limit;

    const where = status ? { status: status as any } : {};

    const [contacts, total] = await Promise.all([
      prisma.webContact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.webContact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al listar contactos:', error);
    return NextResponse.json(
      { error: 'Error al listar contactos' },
      { status: 500 }
    );
  }
}
