
// src/app/api/caravans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore, firebaseAdminInitError } from '@/lib/firebase-admin';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import { z, ZodError } from 'zod';

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
  associatedWdhId: z.string().optional().nullable(),
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

// GET all caravans for the authenticated user
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
    const caravansSnapshot = await adminFirestore.collection('users').doc(uid).collection('caravans').get();
    const caravans = caravansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoredCaravan[];
    return NextResponse.json(caravans, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching caravans:', err);
    return NextResponse.json({ error: 'Failed to fetch caravans.', details: err.message }, { status: 500 });
  }
}

// POST a new caravan for the authenticated user
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
    const parsedData = createCaravanSchema.parse(body);

    const newCaravanRef = adminFirestore.collection('users').doc(uid).collection('caravans').doc();
    const newCaravan: StoredCaravan = {
      id: newCaravanRef.id,
      ...parsedData,
      storageLocations: parsedData.storageLocations || [],
      waterTanks: parsedData.waterTanks || [],
      diagrams: parsedData.diagrams || [],
    };
    
    await newCaravanRef.set(newCaravan);
    
    return NextResponse.json(newCaravan, { status: 201 });

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
    const body: StoredCaravan = await req.json();
    const parsedData = updateCaravanSchema.parse(body);

    const caravanRef = adminFirestore.collection('users').doc(uid).collection('caravans').doc(parsedData.id);
    await caravanRef.set(parsedData, { merge: true }); // Use set with merge to update or create if not exists
    
    return NextResponse.json({ message: 'Caravan updated successfully.', caravan: parsedData }, { status: 200 });
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
      return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
    }
    
    await adminFirestore.collection('users').doc(uid).collection('caravans').doc(id).delete();
    
    return NextResponse.json({ message: 'Caravan deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting caravan:', err);
    return NextResponse.json({ error: 'Failed to delete caravan.', details: err.message }, { status: 500 });
  }
}
