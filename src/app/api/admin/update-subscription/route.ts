
import { NextRequest, NextResponse } from 'next/server';
// Import admin and adminFirestore, which might be undefined if initialization failed
import { admin, adminFirestore } from '@/lib/firebase-admin';
import type { UserProfile, SubscriptionTier } from '@/types/auth';
import { z, ZodError } from 'zod';

// Define the expected request body schema for validation
const updateSubscriptionSchema = z.object({
  targetUserId: z.string().min(1, "Target User ID is required"),
  newTier: z.enum(["free", "pro", "trialing", "trial_expired"]),
  newStatus: z.string().optional(), // e.g., "active", "trialing", "canceled", "past_due"
  newTrialEndsAt: z.string().datetime({ offset: true }).nullable().optional(), // ISO string or null
  newCurrentPeriodEnd: z.string().datetime({ offset: true }).nullable().optional(), // ISO string or null
});

export async function POST(req: NextRequest) {
  // Check if admin SDK services are available
  if (!adminFirestore || !admin.auth) {
    console.error('API Error: Admin SDK not properly initialized. Firestore or Auth service is unavailable.');
    return NextResponse.json({ error: 'Server configuration error: Admin services are not available.' }, { status: 503 });
  }

  try {
    // 1. Authenticate the caller (admin user)
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid ID token.' }, { status: 401 });
    }

    const adminUid = decodedToken.uid;

    // 2. Verify admin privileges
    const adminUserDocRef = adminFirestore.collection('users').doc(adminUid);
    const adminUserDocSnap = await adminUserDocRef.get();

    if (!adminUserDocSnap.exists()) {
      return NextResponse.json({ error: 'Forbidden: Admin user profile not found.' }, { status: 403 });
    }

    const adminUserProfile = adminUserDocSnap.data() as UserProfile;
    if (adminUserProfile.isAdmin !== true) {
      return NextResponse.json({ error: 'Forbidden: User does not have admin privileges.' }, { status: 403 });
    }

    // 3. Parse and validate the request body
    const body = await req.json();
    const parsedBody = updateSubscriptionSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }

    const { targetUserId, newTier, newStatus, newTrialEndsAt, newCurrentPeriodEnd } = parsedBody.data;

    // 4. Update the target user's subscription details in Firestore
    const targetUserDocRef = adminFirestore.collection('users').doc(targetUserId);
    const targetUserDocSnap = await targetUserDocRef.get();

    if (!targetUserDocSnap.exists()) {
      return NextResponse.json({ error: `Target user with ID ${targetUserId} not found.` }, { status: 404 });
    }

    const updateData: Partial<UserProfile> = {
      subscriptionTier: newTier as SubscriptionTier,
      updatedAt: new Date().toISOString(),
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

    return NextResponse.json({ message: `Subscription for user ${targetUserId} updated successfully.` }, { status: 200 });

  } catch (error: any) {
    console.error('Error in admin update-subscription endpoint:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request body.', details: error.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET() {
  const serviceAccountJsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  // Safely check admin and admin.apps
  const adminSDKInitialized = admin && admin.apps && admin.apps.length > 0;

  return NextResponse.json({ 
    message: "Admin update-subscription endpoint. Use POST to update.",
    adminSDKStatus: adminSDKInitialized ? "Initialized" : "Not Initialized or Error",
    serviceAccountEnvVarSet: !!serviceAccountJsonString,
    firestoreStatus: adminFirestore ? "Initialized" : "Not Initialized or Error",
  });
}
