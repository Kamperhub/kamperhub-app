
export const runtime = 'nodejs';
// src/app/api/user-preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';
import { z, ZodError } from 'zod';
import type { auth as adminAuth } from 'firebase-admin';

const ADMIN_EMAIL = 'info@kamperhub.com';

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
      auth: null,
      firestore: null,
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
      auth: null,
      firestore: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Authorization header.' },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await auth.verifyIdToken(idToken);
    return { uid: decoded.uid, auth, firestore, errorResponse: null };
  } catch (error: any) {
    console.error('Token verification failed:', error);
    return {
      uid: null,
      auth: null,
      firestore: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Invalid ID token.', details: error.message },
        { status: 401 }
      ),
    };
  }
}

// Schema for validating preference updates from the client
const userPreferencesUpdateSchema = z
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
    displayName: z.string().optional(),
    email: z.string().email().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  })
  .refine(
    (obj) => Object.values(obj).some((v) => v !== undefined),
    { message: 'At least one preference or profile field must be provided for an update.' }
  );

// GET user preferences (with self-healing profile creation)
export async function GET(req: NextRequest) {
  const { uid, auth, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse) return errorResponse;
  if (!uid || !firestore || !auth) {
    return NextResponse.json({ error: 'Internal Server Error: Instances not available.' }, { status: 500 });
  }

  try {
    const userDocRef = firestore.collection('users').doc(uid);
    let userDocSnap = await userDocRef.get();

    // If the user profile does not exist, create it. This is the "self-healing" part.
    if (!userDocSnap.exists) {
      console.warn(`User profile for UID ${uid} not found. Creating a default profile.`);
      
      const authUser = await auth.getUser(uid);
      const isKamperHubAdmin = authUser.email === ADMIN_EMAIL;
      
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      const newUserProfile: UserProfile = {
        uid: authUser.uid,
        email: authUser.email || 'error@example.com',
        displayName: authUser.displayName || 'New User',
        firstName: 'New',
        lastName: 'User',
        city: 'Not Set',
        state: 'Not Set',
        country: 'Not Set',
        subscriptionTier: 'trialing', // Start all new users on a trial
        stripeCustomerId: null,
        trialEndsAt: trialEndDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAdmin: isKamperHubAdmin,
      };

      await userDocRef.set(newUserProfile);
      console.log(`Default profile with placeholder data created for UID ${uid}. Admin status: ${isKamperHubAdmin}`);

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
    console.error('Error in user-preferences GET handler for UID:', uid, 'Error:', err);
     if (err.code === 5 /* NOT_FOUND */) {
        return NextResponse.json(
          { 
            error: 'Database Not Found', 
            details: `Your application is correctly configured, but the Firestore database for project '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kamperhub-s4hc2'}' has not been created yet. Please go to the Firebase Console, select your project, and click 'Firestore Database' to create one.`,
            critical: true // Add a flag for the UI
          },
          { status: 500 }
        );
    }
    return NextResponse.json(
      { error: 'Failed to process user preferences on the server.', details: err.message },
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
    const parsedData = userPreferencesUpdateSchema.parse(body);

    const userDocRef = firestore.collection('users').doc(uid);
    const updateData: { [key: string]: any } = { // Use a more generic type for Firestore update
      ...parsedData,
      updatedAt: new Date().toISOString(),
    };
    
    // Remove undefined fields to avoid issues with Firestore
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    await userDocRef.set(updateData, { merge: true });

    const updatedSnap = await userDocRef.get();
    const updatedData = sanitizeData(updatedSnap.data());

    return NextResponse.json(
      { message: 'User profile and preferences updated successfully.', preferences: updatedData },
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
