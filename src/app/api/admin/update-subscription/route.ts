
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile, SubscriptionTier } from '@/types/auth';
import { z, ZodError } from 'zod';

const updateSubscriptionSchema = z.object({
  targetUserEmail: z.string().email("Target User Email is required and must be a valid email."),
  newTier: z.enum(["free", "pro", "trialing"]),
});

const ADMIN_EMAIL = 'info@kamperhub.com';

export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('Error getting Firebase Admin instances:', adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }
  
  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error: any) {
      console.error('Error verifying Firebase ID token:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message, errorCode: error.code }, { status: 401 });
    }

    if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: User does not have admin privileges.' }, { status: 403 });
    }

    const body = await req.json();
    const parsedBody = updateSubscriptionSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }

    const { targetUserEmail, newTier } = parsedBody.data;

    let targetUserRecord;
    try {
      targetUserRecord = await auth.getUserByEmail(targetUserEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: `Target user with email ${targetUserEmail} not found.` }, { status: 404 });
      }
      console.error(`Error fetching user by email ${targetUserEmail}:`, error);
      return NextResponse.json({ error: 'Error fetching target user.', details: error.message }, { status: 500 });
    }
    
    const targetUserId = targetUserRecord.uid;

    const targetUserDocRef = firestore.collection('users').doc(targetUserId);

    const updateData: Partial<Pick<UserProfile, 'subscriptionTier' | 'updatedAt'>> = {
      subscriptionTier: newTier as SubscriptionTier,
      updatedAt: new Date().toISOString(),
    };

    await targetUserDocRef.set(updateData, { merge: true });

    return NextResponse.json({ message: `Subscription for user ${targetUserEmail} (UID: ${targetUserId}) updated successfully.` }, { status: 200 });

  } catch (error: any) {
    console.error('Error in admin update-subscription endpoint:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request body.', details: error.format() }, { status: 400 });
    }
    
    let errorTitle = 'Internal Server Error';
    let errorDetails = error.message;

    if (error.code === 16 || (error.message && error.message.toLowerCase().includes('unauthenticated'))) {
      errorTitle = `16 UNAUTHENTICATED: Server not authorized`;
      errorDetails = `The server's credentials (GOOGLE_APPLICATION_CREDENTIALS_JSON) are invalid or lack IAM permissions. Please follow the setup checklist to verify your service account role and Firestore rules, then restart the server. Original Error: ${error.message}`;
    } else if (error.code === 5 || (error.message && error.message.toLowerCase().includes('not_found'))) {
      errorTitle = `DATABASE NOT FOUND`;
      errorDetails = `The server could not find the Firestore database 'kamperhubv2'. Please verify it has been created in your Firebase project. Original Error: ${error.message}`;
    }
    
    return NextResponse.json({ error: errorTitle, details: errorDetails }, { status: 500 });
  }
}
