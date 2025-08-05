import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import { randomBytes } from 'crypto';

const OAUTH2_SCOPES = ['https://www.googleapis.com/auth/tasks'];

export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('[AUTH CONNECT] CRITICAL: Error getting Firebase Admin instances:', adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 503 });
  }
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!clientId || !clientSecret) {
    console.error("[AUTH CONNECT] CRITICAL: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set in .env.local.");
    return NextResponse.json({ error: 'Google API credentials not configured on the server.' }, { status: 500 });
  }

  if (!appUrl) {
    console.error("[AUTH CONNECT] CRITICAL: NEXT_PUBLIC_APP_URL is not set in .env.local.");
    return NextResponse.json({ error: 'The application URL is not configured on the server.' }, { status: 500 });
  }

  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      console.warn('[AUTH CONNECT] Unauthorized: Missing or invalid Authorization header.');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
        throw new Error("Could not verify user identity from token.");
    }

    const state = randomBytes(16).toString('hex');
    const stateDocRef = firestore.collection('oauthStates').doc(state);
    
    await stateDocRef.set({ userId: userId, createdAt: new Date().toISOString() });

    const redirectUri = `${appUrl}/api/auth/google/callback`;
    
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: OAUTH2_SCOPES,
      state: state,
      prompt: 'consent',
    });
    
    return NextResponse.json({ url: authUrl });

  } catch (error: any) {
    console.error("[AUTH CONNECT] CRITICAL ERROR in try-catch block:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    if (error.code === 7 || (error.message && error.message.toLowerCase().includes('permission_denied'))) {
        const firestoreErrorMsg = "Firestore permission denied. The server was blocked from writing to the 'oauthStates' collection. This is likely a security rule issue.";
        console.error(`[AUTH CONNECT] Firestore Error: ${firestoreErrorMsg}`);
        return NextResponse.json({ error: 'Server Permission Error', details: firestoreErrorMsg }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
