import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { randomBytes } from 'crypto';

const OAUTH2_SCOPES = ['https://www.googleapis.com/auth/tasks'];

export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('Error getting Firebase Admin instances:', adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 503 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set.");
    return NextResponse.json({ error: 'Google API credentials not configured on the server.' }, { status: 500 });
  }

  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
        throw new Error("Could not verify user identity.");
    }

    const state = randomBytes(16).toString('hex');
    const stateDocRef = firestore.collection('oauthStates').doc(state);
    
    // Store the state with the UID. It will be checked and deleted in the callback.
    await stateDocRef.set({ userId: userId });

    const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Important to get a refresh token
      scope: OAUTH2_SCOPES,
      state: state, // Use the secure random state
      prompt: 'consent', // Force consent screen to ensure we get a refresh token
    });

    return NextResponse.json({ url: authUrl });

  } catch (error: any) {
    console.error("Error generating Google Auth URL:", error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
