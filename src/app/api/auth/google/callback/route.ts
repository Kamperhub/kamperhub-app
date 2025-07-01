import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('Error getting Firebase Admin instances:', adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth Error:', error);
    return NextResponse.redirect(new URL('/my-account?error=google_auth_failed', req.url));
  }
  if (!code || !state) {
    console.error('Google OAuth: Missing code or state parameter.');
    return NextResponse.redirect(new URL('/my-account?error=google_auth_invalid_response', req.url));
  }
  
  const stateDocRef = firestore.collection('oauthStates').doc(state);
  
  try {
    const stateDoc = await stateDocRef.get();
    if (!stateDoc.exists) {
      console.error("Invalid or expired state parameter received from Google Auth callback.");
      throw new Error("Invalid state parameter. Please try connecting again.");
    }
    const { userId } = stateDoc.data() as { userId: string };
    
    // State is single-use, delete it immediately after verification.
    await stateDocRef.delete();
    
    if (!userId) {
        throw new Error("User ID not found in state document.");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error("Google API credentials not configured on the server.");
    }

    const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date || !tokens.scope) {
      throw new Error("Incomplete token set received from Google.");
    }
    
    // Store tokens in the user's Firestore document
    const userDocRef = firestore.collection('users').doc(userId);
    await userDocRef.set({
      googleAuth: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scopes: tokens.scope.split(' '),
      },
      updatedAt: new Date().toISOString(), // Update timestamp
    }, { merge: true });

    return NextResponse.redirect(new URL('/my-account?success=google_auth_connected', req.url));
    
  } catch (err: any) {
    console.error("Error in Google Auth callback:", err);
    // Attempt to delete the state doc on error too, if it exists
    await stateDocRef.delete().catch(() => {});
    return NextResponse.redirect(new URL(`/my-account?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
