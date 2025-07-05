'use server';

import { cookies } from 'next/headers';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Gets the server-side session from the '__session' cookie.
 * This cookie is typically set by Firebase Hosting or a custom authentication endpoint.
 * @returns The decoded user token or null if not authenticated.
 */
export async function getSession(): Promise<DecodedIdToken | null> {
  const { auth } = getFirebaseAdmin();
  // If the admin SDK failed to init, there's no way to verify a session.
  if (!auth) {
    console.error("Auth session check failed: Firebase Admin SDK not initialized.");
    return null;
  }

  const sessionCookie = cookies().get('__session')?.value || '';

  if (!sessionCookie) {
    return null;
  }

  try {
    // Set checkRevoked to true to ensure the session is still valid.
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    return decodedIdToken;
  } catch (error: any) {
    // Session cookie is invalid or revoked.
    // This is an expected condition for expired sessions, not necessarily an app error.
    if (error.code === 'auth/session-cookie-revoked' || error.code === 'auth/session-cookie-expired') {
      // Silently ignore, as this is a normal unauthenticated state.
    } else {
      console.error('Session cookie verification failed:', error.code, error.message);
    }
    return null;
  }
}
