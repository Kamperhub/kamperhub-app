
// src/app/api/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore, firebaseAdminInitError } from '@/lib/firebase-admin';
import type { VehicleFormData, StoredVehicle } from '@/types/vehicle';
import { z, ZodError } from 'zod';

async function verifyUserAndSDK(req: NextRequest): Promise<{ uid?: string; errorResponse?: NextResponse }> {
  if (firebaseAdminInitError || !adminFirestore || !admin.auth()) {
    console.error('API Route Error: Firebase Admin SDK not available.', firebaseAdminInitError);
    return {
      errorResponse: NextResponse.json({
        error: 'Server configuration error: The connection to the database or authentication service is not available. Please check server logs for details about GOOGLE_APPLICATION_CREDENTIALS_JSON.',
        details: firebaseAdminInitError?.message || "Firebase Admin SDK services are not initialized."
      }, { status: 503 })
    };
  }
  
  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', { message: error.message, code: error.code });
    return { errorResponse: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message, errorCode: error.code }, { status: 401 }) };
  }
}

// Zod schema for validating a new vehicle (doesn't have an ID yet)
const createVehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 2),
  gvm: z.coerce.number().positive(),
  gcm: z.coerce.number().positive(),
  maxTowCapacity: z.coerce.number().positive(),
  maxTowballMass: z.coerce.number().positive(),
  fuelEfficiency: z.coerce.number().min(0.1),
  kerbWeight: z.coerce.number().min(1).optional().nullable(),
  frontAxleLimit: z.coerce.number().min(1).optional().nullable(),
  rearAxleLimit: z.coerce.number().min(1).optional().nullable(),
  wheelbase: z.coerce.number().min(1000).optional().nullable(),
  storageLocations: z.array(z.any()).optional(), // Basic check, could be more detailed
});

// Zod schema for validating an existing vehicle update (must have an ID)
const updateVehicleSchema = createVehicleSchema.extend({
  id: z.string().min(1, "Vehicle ID is required for updates"),
});

// GET all vehicles for the authenticated user
export async function GET(req: NextRequest) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;

  try {
    const vehiclesSnapshot = await adminFirestore!.collection('users').doc(uid!).collection('vehicles').get();
    const vehicles = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StoredVehicle[];
    return NextResponse.json(vehicles, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching vehicles:', err);
    return NextResponse.json({ error: 'Failed to fetch vehicles.', details: err.message }, { status: 500 });
  }
}

// POST a new vehicle for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const parsedData = createVehicleSchema.parse(body);

    const newVehicleRef = adminFirestore!.collection('users').doc(uid!).collection('vehicles').doc();
    const newVehicle: StoredVehicle = {
      id: newVehicleRef.id,
      ...parsedData,
    };
    
    await newVehicleRef.set(newVehicle);
    
    return NextResponse.json(newVehicle, { status: 201 });

  } catch (err: any) {
    console.error('Error creating vehicle:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid vehicle data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create vehicle.', details: err.message }, { status: 500 });
  }
}

// PUT (update) an existing vehicle for the authenticated user
export async function PUT(req: NextRequest) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;
  
  try {
    const body: StoredVehicle = await req.json();
    const parsedData = updateVehicleSchema.parse(body);

    const vehicleRef = adminFirestore!.collection('users').doc(uid!).collection('vehicles').doc(parsedData.id);
    await vehicleRef.set(parsedData, { merge: true }); // Use set with merge to update or create if not exists
    
    return NextResponse.json({ message: 'Vehicle updated successfully.', vehicle: parsedData }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating vehicle:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid vehicle data for update.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update vehicle.', details: err.message }, { status: 500 });
  }
}

// DELETE a vehicle for the authenticated user
export async function DELETE(req: NextRequest) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Vehicle ID is required.' }, { status: 400 });
    }
    
    await adminFirestore!.collection('users').doc(uid!).collection('vehicles').doc(id).delete();
    
    return NextResponse.json({ message: 'Vehicle deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting vehicle:', err);
    return NextResponse.json({ error: 'Failed to delete vehicle.', details: err.message }, { status: 500 });
  }
}
