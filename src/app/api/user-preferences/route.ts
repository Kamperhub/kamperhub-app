
export const runtime = 'nodejs';
// src/app/api/user-preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';
import { z, ZodError } from 'zod';
import type { auth as adminAuth } from 'firebase-admin';

// Firestore-safe serialization
const firestoreTimestampReplacer = (key: any, value: any) => {
  if (value && typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return value;
};

const sanitizeData = (data: any) => {
  try {
    const jsonString = JSON.stringify(data, firestoreTimestampReplacer);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error in sanitizeData:', error);
    return {};
  }
};

async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();

  if (error) {
    return {
      uid: null,
      firestore: null,
      auth: null,
      errorResponse: NextResponse.json(
        { error: 'Server configuration error.', details: error.message },
        { status: 503 }
      ),
    };
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      uid: null,
      firestore: null,
      auth: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Authorization header.' },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(idToken);
    return { uid: decoded.uid, firestore, auth, errorResponse: null };
  } catch (error: any) {
    console.error('Token verification failed:', error);
    return {
      uid: null,
      firestore: null,
      auth: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Invalid ID token.', details: error.message },
        { status: 401 }
      ),
    };
  }
}

// Schema for validating preference updates
const userPreferencesSchema = z
  .object({
    activeVehicleId: z.string().nullable().optional(),
    activeCaravanId: z.string().nullable().optional(),
    activeWdhId: z.string().nullable().optional(),
    dashboardLayout: z.array(z.string()).nullable().optional(),
    caravanWaterLevels: z
      .record(z.record(z.number().min(0)))
      .nullable()
      .optional(),
    caravanDefaultChecklists: z.any().optional(),
  })
  .refine(
    (obj) => Object.values(obj).some((v) => v !== undefined),
    { message: 'At least one preference must be provided.' }
  );

// GET user preferences
export async function GET(req: NextRequest) {
  const { uid, firestore, auth, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse) return errorResponse;
  if (!uid || !firestore || !auth) {
    return NextResponse.json({ error: 'Internal Server Error: Instances not available.' }, { status: 500 });
  }

  try {
    const userDocRef = firestore.collection('users').doc(uid);
    let userDocSnap = await userDocRef.get();

    // If the user profile does not exist, create a default one.
    if (!userDocSnap.exists) {
      console.warn(`User profile for UID ${uid} not found. Creating a default profile.`);
      
      const authUser = await auth.getUser(uid);
      const newUserProfile: UserProfile = {
        uid: authUser.uid,
        email: authUser.email || null,
        displayName: authUser.displayName || `User-${authUser.uid.substring(0, 5)}`,
        firstName: null,
        lastName: null,
        city: null,
        state: null,
        country: null,
        subscriptionTier: 'free',
        stripeCustomerId: null,
        trialEndsAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userDocRef.set(newUserProfile);
      console.log(`Default profile created for UID ${uid}.`);

      // Re-fetch the document to ensure we return what's in the DB.
      userDocSnap = await userDocRef.get();
    }

    const userData = userDocSnap.data() || {};
    const serializableData = sanitizeData(userData);

    return NextResponse.json(serializableData, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (err: any) {
    console.error('Error fetching/creating user preferences for UID:', uid, 'Error:', err);
    return NextResponse.json(
      { error: 'Failed to process user preferences.', details: err.message },
      { status: 500 }
    );
  }
}

// PUT (update) user preferences
export async function PUT(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse) return errorResponse;
  if (!uid || !firestore) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const parsedData = userPreferencesSchema.parse(body);

    const userDocRef = firestore.collection('users').doc(uid);
    const updateData: Partial<UserProfile> = {
      ...parsedData,
      updatedAt: new Date().toISOString(),
    };

    await userDocRef.set(updateData, { merge: true });

    const updatedSnap = await userDocRef.get();
    const updatedData = sanitizeData(updatedSnap.data());

    return NextResponse.json(
      { message: 'User preferences updated successfully.', preferences: updatedData },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error updating user preferences:', err);
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid preferences data.', details: err.format() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update user preferences.', details: err.message },
      { status: 500 }
    );
  }
}
