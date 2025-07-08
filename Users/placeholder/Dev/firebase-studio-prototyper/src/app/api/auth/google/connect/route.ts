
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { randomBytes } from 'crypto';

const OAUTH2_SCOPES = ['https://www.googleapis.com/auth/tasks'];

export async function POST(req: NextRequest) {
  console.log('[AUTH CONNECT] Received POST request.');
  
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('[AUTH CONNECT] CRITICAL: Error getting Firebase Admin instances:', adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 503 });
  }
  console.log('[AUTH CONNECT] Firebase Admin SDK instances retrieved successfully.');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // Proactive Environment Variable Validation
  console.log('[AUTH CONNECT] Checking environment variables...');
  console.log('[AUTH CONNECT] GOOGLE_CLIENT_ID set:', !!clientId);
  console.log('[AUTH CONNECT] GOOGLE_CLIENT_SECRET set:', !!clientSecret);
  console.log('[AUTH CONNECT] NEXT_PUBLIC_APP_URL set:', !!appUrl);
  
  if (!clientId || !clientSecret) {
    console.error("[AUTH CONNECT] CRITICAL: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set in .env.local.");
    return NextResponse.json({ error: 'Google API credentials not configured on the server.' }, { status: 500 });
  }

  if (!appUrl) {
    console.error("[AUTH CONNECT] CRITICAL: NEXT_PUBLIC_APP_URL is not set in .env.local.");
    return NextResponse.json({ error: 'The application URL is not configured on the server.' }, { status: 500 });
  }
  console.log('[AUTH CONNECT] Environment variables for Google Auth are present.');

  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      console.warn('[AUTH CONNECT] Unauthorized: Missing or invalid Authorization header.');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    
    console.log('[AUTH CONNECT] Verifying user ID token...');
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    console.log(`[AUTH CONNECT] User token verified. UID: ${userId}`);

    if (!userId) {
        throw new Error("Could not verify user identity from token.");
    }

    const state = randomBytes(16).toString('hex');
    const stateDocRef = firestore.collection('oauthStates').doc(state);
    
    console.log(`[AUTH CONNECT] Attempting to write state token to Firestore at: oauthStates/${state}`);
    await stateDocRef.set({ userId: userId, createdAt: new Date().toISOString() });
    console.log('[AUTH CONNECT] Successfully wrote state token to Firestore.');

    const redirectUri = `${appUrl}/api/auth/google/callback`;
    console.log(`[AUTH CONNECT] Using Redirect URI for OAuth flow: ${redirectUri}`);
    
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Important to get a refresh token
      scope: OAUTH2_SCOPES,
      state: state, // Use the secure random state
      prompt: 'consent', // Force consent screen to ensure we get a refresh token
    });
    
    console.log(`[AUTH CONNECT] Successfully generated Google Auth URL. Sending back to client.`);
    return NextResponse.json({ url: authUrl });

  } catch (error: any) {
    console.error("[AUTH CONNECT] CRITICAL ERROR in try-catch block:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    // Also check for Firestore permission errors explicitly
    if (error.code === 7 || (error.message && error.message.toLowerCase().includes('permission_denied'))) {
        const firestoreErrorMsg = "Firestore permission denied. The server was blocked from writing to the 'oauthStates' collection. This is likely a security rule issue.";
        console.error(`[AUTH CONNECT] Firestore Error: ${firestoreErrorMsg}`);
        return NextResponse.json({ error: 'Server Permission Error', details: firestoreErrorMsg }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
