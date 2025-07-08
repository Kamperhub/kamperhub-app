
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  console.log(`[AUTH CALLBACK] Received GET request for: ${req.url}`);

  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('[AUTH CALLBACK] Error getting Firebase Admin instances:', adminError?.message);
    return NextResponse.redirect(new URL('/my-account?error=server_config_error', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.error(`[AUTH CALLBACK] Google returned an error: ${error}`);
    return NextResponse.redirect(new URL(`/my-account?error=${encodeURIComponent(error)}`, req.url));
  }
  if (!code || !state) {
    console.error('[AUTH CALLBACK] Google response is missing code or state parameter.');
    return NextResponse.redirect(new URL('/my-account?error=google_auth_invalid_response', req.url));
  }
  
  const stateDocRef = firestore.collection('oauthStates').doc(state);
  
  try {
    console.log(`[AUTH CALLBACK] Verifying state: ${state}`);
    const stateDoc = await stateDocRef.get();
    if (!stateDoc.exists) {
      console.error("[AUTH CALLBACK] Invalid or expired state parameter received.");
      throw new Error("Invalid state parameter. Please try connecting your account again.");
    }
    const { userId } = stateDoc.data() as { userId: string };
    
    // State is single-use, delete it immediately after verification.
    await stateDocRef.delete();
    console.log(`[AUTH CALLBACK] State verified and deleted for user: ${userId}`);
    
    if (!userId) {
        throw new Error("User ID not found in state document. Could not proceed.");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!clientId || !clientSecret) {
      throw new Error("Google API credentials are not configured on the server.");
    }
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured on the server.");
    }

    const redirectUri = `${appUrl}/api/auth/google/callback`;
    console.log(`[AUTH CALLBACK] Using Redirect URI for token exchange: ${redirectUri}`);
    
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    console.log(`[AUTH CALLBACK] Exchanging authorization code for tokens...`);
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("[AUTH CALLBACK] Incomplete token set received from Google:", tokens);
      throw new Error("Could not retrieve a valid refresh token from Google. Please ensure you are prompted for 'offline access'.");
    }
    
    console.log(`[AUTH CALLBACK] Storing tokens for user: ${userId}`);
    const userDocRef = firestore.collection('users').doc(userId);
    await userDocRef.set({
      googleAuth: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scopes: tokens.scope?.split(' '),
      },
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log(`[AUTH CALLBACK] Successfully processed. Redirecting to success page.`);
    return NextResponse.redirect(new URL('/my-account?success=google_auth_connected', req.url));
    
  } catch (err: any) {
    console.error("[AUTH CALLBACK] An error occurred in the callback handler:", err);
    console.error(err.stack); // Log the full stack trace
    await stateDocRef.delete().catch(() => {}); // Clean up state doc on error
    return NextResponse.redirect(new URL(`/my-account?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
