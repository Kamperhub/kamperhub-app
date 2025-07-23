
// src/app/api/caravans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import { z, ZodError } from 'zod';
import type admin from 'firebase-admin';

// A robust replacer function for JSON.stringify to handle Firestore Timestamps.
const firestoreTimestampReplacer = (key: any, value: any) => {
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    return value;
};

// Helper function to create a clean, JSON-safe object.
const sanitizeData = (data: any) => {
    const jsonString = JSON.stringify(data, firestoreTimestampReplacer);
    return JSON.parse(jsonString);
};

async function verifyUserAndGetInstances(req: NextRequest): Promise<{ uid: string; firestore: admin.firestore.Firestore; }> {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    throw new Error('Server configuration error.');
  }

  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header.');
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, firestore };
  } catch (error: any) {
    throw new Error('Unauthorized: Invalid ID token.');
  }
}

// Zod schemas for nested objects
const storageLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Location name is required"),
  longitudinalPosition: z.enum(['front-of-axles', 'over-axles', 'rear-of-axles']),
  lateralPosition: z.enum(['left', 'center', 'right']),
  distanceFromAxleCenterMm: z.coerce.number().optional().nullable(),
  distanceFromCenterlineMm: z.coerce.number().optional().nullable(),
  heightFromGroundMm: z.coerce.number().optional().nullable(),
  maxWeightCapacityKg: z.coerce.number().optional().nullable(),
});

const waterTankSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tank name is required"),
  type: z.enum(['fresh', 'grey', 'black']),
  capacityLitres: z.coerce.number().positive(),
  longitudinalPosition: z.enum(['front-of-axles', 'over-axles', 'rear-of-axles']),
  lateralPosition: z.enum(['left', 'center', 'right']),
  distanceFromAxleCenterMm: z.coerce.number().optional().nullable(),
});

const wdhSchema = z.object({
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


// Zod schema for creating a new caravan
const createCaravanSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 2),
  tareMass: z.coerce.number().positive(),
  atm: z.coerce.number().positive(),
  gtm: z.coerce.number().positive(),
  maxTowballDownload: z.coerce.number().positive(),
  numberOfAxles: z.coerce.number().int().min(1),
  axleGroupRating: z.coerce.number().positive("Axle Group Rating must be positive"),
  numberOfGasBottles: z.coerce.number().int().min(0).optional().nullable(),
  gasBottleCapacityKg: z.coerce.number().min(0).optional().nullable(),
  tyreSize: z.string().optional().nullable(),
  tyreLoadRating: z.coerce.number().optional().nullable(),
  tyreSpeedRating: z.string().optional().nullable(),
  recommendedTyrePressurePsi: z.coerce.number().optional().nullable(),
  wdh: wdhSchema.nullable().optional(),
  overallLength: z.coerce.number().optional().nullable(),
  bodyLength: z.coerce.number().optional().nullable(),
  overallHeight: z.coerce.number().optional().nullable(),
  hitchToAxleCenterDistance: z.coerce.number().optional().nullable(),
  interAxleSpacing: z.coerce.number().optional().nullable(),
  storageLocations: z.array(storageLocationSchema).optional(),
  waterTanks: z.array(waterTankSchema).optional(),
});

// Zod schema for updating an existing caravan (must include ID)
const updateCaravanSchema = createCaravanSchema.extend({
  id: z.string().min(1, "Caravan ID is required for updates"),
});

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in caravans route:', error);
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

// GET all caravans for the authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const caravansSnapshot = await firestore.collection('users').doc(uid).collection('caravans').get();
    const caravans = caravansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(Boolean);
    const sanitizedCaravans = sanitizeData(caravans);
    return NextResponse.json(sanitizedCaravans, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// POST a new caravan for the authenticated user
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = createCaravanSchema.parse(body);

    const newCaravanRef = firestore.collection('users').doc(uid).collection('caravans').doc();
    const newCaravan: StoredCaravan = {
      id: newCaravanRef.id,
      ...parsedData,
      storageLocations: parsedData.storageLocations || [],
      waterTanks: parsedData.waterTanks || [],
      wdh: parsedData.wdh || null,
      numberOfGasBottles: parsedData.numberOfGasBottles || null,
      gasBottleCapacityKg: parsedData.gasBottleCapacityKg || null,
    };
    
    await newCaravanRef.set(newCaravan);
    
    const sanitizedNewCaravan = sanitizeData(newCaravan);
    return NextResponse.json(sanitizedNewCaravan, { status: 201 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// PUT (update) an existing caravan for the authenticated user
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body: StoredCaravan = await req.json();
    const parsedData = updateCaravanSchema.parse(body);
    const { id, ...dataToUpdate } = parsedData;

    const caravanRef = firestore.collection('users').doc(uid).collection('caravans').doc(id);
    await caravanRef.update(dataToUpdate);
    
    const sanitizedParsedData = sanitizeData(parsedData);
    return NextResponse.json({ message: 'Caravan updated successfully.', caravan: sanitizedParsedData }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// DELETE a caravan for the authenticated user
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
    }
    
    await firestore.collection('users').doc(uid).collection('caravans').doc(id).delete();
    
    return NextResponse.json({ message: 'Caravan deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
