import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth Error:', error);
    return NextResponse.redirect(new URL('/my-account?error=google_auth_failed', req.url));
  }

  if (!code) {
    console.error('Google OAuth: No code received.');
    return NextResponse.redirect(new URL('/my-account?error=google_auth_no_code', req.url));
  }
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set.");
    return NextResponse.json({ error: 'Google API credentials not configured on the server.' }, { status: 500 });
  }

  const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // TODO in a future step:
    // 1. Get the current user's UID (this is the tricky part without a session cookie, may need client involvement).
    // 2. Securely store the `tokens.refresh_token` and `tokens.access_token` in the user's Firestore document.
    //    `tokens.refresh_token` is only provided on the first authorization.
    // 3. Redirect back to the account page with a success message.

    console.log("Received Google Auth Tokens:", tokens);

    return NextResponse.redirect(new URL('/my-account?success=google_auth_connected', req.url));
    
  } catch (err: any) {
    console.error("Error exchanging auth code for tokens:", err);
    return NextResponse.redirect(new URL('/my-account?error=google_token_exchange_failed', req.url));
  }
}
