
// src/app/api/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { VehicleFormData, StoredVehicle } from '@/types/vehicle';
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

// Zod schema for validating a new vehicle (doesn't have an ID yet)
const createVehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 2),
  gvm: z.coerce.number().positive("GVM must be a positive number"),
  gcm: z.coerce.number().positive("GCM must be a positive number"),
  maxTowCapacity: z.coerce.number().positive("Max Towing Capacity must be a positive number"),
  maxTowballMass: z.coerce.number().positive("Max Towball Mass must be a positive number"),
  fuelEfficiency: z.coerce.number().min(0.1, "Fuel efficiency must be a positive number"),
  kerbWeight: z.coerce.number().min(1).optional().nullable(),
  frontAxleLimit: z.coerce.number().min(1).optional().nullable(),
  rearAxleLimit: z.coerce.number().min(1).optional().nullable(),
  wheelbase: z.coerce.number().min(1).optional().nullable(),
  overallHeight: z.coerce.number().min(1).optional().nullable(),
  recommendedTyrePressureUnladenPsi: z.coerce.number().min(0).optional().nullable(),
  recommendedTyrePressureLadenPsi: z.coerce.number().min(0).optional().nullable(),
  storageLocations: z.array(z.any()).optional(), // Basic check, could be more detailed
  brakeControllerNotes: z.string().optional().nullable(),
});

// Zod schema for validating an existing vehicle update (must have an ID)
const updateVehicleSchema = createVehicleSchema.extend({
  id: z.string().min(1, "Vehicle ID is required for updates"),
});

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in vehicles route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

// GET all vehicles for the authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const vehiclesSnapshot = await firestore.collection('users').doc(uid).collection('vehicles').get();
    const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(Boolean);
    const sanitizedVehicles = sanitizeData(vehicles);
    return NextResponse.json(sanitizedVehicles, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// POST a new vehicle for the authenticated user
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = createVehicleSchema.parse(body);

    const newVehicleRef = firestore.collection('users').doc(uid).collection('vehicles').doc();
    const newVehicle: StoredVehicle = {
      id: newVehicleRef.id,
      ...parsedData,
      brakeControllerNotes: parsedData.brakeControllerNotes || null,
      kerbWeight: parsedData.kerbWeight || null,
      frontAxleLimit: parsedData.frontAxleLimit || null,
      rearAxleLimit: parsedData.rearAxleLimit || null,
      wheelbase: parsedData.wheelbase || null,
      overallHeight: parsedData.overallHeight || null,
      recommendedTyrePressureLadenPsi: parsedData.recommendedTyrePressureLadenPsi || null,
      recommendedTyrePressureUnladenPsi: parsedData.recommendedTyrePressureUnladenPsi || null,
    };
    
    await newVehicleRef.set(newVehicle);
    
    const sanitizedNewVehicle = sanitizeData(newVehicle);
    return NextResponse.json(sanitizedNewVehicle, { status: 201 });

  } catch (err: any) {
    return handleApiError(err);
  }
}

// PUT (update) an existing vehicle for the authenticated user
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body: StoredVehicle = await req.json();
    const parsedData = updateVehicleSchema.parse(body);

    const vehicleRef = firestore.collection('users').doc(uid).collection('vehicles').doc(parsedData.id);
    await vehicleRef.set(parsedData, { merge: true });
    
    const sanitizedParsedData = sanitizeData(parsedData);
    return NextResponse.json({ message: 'Vehicle updated successfully.', vehicle: sanitizedParsedData }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// DELETE a vehicle for the authenticated user
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Vehicle ID is required.' }, { status: 400 });
    }
    
    await firestore.collection('users').doc(uid).collection('vehicles').doc(id).delete();
    
    return NextResponse.json({ message: 'Vehicle deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
