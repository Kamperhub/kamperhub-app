
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
  } catch (error: any) {
    console.error('Error in sanitizeData:', error);
    throw new Error(`Failed to serialize user data: ${error.message}`);
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
    dashboardLayout: z.array(z.string()).nullable().optional(),
    caravanWaterLevels: z
      .record(z.record(z.number().min(0)))
      .nullable()
      .optional(),
    caravanDefaultChecklists: z.any().optional(),
    displayName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    homeAddress: z.string().optional().nullable(),
    hasDismissedGettingStartedGuide: z.boolean().optional(), // Added new field
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
        { status: 404 } // Use 404 for resource not found
      );
    }

    const userData = userDocSnap.data() || {};
    
    // Add specific try/catch for serialization to prevent crashes
    let serializableData;
    try {
        serializableData = sanitizeData(userData);
    } catch (serializationError: any) {
        console.error('CRITICAL: Failed to serialize user profile data for UID:', uid, 'Error:', serializationError);
        return NextResponse.json(
            { error: 'Server Error: Could not process user profile data.', details: serializationError.message },
            { status: 500 }
        );
    }

    return NextResponse.json(serializableData, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (err: any) {
    console.error('Error in user-preferences GET handler for UID:', uid, 'Error:', err);
    
    let errorInfo = 'Failed to process user preferences on the server.';
    let errorDetails = err.message;
    
    // Check for "database not found" error first, as it's very specific
    if (err.code === 5 || (err.details && err.details.toLowerCase().includes('database not found')) || (err.message && err.message.toLowerCase().includes('not_found'))) {
      errorInfo = `Database Not Found or Inaccessible`;
      errorDetails = `CRITICAL: The server could not find the Firestore database named 'kamperhubv2'. This usually means either (a) the Firestore database has not been created in the Firebase console for this project, or (b) the Project ID in your GOOGLE_APPLICATION_CREDENTIALS_JSON does not match the client-side NEXT_PUBLIC_FIREBASE_PROJECT_ID. Please follow the setup checklist carefully. Original Error: ${err.message}`;
    } else if (err.code === 16 || (err.message && err.message.toLowerCase().includes('unauthenticated'))) {
      errorInfo = '16 UNAUTHENTICATED: The server is not authorized to access Google Cloud services.';
      errorDetails = `This is a server-side configuration error. The service account credentials in GOOGLE_APPLICATION_CREDENTIALS_JSON may be invalid, for the wrong project, or lack the necessary IAM permissions (e.g., 'Editor' or 'Cloud Datastore User' role). Please use the setup checklist to verify your configuration. Original Error: ${err.message}`;
    }
    
    return NextResponse.json(
      { error: errorInfo, details: errorDetails },
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
