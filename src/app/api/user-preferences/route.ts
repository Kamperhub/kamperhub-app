
// src/app/api/user-preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';
import { z, ZodError } from 'zod';

// Helper function to recursively convert Firestore Timestamps to ISO strings
function serializeFirestoreTimestamps(data: any): any {
  if (!data) return data;
  
  // Check for Firestore Timestamp-like objects which have a toDate method
  if (typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }
  
  // If it's an array, recurse on each element
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreTimestamps);
  }
  
  // If it's a plain object, recurse on each value
  if (typeof data === 'object' && data !== null && !Buffer.isBuffer(data)) {
    const res: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        res[key] = serializeFirestoreTimestamps(data[key]);
      }
    }
    return res;
  }
  
  // Return primitive values as is
  return data;
}


async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !firestore || !auth) {
    return { uid: null, firestore: null, errorResponse: NextResponse.json({ error: 'Server configuration error.', details: error?.message }, { status: 503 }) };
  }

  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { uid: null, firestore, errorResponse: NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, firestore, errorResponse: null };
  } catch (error: any) {
    return { uid: null, firestore, errorResponse: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message }, { status: 401 }) };
  }
}

// Zod schema for validating the incoming preferences for a PUT request
const userPreferencesSchema = z.object({
  activeVehicleId: z.string().nullable().optional(),
  activeCaravanId: z.string().nullable().optional(),
  activeWdhId: z.string().nullable().optional(),
  dashboardLayout: z.array(z.string()).nullable().optional(),
  caravanWaterLevels: z.record(z.record(z.number())).nullable().optional(),
  caravanDefaultChecklists: z.any().optional(),
}).nonempty({ message: "Update object cannot be empty." });


// GET user preferences
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const userDocRef = firestore.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists()) {
      return NextResponse.json({}, { status: 200 });
    }

    const userData = userDocSnap.data();
    if (!userData) {
      console.warn(`User document for UID ${uid} exists but contains no data.`);
      return NextResponse.json({}, { status: 200 });
    }

    const serializableData = serializeFirestoreTimestamps(userData);
    
    return NextResponse.json(serializableData, { status: 200 });

  } catch (err: any) {
    console.error('Error fetching user preferences:', err);
    return NextResponse.json({ error: 'Failed to fetch user preferences.', details: err.message }, { status: 500 });
  }
}

// PUT (update) user preferences
export async function PUT(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});
  
  try {
    const body = await req.json();
    const parsedData = userPreferencesSchema.parse(body);

    const userDocRef = firestore.collection('users').doc(uid);
    
    const updateData: Partial<UserProfile> = {
      ...parsedData,
      updatedAt: new Date().toISOString(),
    };
    
    await userDocRef.set(updateData, { merge: true });
    
    return NextResponse.json({ message: 'User preferences updated successfully.', preferences: updateData }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating user preferences:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid preferences data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update user preferences.', details: err.message }, { status: 500 });
  }
}
