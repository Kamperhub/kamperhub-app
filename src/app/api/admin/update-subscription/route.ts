
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile, SubscriptionTier } from '@/types/auth';
import { z, ZodError } from 'zod';

const updateSubscriptionSchema = z.object({
  targetUserEmail: z.string().email("Target User Email is required and must be a valid email."),
  newTier: z.enum(["free", "pro", "trialing", "trial_expired"]),
  newStatus: z.string().optional(),
  newTrialEndsAt: z.string().datetime({ offset: true }).nullable().optional(),
  newCurrentPeriodEnd: z.string().datetime({ offset: true }).nullable().optional(),
});

const ADMIN_EMAIL = 'info@kamperhub.com';

export async function POST(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error) {
    console.error('API Route Error: Firebase Admin SDK not available.', error);
    return NextResponse.json({
      error: 'Server configuration error.',
      details: error?.message || "The backend failed to connect to the database. Please check server logs."
    }, { status: 503 });
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

    if (decodedToken.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Forbidden: User does not have admin privileges.' }, { status: 403 });
    }

    const body = await req.json();
    const parsedBody = updateSubscriptionSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }

    const { targetUserEmail, newTier, newStatus, newTrialEndsAt, newCurrentPeriodEnd } = parsedBody.data;

    // Get target user's UID by email
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
    const targetUserDocSnap = await targetUserDocRef.get();

    if (!targetUserDocSnap.exists()) {
      // This case might be rare if auth record exists, but good to check Firestore profile presence
      console.warn(`Auth record found for ${targetUserEmail} (UID: ${targetUserId}), but no Firestore profile document. Creating one with subscription update.`);
    }

    const updateData: Partial<UserProfile> = {
      subscriptionTier: newTier as SubscriptionTier,
      updatedAt: new Date().toISOString(),
      // Ensure basic profile fields are present if creating a new doc, or if user exists but has no these fields
      email: targetUserEmail, 
      uid: targetUserId,
    };
    
    if (newStatus !== undefined) {
        updateData.subscriptionStatus = newStatus;
    }
    if (newTrialEndsAt !== undefined) {
        updateData.trialEndsAt = newTrialEndsAt;
    }
    if (newCurrentPeriodEnd !== undefined) {
        updateData.currentPeriodEnd = newCurrentPeriodEnd;
    }

    await targetUserDocRef.set(updateData, { merge: true });

    return NextResponse.json({ message: `Subscription for user ${targetUserEmail} (UID: ${targetUserId}) updated successfully.` }, { status: 200 });

  } catch (error: any) {
    console.error('Error in admin update-subscription endpoint:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request body.', details: error.format() }, { status: 400 });
    }
    // Catch all for any other unexpected errors
    if (error.code && error.message) { // Check if it's a Firebase-like error
        return NextResponse.json({ error: 'Internal Server Error', code: error.code, details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}

export async function GET() {
  const { firestore, error } = getFirebaseAdmin();
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  return NextResponse.json({ 
    message: "Admin update-subscription endpoint. Use POST to update. Identifies users by email.",
    adminSDKStatus: firestore ? "Initialized" : "Not Initialized or Error",
    serviceAccountEnvVarSet: !!serviceAccountJsonString,
    firestoreStatus: firestore ? "Initialized" : "Not Initialized or Error",
    initializationError: error ? error.message : null
  });
}
    
