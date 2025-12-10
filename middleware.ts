import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/blog',
    '/upload',
    '/',
  ];

  // Rutas API públicas (auth endpoints)
  const publicApiPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/auth/resend-verification',
    '/api/public/',
  ];

  const isPublicApiPath = publicApiPaths.some(path => pathname.startsWith(path));
  
  // Si es una API pública, permitir acceso sin verificación
  if (isPublicApiPath) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some(path => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  });

  // Rutas del dashboard que SIEMPRE requieren autenticación
  const isDashboardPath = pathname.startsWith('/dashboard');

  // Si es ruta del dashboard sin token, redirigir al login
  if (isDashboardPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si es ruta del dashboard con token, verificar el token
  if (isDashboardPath && token) {
    const payload = await verifyToken(token);
    
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }
  }

  // Si es ruta pública, permitir acceso
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Para cualquier otra ruta, verificar token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);
  
  if (!payload) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // Token válido, permitir acceso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     * 
     * CRITICAL: We DO NOT exclude 'api' here because API routes need protection too
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$).*)',
  ],
};
