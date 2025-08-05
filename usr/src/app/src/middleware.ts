
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from './src/lib/server/server-session';

const protectedRoutes = [
  '/admin',
  '/bookings',
  '/chatbot',
  '/checklists',
  '/dashboard',
  '/dashboard-details',
  '/documents',
  '/inventory',
  '/journeys',
  '/my-account',
  '/rewards',
  '/service-log',
  '/stats',
  '/trip-expense-planner',
  '/trip-manager',
  '/trip-packing',
  '/triplog',
  '/vehicles',
  '/world-map',
];

const publicRoutes = ['/', '/login', '/signup', '/learn', '/contact'];

export async function middleware(req: NextRequest) {
  const session = await getSession();
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If trying to access a protected route without a session, redirect to login
  if (!session && isProtectedRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // If logged in (has session) and trying to access a public-only page (login/signup), redirect to dashboard
  if (session && (pathname === '/login' || pathname === '/signup')) {
     const url = req.nextUrl.clone();
     url.pathname = '/dashboard';
     return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any files with an extension (e.g., .jpg, .svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
