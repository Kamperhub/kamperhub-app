import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const OAUTH2_SCOPES = ['https://www.googleapis.com/auth/tasks'];

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set.");
    return NextResponse.json({ error: 'Google API credentials not configured on the server.' }, { status: 500 });
  }

  // The redirect URI must be one of the "Authorised redirect URIs" in your Google Cloud Console credentials.
  const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Important to get a refresh token
    scope: OAUTH2_SCOPES,
    // A 'state' parameter is recommended for security to prevent CSRF attacks.
    // In a real app, you'd generate a random string, save it in the user's session,
    // and verify it in the callback. We'll omit it here for simplicity.
  });

  return NextResponse.redirect(authUrl);
}
