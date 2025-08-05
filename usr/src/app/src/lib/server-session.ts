
import 'server-only';
import { cookies } from 'next/headers';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Gets the server-side session from the '__session' cookie.
 * @returns The decoded user token or null if not authenticated.
 */
export async function getSession(): Promise<DecodedIdToken | null> {
  // This function is intended to run in a server-side Node.js environment.
  // The middleware has been updated to call an API route instead of this directly.
  // If this is still being called by middleware, it indicates a misconfiguration.
  const { auth } = getFirebaseAdmin();
  if (!auth) {
    console.error("Auth session check failed: Firebase Admin SDK not initialized.");
    return null;
  }

  const sessionCookie = cookies().get('__session')?.value || '';

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken;
  } catch (error: any) {
    if (error.code === 'auth/session-cookie-revoked' || error.code === 'auth/session-cookie-expired') {
      // Expected condition for expired sessions, not an app error.
    } else {
      console.error('Session cookie verification failed:', error.code, error.message);
    }
    return null;
  }
}
