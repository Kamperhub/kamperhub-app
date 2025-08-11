import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
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

async function verifyUserAndGetInstances(req: NextRequest): Promise<{ uid: string; firestore: admin.firestore.Firestore; }> {
    const { auth, firestore, error } = getFirebaseAdmin();
    if (error || !auth || !firestore) {
      throw new Error('Server configuration error.');
    }
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid Authorization header.');
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decoded = await auth.verifyIdToken(idToken);
        return { uid: decoded.uid, firestore };
    } catch (error: any) {
        console.error('Token verification failed:', error);
        throw new Error('Unauthorized: Invalid ID token.');
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
    hasDismissedGettingStartedGuide: z.boolean().optional(),
  })
  .refine(
    (obj) => Object.values(obj).some((v) => v !== undefined),
    { message: 'At least one preference or profile field must be provided for an update.' }
  );

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in user-preferences route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  if (error.message.includes('Unauthorized')) {
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
  if (error.message.includes('Server configuration error')) {
    return NextResponse.json({ error: 'Server configuration error', details: error.message }, { status: 503 });
  }
  if (error.code === 16) { // UNAUTHENTICATED from Firebase Admin
     return NextResponse.json({ error: 'Server Authentication Failed', details: `16 UNAUTHENTICATED: ${error.message}. This is a server configuration issue. Check your GOOGLE_APPLICATION_CREDENTIALS_JSON.` }, { status: 500 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

// GET user preferences
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const userDocRef = firestore.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
       return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const userData = userDocSnap.data() || {};
    const serializableData = sanitizeData(userData);
    return NextResponse.json(serializableData, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// PUT (update) user preferences
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
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

    return NextResponse.json({ message: 'User profile and preferences updated successfully.', preferences: updatedData }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
