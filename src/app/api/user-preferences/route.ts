
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';
import { z, ZodError } from 'zod';
import type admin from 'firebase-admin';

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

async function getUserIdFromRequest(req: NextRequest, auth: admin.auth.Auth): Promise<string | null> {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decoded = await auth.verifyIdToken(idToken);
        return decoded.uid;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
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
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }

  const uid = await getUserIdFromRequest(req, auth);
  if (!uid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
  }

  try {
    const userDocRef = firestore.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
       return NextResponse.json(
        { 
          error: 'User profile not found.',
          details: `A profile for the authenticated user (UID: ${uid}) does not exist in the Firestore 'users' collection. This indicates a data integrity problem that may require creating the user profile document.`
        },
        { status: 500 }
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
    
    // Check for the specific "NOT_FOUND" error from Firestore (code 5)
    if (err.code === 5) {
        const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not Set';
        const errorMessage = `Database Not Found in Project '${clientProjectId}'`;
        const details = `The server connected to Firebase project '${clientProjectId}' successfully, but it could not find a Firestore database.

This usually means one of two things:
1. A Firestore database has not been created in the '${clientProjectId}' project. Please go to the Firebase Console and create one. (See Step 6 in FIREBASE_SETUP_CHECKLIST.md)
2. You intended to connect to a different project (like 'kamperhubv2') that already has your database. If so, you must update ALL Firebase keys in your .env.local file to use the keys from that project. The diagnostic tool at /api/debug/env can help confirm this.`;
        
        return NextResponse.json({ error: errorMessage, details: details }, { status: 500 });
    }

    // Default error for other issues
    return NextResponse.json(
      { error: 'Failed to process user preferences on the server.', details: err.message },
      { status: 500 }
    );
  }
}

// PUT (update) user preferences
export async function PUT(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }

  const uid = await getUserIdFromRequest(req, auth);
  if (!uid) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing token.' }, { status: 401 });
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
