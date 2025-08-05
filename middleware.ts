// middleware.ts
// This middleware runs in the Edge Runtime.
// It now gets session data by making an internal fetch to a Node.js API route.

import { NextResponse, type NextRequest } from 'next/server';

// All routes under these paths are considered protected and require authentication.
const protectedPaths = ['/admin', '/dashboard', '/vehicles', '/inventory', '/trip-manager', '/bookings', '/my-account', '/chatbot'];
const publicOnlyRoutes = ['/login', '/signup'];

/**
 * Helper function to get session status by calling the internal API route.
 * This avoids direct firebase-admin import in middleware.
 */
async function getSessionFromApi(req: NextRequest): Promise<{ uid: string } | null> {
  // Construct the URL to your new API route.
  // In dev, use localhost. In prod, VERCEL_URL is set by Next.js/Vercel.
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/auth/verify-session`; // IMPORTANT: Match this to your new API route path

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        // CRITICAL: Forward the 'Cookie' header from the incoming request.
        // The API route needs this to read the '__session' cookie.
        'Cookie': req.headers.get('cookie') || ''
      }
    });

    if (!response.ok) {
      console.error(`Middleware: Error fetching session from API: ${response.status} - ${await response.text()}`);
      return null;
    }

    const data = await response.json();
    if (data.authenticated) {
      return { uid: data.uid }; // Return essential user info (e.g., UID)
    } else {
      return null;
    }
  } catch (error) {
    console.error("Middleware: Failed to fetch session from API:", error);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  // Call the helper function to get session status via the API route
  // The 'getSession' from '@/lib/server-session' is no longer imported or used here.
  const session = await getSessionFromApi(req);

  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedPaths.some(route => pathname.startsWith(route));

  // If the user is trying to access a protected route without a session, redirect them to the login page.
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the user is logged in (has a session) and tries to visit the login or signup page,
  // redirect them to their dashboard.
  if (session && publicOnlyRoutes.includes(pathname)) {
     const dashboardUrl = new URL('/dashboard', req.url);
     return NextResponse.redirect(dashboardUrl);
  }

  // Allow the request to proceed.
  return NextResponse.next();
}

// Next.js Middleware configuration
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

