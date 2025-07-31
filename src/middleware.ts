import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from './lib/server-session';

const protectedRoutes = [
  '/dashboard',
  '/vehicles',
  '/inventory',
  '/trip-manager',
  '/bookings',
  '/my-account',
  '/admin',
  '/checklists',
  '/chatbot',
  '/journeys',
  '/rewards',
  '/service-log',
  '/stats',
  '/trip-expense-planner',
  '/trip-packing',
  '/triplog',
  '/world-map',
  '/dashboard-details',
  '/documents'
];

const publicRoutes = ['/login', '/signup', '/'];

export async function middleware(req: NextRequest) {
  const session = await getSession();
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If the user is not logged in and is trying to access a protected route,
  // redirect them to the login page.
  if (!session && isProtectedRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // If the user is logged in and tries to access a public-only page like login,
  // redirect them to the dashboard.
  if (session && publicRoutes.includes(pathname)) {
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
     * - learn (public learn/support page)
     * - contact (public contact page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|learn|contact).*)',
  ],
};
