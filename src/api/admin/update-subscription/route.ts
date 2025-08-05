import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import type { UserProfile, SubscriptionTier } from '@/types/auth';
import { z, ZodError } from 'zod';
import type admin from 'firebase-admin';

const updateSubscriptionSchema = z.object({
  targetUserEmail: z.string().email("Target User Email is required and must be a valid email."),
  newTier: z.enum(["free", "pro", "trialing"]),
});

const ADMIN_EMAIL = 'info@kamperhub.com';

async function verifyAdminAndGetInstances(req: NextRequest): Promise<{ auth: admin.auth.Auth; firestore: admin.firestore.Firestore; }> {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    throw new Error("Server configuration error: Auth or Firestore not initialized.");
  }

  const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) throw new Error("Unauthorized: Missing token.");

  const decodedToken = await auth.verifyIdToken(idToken);
  if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Forbidden: You do not have permission to perform this action.');
  }
  return { auth, firestore };
}

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in admin/update-subscription route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
    return NextResponse.json({ error: 'Forbidden', details: error.message }, { status: 403 });
  }
  if (error.message.includes('Server configuration error')) {
    return NextResponse.json({ error: 'Server configuration error', details: error.message }, { status: 503 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { auth, firestore } = await verifyAdminAndGetInstances(req);
    
    const body = await req.json();
    const parsedBody = updateSubscriptionSchema.parse(body);
    const { targetUserEmail, newTier } = parsedBody;

    let targetUserRecord;
    try {
      targetUserRecord = await auth.getUserByEmail(targetUserEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: `Target user with email ${targetUserEmail} not found.` }, { status: 404 });
      }
      throw error; // Re-throw other auth errors to be caught by the main handler
    }
    
    const targetUserDocRef = firestore.collection('users').doc(targetUserRecord.uid);
    const updateData: Partial<Pick<UserProfile, 'subscriptionTier' | 'updatedAt'>> = {
      subscriptionTier: newTier,
      updatedAt: new Date().toISOString(),
    };

    await targetUserDocRef.set(updateData, { merge: true });

    return NextResponse.json({ message: `Subscription for user ${targetUserEmail} updated successfully.` }, { status: 200 });

  } catch (error: any) {
    return handleApiError(error);
  }
}
