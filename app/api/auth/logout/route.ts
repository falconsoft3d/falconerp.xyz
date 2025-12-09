import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Sesión cerrada correctamente' },
    { status: 200 }
  );

  // Eliminar cookie del token
  response.cookies.delete('token');

  return response;
}
