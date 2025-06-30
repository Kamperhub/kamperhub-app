// src/app/api/caravans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
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
  if (error || !auth || !firestore) {
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
  capacityLiters: z.coerce.number().positive(),
  longitudinalPosition: z.enum(['front-of-axles', 'over-axles', 'rear-of-axles']),
  lateralPosition: z.enum(['left', 'center', 'right']),
  distanceFromAxleCenterMm: z.coerce.number().optional().nullable(),
});

const caravanDiagramSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Diagram name is required"),
  url: z.string().url("Must be a valid URL"),
  notes: z.string().optional().nullable(),
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
  diagrams: z.array(caravanDiagramSchema).optional(),
});

// Zod schema for updating an existing caravan (must include ID)
const updateCaravanSchema = createCaravanSchema.extend({
  id: z.string().min(1, "Caravan ID is required for updates"),
});

// GET all caravans for the authenticated user
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const caravansSnapshot = await firestore.collection('users').doc(uid).collection('caravans').get();
    const caravans = caravansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(Boolean);
    const sanitizedCaravans = sanitizeData(caravans);
    return NextResponse.json(sanitizedCaravans, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching caravans:', err);
    return NextResponse.json({ error: 'Failed to fetch caravans.', details: err.message }, { status: 500 });
  }
}

// POST a new caravan for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const body = await req.json();
    const parsedData = createCaravanSchema.parse(body);

    const newCaravanRef = firestore.collection('users').doc(uid).collection('caravans').doc();
    const newCaravan: StoredCaravan = {
      id: newCaravanRef.id,
      ...parsedData,
      storageLocations: parsedData.storageLocations || [],
      waterTanks: parsedData.waterTanks || [],
      diagrams: parsedData.diagrams || [],
      wdh: parsedData.wdh || null,
      numberOfGasBottles: parsedData.numberOfGasBottles || null,
      gasBottleCapacityKg: parsedData.gasBottleCapacityKg || null,
    };
    
    await newCaravanRef.set(newCaravan);
    
    const sanitizedNewCaravan = sanitizeData(newCaravan);
    return NextResponse.json(sanitizedNewCaravan, { status: 201 });

  } catch (err: any) {
    console.error('Error creating caravan:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid caravan data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create caravan.', details: err.message }, { status: 500 });
  }
}

// PUT (update) an existing caravan for the authenticated user
export async function PUT(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});
  
  try {
    const body: StoredCaravan = await req.json();
    const parsedData = updateCaravanSchema.parse(body);

    const caravanRef = firestore.collection('users').doc(uid).collection('caravans').doc(parsedData.id);
    await caravanRef.set(parsedData, { merge: true });
    
    const sanitizedParsedData = sanitizeData(parsedData);
    return NextResponse.json({ message: 'Caravan updated successfully.', caravan: sanitizedParsedData }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating caravan:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid caravan data for update.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update caravan.', details: err.message }, { status: 500 });
  }
}

// DELETE a caravan for the authenticated user
export async function DELETE(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
    }
    
    await firestore.collection('users').doc(uid).collection('caravans').doc(id).delete();
    
    return NextResponse.json({ message: 'Caravan deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting caravan:', err);
    return NextResponse.json({ error: 'Failed to delete caravan.', details: err.message }, { status: 500 });
  }
}
