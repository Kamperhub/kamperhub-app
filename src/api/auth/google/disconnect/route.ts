
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import type { UserProfile } from '@/types/auth';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }

  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const userDocRef = firestore.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const userProfile = userDocSnap.data() as UserProfile;
    const refreshToken = userProfile.googleAuth?.refreshToken;

    if (refreshToken) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        console.error("Google API credentials not configured on the server for token revocation.");
        // We will still proceed to delete our local copy, but we log the error.
      } else {
        try {
          const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
          // This call revokes the token on Google's side.
          await oauth2Client.revokeToken(refreshToken);
        } catch (revokeError: any) {
          // Even if revocation fails (e.g., token already revoked by user on Google's side),
          // we should still proceed to remove the data from our end.
          console.warn(`Could not revoke Google token for user ${userId}. This may be because it was already revoked. Error: ${revokeError.message}`);
        }
      }
    }
    
    // Remove the Google auth data from the user's profile
    await userDocRef.update({
      googleAuth: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Successfully disconnected Google Account.' }, { status: 200 });

  } catch (error: any) {
    console.error("Error in /api/auth/google/disconnect:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
