
// src/app/api/wdhs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore, firebaseAdminInitError } from '@/lib/firebase-admin';
import type { WDHFormData, StoredWDH } from '@/types/wdh';
import { z, ZodError } from 'zod';

// Zod schema for creating a new WDH
const createWdhSchema = z.object({
  name: z.string().min(1, "WDH Name/Model is required"),
  type: z.string().min(1, "WDH Type is required"),
  maxCapacityKg: z.coerce.number().positive("Max Capacity must be a positive number"),
  minCapacityKg: z.coerce.number().min(0).optional().nullable(),
  hasIntegratedSwayControl: z.boolean().default(false),
  swayControlType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(data => {
  if (data.minCapacityKg != null && data.maxCapacityKg != null && data.minCapacityKg > data.maxCapacityKg) {
    return false;
  }
  return true;
}, {
  message: "Min capacity cannot be greater than max capacity.",
  path: ["minCapacityKg"],
});

// Zod schema for updating an existing WDH
const updateWdhSchema = createWdhSchema.extend({
  id: z.string().min(1, "WDH ID is required for updates"),
});

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

// GET all WDHs for the authenticated user
export async function GET(req: NextRequest) {
  if (firebaseAdminInitError) {
    console.error('API Route Error: Firebase Admin SDK failed to initialize.', firebaseAdminInitError);
    return NextResponse.json({ 
      error: 'Server configuration error: The connection to the database failed to initialize. Please check the server logs for details.',
      details: firebaseAdminInitError.message
    }, { status: 503 });
  }
   if (!adminFirestore || !admin.auth) {
    console.error('API Error: Admin SDK not properly initialized. Firestore or Auth service is unavailable.');
    return NextResponse.json({ error: 'Server configuration error: Admin services are not available.' }, { status: 503 });
  }
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const wdhsSnapshot = await adminFirestore.collection('users').doc(uid).collection('wdhs').get();
    const wdhs = wdhsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoredWDH[];
    return NextResponse.json(wdhs, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching WDHs:', err);
    return NextResponse.json({ error: 'Failed to fetch WDHs.', details: err.message }, { status: 500 });
  }
}

// POST a new WDH for the authenticated user
export async function POST(req: NextRequest) {
  if (firebaseAdminInitError) {
    console.error('API Route Error: Firebase Admin SDK failed to initialize.', firebaseAdminInitError);
    return NextResponse.json({ 
      error: 'Server configuration error: The connection to the database failed to initialize. Please check the server logs for details.',
      details: firebaseAdminInitError.message
    }, { status: 503 });
  }
   if (!adminFirestore || !admin.auth) {
    console.error('API Error: Admin SDK not properly initialized. Firestore or Auth service is unavailable.');
    return NextResponse.json({ error: 'Server configuration error: Admin services are not available.' }, { status: 503 });
  }
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const parsedData = createWdhSchema.parse(body);

    const newWdhRef = adminFirestore.collection('users').doc(uid).collection('wdhs').doc();
    const newWdh: StoredWDH = {
      id: newWdhRef.id,
      ...parsedData,
    };
    
    await newWdhRef.set(newWdh);
    
    return NextResponse.json(newWdh, { status: 201 });

  } catch (err: any) {
    console.error('Error creating WDH:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid WDH data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create WDH.', details: err.message }, { status: 500 });
  }
}

// PUT (update) an existing WDH for the authenticated user
export async function PUT(req: NextRequest) {
  if (firebaseAdminInitError) {
    console.error('API Route Error: Firebase Admin SDK failed to initialize.', firebaseAdminInitError);
    return NextResponse.json({ 
      error: 'Server configuration error: The connection to the database failed to initialize. Please check the server logs for details.',
      details: firebaseAdminInitError.message
    }, { status: 503 });
  }
   if (!adminFirestore || !admin.auth) {
    console.error('API Error: Admin SDK not properly initialized. Firestore or Auth service is unavailable.');
    return NextResponse.json({ error: 'Server configuration error: Admin services are not available.' }, { status: 503 });
  }
  const { uid, error } = await verifyUser(req);
  if (error) return error;
  
  try {
    const body: StoredWDH = await req.json();
    const parsedData = updateWdhSchema.parse(body);

    const wdhRef = adminFirestore.collection('users').doc(uid).collection('wdhs').doc(parsedData.id);
    await wdhRef.set(parsedData, { merge: true });
    
    return NextResponse.json({ message: 'WDH updated successfully.', wdh: parsedData }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating WDH:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid WDH data for update.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update WDH.', details: err.message }, { status: 500 });
  }
}

// DELETE a WDH for the authenticated user
export async function DELETE(req: NextRequest) {
  if (firebaseAdminInitError) {
    console.error('API Route Error: Firebase Admin SDK failed to initialize.', firebaseAdminInitError);
    return NextResponse.json({ 
      error: 'Server configuration error: The connection to the database failed to initialize. Please check the server logs for details.',
      details: firebaseAdminInitError.message
    }, { status: 503 });
  }
   if (!adminFirestore || !admin.auth) {
    console.error('API Error: Admin SDK not properly initialized. Firestore or Auth service is unavailable.');
    return NextResponse.json({ error: 'Server configuration error: Admin services are not available.' }, { status: 503 });
  }
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'WDH ID is required.' }, { status: 400 });
    }
    
    await adminFirestore.collection('users').doc(uid).collection('wdhs').doc(id).delete();
    
    return NextResponse.json({ message: 'WDH deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting WDH:', err);
    return NextResponse.json({ error: 'Failed to delete WDH.', details: err.message }, { status: 500 });
  }
}
