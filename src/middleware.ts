import { NextResponse, type NextRequest } from 'next/server';

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

export function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get('__session');
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If trying to access a protected route without a session, redirect to login
  if (!sessionCookie && isProtectedRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // If logged in (has session) and trying to access a public-only page, redirect to dashboard
  if (sessionCookie && publicRoutes.includes(pathname)) {
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
     * - any files with an extension (e.g., .jpg, .svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|learn|contact|.*\\..*).*)',
  ],
};
