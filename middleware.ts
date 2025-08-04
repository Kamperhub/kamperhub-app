import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/server-session';

// All routes under these paths are considered protected and require authentication.
const protectedPaths = ['/admin', '/dashboard', '/vehicles', '/inventory', '/trip-manager', '/bookings', '/my-account', '/chatbot'];

// These routes are public and accessible to everyone.
const publicOnlyRoutes = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  const session = await getSession();
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedPaths.some(route => pathname.startsWith(route));

  // If the user is trying to access a protected route without a session, redirect them to the login page.
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url);
    // Store the path they were trying to access so we can redirect them back after login.
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is logged in (has a session) and tries to visit the login or signup page,
  // redirect them to their dashboard. This prevents a logged-in user from seeing the login form.
  if (session && publicOnlyRoutes.includes(pathname)) {
     const dashboardUrl = new URL('/dashboard', req.url);
     return NextResponse.redirect(dashboardUrl);
  }

  // If none of the above conditions are met, allow the request to proceed.
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
