
// src/app/api/caravans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import { z, ZodError } from 'zod';

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
  capacityLitres: z.coerce.number().positive(),
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

const handleApiError = (error: any) => {
  console.error('API Error:', error);
  let errorTitle = 'Internal Server Error';
  let errorDetails = 'An unexpected error occurred.';
  let statusCode = 500;

  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  
  if (error.code) {
      switch(error.code) {
          case 5: // NOT_FOUND
              errorTitle = 'Database Not Found';
              errorDetails = `The Firestore database 'kamperhubv2' could not be found. Please verify its creation in your Firebase project.`;
              statusCode = 500;
              break;
          case 16: // UNAUTHENTICATED
              errorTitle = 'Server Authentication Failed';
              errorDetails = `The server's credentials (GOOGLE_APPLICATION_CREDENTIALS_JSON) are invalid or lack permission for Firestore. Please check your setup.`;
              statusCode = 500;
              break;
          default:
              errorDetails = error.message;
              break;
      }
  } else {
    errorDetails = error.message;
  }

  return NextResponse.json({ error: errorTitle, details: errorDetails }, { status: statusCode });
};

// GET all caravans for the authenticated user
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  try {
    const caravansSnapshot = await firestore.collection('users').doc(uid).collection('caravans').get();
    const caravans = caravansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(Boolean);
    const sanitizedCaravans = sanitizeData(caravans);
    return NextResponse.json(sanitizedCaravans, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// POST a new caravan for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  try {
    const body = await req.json();
    const parsedData = createCaravanSchema.parse(body);

    const newCaravanRef = firestore.collection('users').doc(uid).collection('caravans').doc();
    const newCaravan: StoredCaravan = {
      id: newCaravanRef.id,
      ...parsedData,
      storageLocations: parsedData.storageLocations || [],
      waterTanks: parsedData.waterTanks || [],
      diagrams: (parsedData.diagrams || []).map(d => ({...d, notes: d.notes ?? undefined })),
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
export async function PUT(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;
  
  try {
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
export async function DELETE(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  try {
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
