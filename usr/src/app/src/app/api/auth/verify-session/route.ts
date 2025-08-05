
// src/app/api/auth/verify-session/route.ts
// This API route handles session verification using the full Node.js runtime
// where firebase-admin is fully compatible.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import 'server-only'; // Ensures this file is never accidentally bundled client-side

// IMPORTANT: Explicitly configure this API Route to run in the Node.js runtime
// This is the key to solving the 'node:process' error for firebase-admin.
export const runtime = 'nodejs';

export async function GET() {
  const { auth } = getFirebaseAdmin(); // Firebase Admin SDK will work here!
  if (!auth) {
    console.error("API Route: Firebase Admin SDK not initialized for session verification.");
    return NextResponse.json({ authenticated: false, error: "Auth SDK not initialized" }, { status: 500 });
  }

  const sessionCookie = cookies().get('__session')?.value || '';

  if (!sessionCookie) {
    // Not an error, just no session cookie found
    return NextResponse.json({ authenticated: false, reason: "no_session_cookie" }, { status: 200 });
  }

  try {
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    // Return only necessary authentication status/data to the middleware
    return NextResponse.json({ authenticated: true, uid: decodedIdToken.uid }, { status: 200 });
  } catch (error: any) {
    // Handle expired/revoked cookies gracefully
    if (error.code === 'auth/session-cookie-revoked' || error.code === 'auth/session-cookie-expired') {
      console.warn('API Route: Session cookie expired or revoked.');
      return NextResponse.json({ authenticated: false, reason: "session_expired_or_revoked" }, { status: 200 });
    } else {
      console.error('API Route: Session cookie verification failed:', error.code, error.message);
      return NextResponse.json({ authenticated: false, error: "Verification failed", details: error.message }, { status: 500 });
    }
  }
}
