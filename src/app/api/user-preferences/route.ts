
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';
import { z, ZodError } from 'zod';
import admin from 'firebase-admin';

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

// GET user preferences
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse) return errorResponse;
  if (!uid || !firestore) {
    return NextResponse.json({ error: 'Internal Server Error: Instances not available.' }, { status: 500 });
  }

  try {
    const userDocRef = firestore.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
       return NextResponse.json(
        { 
          error: 'User profile not found.',
          details: `A profile for the authenticated user (UID: ${uid}) does not exist in the Firestore 'users' collection.`
        },
        { status: 404 }
      );
    }

    const userData = userDocSnap.data() || {};
    const serializableData = sanitizeData(userData);

    return NextResponse.json(serializableData, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (err: any) {
    console.error('Error in user-preferences GET handler for UID:', uid, 'Error:', err);
    let errorMessage = 'Failed to process user preferences on the server.';
    let statusCode = 500;

    // Check for the specific "NOT_FOUND" error from Firestore
    if (err.code === 5 || (err.message && err.message.includes('NOT_FOUND'))) {
        errorMessage = 'Database Not Found or Inaccessible';
        const projectId = admin.apps[0]?.options.projectId || 'unknown';
        const details = `The server connected to Firebase Project ID "${projectId}" but could not find the Firestore database. This usually means the database has not been created in the Firebase console for this project. Please go to the Firebase Console, select your project, and ensure you have created a Firestore Database. Refer to Step 6 in FIREBASE_SETUP_CHECKLIST.md.`;
        return NextResponse.json({ error: errorMessage, details: details }, { status: 404 });
    }

    return NextResponse.json(
      { error: errorMessage, details: err.message },
      { status: statusCode }
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
    const updateData: { [key: string]: any } = {
      ...parsedData,
      updatedAt: new Date().toISOString(),
    };
    
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
