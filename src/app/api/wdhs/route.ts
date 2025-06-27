
// src/app/api/wdhs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { WDHFormData, StoredWDH } from '@/types/wdh';
import { z, ZodError } from 'zod';

// A robust replacer function for JSON.stringify to handle Firestore Timestamps.
const firestoreTimestampReplacer = (key: any, value: any) => {
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    return value;
};

// Helper function to create a clean, JSON-safe object.
const sanitizeData = (data: any) => {
    const jsonString = JSON.stringify(data, firestoreTimestampReplacer);
    return JSON.parse(jsonString);
};

async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error) {
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


// GET all WDHs for the authenticated user
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const wdhsSnapshot = await firestore.collection('users').doc(uid).collection('wdhs').get();
    const wdhs = wdhsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(Boolean);
    const sanitizedWdhs = sanitizeData(wdhs);
    return NextResponse.json(sanitizedWdhs, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching WDHs:', err);
    return NextResponse.json({ error: 'Failed to fetch WDHs.', details: err.message }, { status: 500 });
  }
}

// POST a new WDH for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const body = await req.json();
    const parsedData = createWdhSchema.parse(body);

    const newWdhRef = firestore.collection('users').doc(uid).collection('wdhs').doc();
    const newWdh: StoredWDH = {
      id: newWdhRef.id,
      ...parsedData,
    };
    
    await newWdhRef.set(newWdh);
    
    const sanitizedNewWdh = sanitizeData(newWdh);
    return NextResponse.json(sanitizedNewWdh, { status: 201 });

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
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});
  
  try {
    const body: StoredWDH = await req.json();
    const parsedData = updateWdhSchema.parse(body);

    const wdhRef = firestore.collection('users').doc(uid).collection('wdhs').doc(parsedData.id);
    await wdhRef.set(parsedData, { merge: true });
    
    const sanitizedParsedData = sanitizeData(parsedData);
    return NextResponse.json({ message: 'WDH updated successfully.', wdh: sanitizedParsedData }, { status: 200 });
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
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'WDH ID is required.' }, { status: 400 });
    }
    
    await firestore.collection('users').doc(uid).collection('wdhs').doc(id).delete();
    
    return NextResponse.json({ message: 'WDH deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting WDH:', err);
    return NextResponse.json({ error: 'Failed to delete WDH.', details: err.message }, { status: 500 });
  }
}
