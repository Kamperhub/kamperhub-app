
// src/app/api/user-preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';
import { z, ZodError } from 'zod';

// Helper to verify user and get UID
async function verifyUser(req: NextRequest): Promise<{ uid: string; error?: NextResponse }> {
  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', error);
    console.error('Firebase ID token verification error details:', {
        message: error.message,
        code: error.code, // This can be very informative
    });
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message, errorCode: error.code }, { status: 401 }) };
  }
}

// Zod schema for validating the incoming preferences for a PUT request
// This only includes fields we want to be updatable through this endpoint.
const userPreferencesSchema = z.object({
  activeVehicleId: z.string().nullable().optional(),
  activeCaravanId: z.string().nullable().optional(),
  activeWdhId: z.string().nullable().optional(),
  dashboardLayout: z.array(z.string()).nullable().optional(),
  caravanWaterLevels: z.record(z.record(z.number())).nullable().optional(),
  caravanDefaultChecklists: z.any().optional(), // Allow any for now, since it's complex and not the focus of this endpoint
}).nonempty({ message: "Update object cannot be empty." });


// GET user preferences
export async function GET(req: NextRequest) {
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const userDocRef = adminFirestore.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists()) {
      return NextResponse.json({}, { status: 200 }); // Return empty object if no profile/preferences exist yet
    }

    const userData = userDocSnap.data() as UserProfile;
    
    // Extract only the preference fields
    const preferences = {
      activeVehicleId: userData.activeVehicleId || null,
      activeCaravanId: userData.activeCaravanId || null,
      activeWdhId: userData.activeWdhId || null,
      dashboardLayout: userData.dashboardLayout || null,
      caravanWaterLevels: userData.caravanWaterLevels || null,
      caravanDefaultChecklists: userData.caravanDefaultChecklists || null,
    };

    return NextResponse.json(preferences, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching user preferences:', err);
    return NextResponse.json({ error: 'Failed to fetch user preferences.', details: err.message }, { status: 500 });
  }
}

// PUT (update) user preferences
export async function PUT(req: NextRequest) {
  const { uid, error } = await verifyUser(req);
  if (error) return error;
  
  try {
    const body = await req.json();
    const parsedData = userPreferencesSchema.parse(body);

    const userDocRef = adminFirestore.collection('users').doc(uid);
    
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
