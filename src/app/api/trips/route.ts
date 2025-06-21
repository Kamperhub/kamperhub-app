// src/app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore } from '@/lib/firebase-admin';
import type { LoggedTrip } from '@/types/tripplanner';
import { z, ZodError } from 'zod';

// Helper for user verification
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
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message }, { status: 401 }) };
  }
}

// Zod schemas for validation
const latLngSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const waypointSchema = z.object({
  address: z.string(),
  location: latLngSchema.optional(),
});

const routeDetailsSchema = z.object({
  distance: z.string(),
  duration: z.string(),
  distanceValue: z.number(),
  startAddress: z.string().optional(),
  endAddress: z.string().optional(),
  startLocation: latLngSchema.optional(),
  endLocation: latLngSchema.optional(),
});

const fuelEstimateSchema = z.object({
  fuelNeeded: z.string(),
  estimatedCost: z.string(),
});

const createTripSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  startLocationDisplay: z.string().min(1, "Start location is required"),
  endLocationDisplay: z.string().min(1, "End location is required"),
  waypoints: z.array(waypointSchema).optional(),
  fuelEfficiency: z.coerce.number().positive(),
  fuelPrice: z.coerce.number().positive(),
  routeDetails: routeDetailsSchema,
  fuelEstimate: fuelEstimateSchema.nullable(),
  plannedStartDate: z.string().datetime().nullable().optional(),
  plannedEndDate: z.string().datetime().nullable().optional(),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional().default(false),
});

const updateTripSchema = createTripSchema.extend({
  id: z.string().min(1, "Trip ID is required for updates"),
  timestamp: z.string().datetime(), // Keep timestamp for updates
});


// GET all trips for the authenticated user
export async function GET(req: NextRequest) {
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const tripsSnapshot = await adminFirestore.collection('users').doc(uid).collection('trips').get();
    const trips = tripsSnapshot.docs.map(doc => ({ ...doc.data() })) as LoggedTrip[];
    return NextResponse.json(trips, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching trips:', err);
    return NextResponse.json({ error: 'Failed to fetch trips.', details: err.message }, { status: 500 });
  }
}

// POST a new trip for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const parsedData = createTripSchema.parse(body);

    const newTripRef = adminFirestore.collection('users').doc(uid).collection('trips').doc();
    const newTrip: LoggedTrip = {
      id: newTripRef.id,
      timestamp: new Date().toISOString(),
      ...parsedData,
    };
    
    await newTripRef.set(newTrip);
    
    return NextResponse.json(newTrip, { status: 201 });

  } catch (err: any) {
    console.error('Error creating trip:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid trip data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create trip.', details: err.message }, { status: 500 });
  }
}

// PUT (update) an existing trip for the authenticated user
export async function PUT(req: NextRequest) {
  const { uid, error } = await verifyUser(req);
  if (error) return error;
  
  try {
    const body = await req.json();
    const parsedData = updateTripSchema.parse(body);

    const tripRef = adminFirestore.collection('users').doc(uid).collection('trips').doc(parsedData.id);
    await tripRef.set(parsedData, { merge: true });
    
    return NextResponse.json({ message: 'Trip updated successfully.', trip: parsedData }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating trip:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid trip data for update.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update trip.', details: err.message }, { status: 500 });
  }
}

// DELETE a trip for the authenticated user
export async function DELETE(req: NextRequest) {
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Trip ID is required for deletion.' }, { status: 400 });
    }
    
    await adminFirestore.collection('users').doc(uid).collection('trips').doc(id).delete();
    
    return NextResponse.json({ message: 'Trip deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting trip:', err);
    return NextResponse.json({ error: 'Failed to delete trip.', details: err.message }, { status: 500 });
  }
}
