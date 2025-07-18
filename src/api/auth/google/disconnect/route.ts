import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import type { UserProfile } from '@/types/auth';
import { google } from 'googleapis';
import { ZodError } from 'zod';

async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    throw new Error('Server configuration error.');
  }

  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header.');
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, auth, firestore };
  } catch (error: any) {
    throw new Error('Unauthorized: Invalid ID token.');
  }
}

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in google/disconnect route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  if (error.message.includes('Unauthorized')) {
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
  if (error.message.includes('Server configuration error')) {
    return NextResponse.json({ error: 'Server configuration error', details: error.message }, { status: 503 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};


export async function POST(req: NextRequest) {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const userDocRef = firestore.collection('users').doc(uid);
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
      } else {
        try {
          const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
          await oauth2Client.revokeToken(refreshToken);
        } catch (revokeError: any) {
          console.warn(`Could not revoke Google token for user ${uid}. This may be because it was already revoked. Error: ${revokeError.message}`);
        }
      }
    }
    
    await userDocRef.update({
      googleAuth: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Successfully disconnected Google Account.' }, { status: 200 });

  } catch (error: any) {
    return handleApiError(error);
  }
}
