
// src/app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { LoggedTrip } from '@/types/tripplanner';
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

// Zod schemas for validation
const budgetCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  budgetedAmount: z.coerce.number().min(0, "Budgeted amount must be non-negative"),
});

const expenseSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.string().datetime({ message: "Expense date must be a valid ISO date string" }),
  timestamp: z.string().datetime(),
});

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

const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
});

const tripChecklistSetSchema = z.object({
  preDeparture: z.array(checklistItemSchema),
  campsiteSetup: z.array(checklistItemSchema),
  packDown: z.array(checklistItemSchema),
});

const occupantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Adult', 'Child', 'Infant', 'Pet']),
  age: z.coerce.number().int().min(0).optional().nullable(),
  weight: z.coerce.number().min(0, "Weight must be a non-negative number."),
  notes: z.string().optional().nullable(),
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
  checklists: tripChecklistSetSchema.optional(),
  budget: z.array(budgetCategorySchema).optional(),
  occupants: z.array(occupantSchema).min(1, "At least one occupant (e.g., the driver) is required.").optional(),
});

const updateTripSchema = createTripSchema.extend({
  id: z.string().min(1, "Trip ID is required for updates"),
  timestamp: z.string().datetime(),
  expenses: z.array(expenseSchema).optional(),
});


// GET all trips for the authenticated user
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const tripsSnapshot = await firestore.collection('users').doc(uid).collection('trips').get();
    const trips = tripsSnapshot.docs.map(doc => doc.data()).filter(Boolean);
    const sanitizedTrips = sanitizeData(trips);
    return NextResponse.json(sanitizedTrips, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching trips:', err);
    return NextResponse.json({ error: 'Failed to fetch trips.', details: err.message }, { status: 500 });
  }
}

// POST a new trip for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const body = await req.json();
    const parsedData = createTripSchema.parse(body);

    const newTripRef = firestore.collection('users').doc(uid).collection('trips').doc();
    const newTrip: LoggedTrip = {
      id: newTripRef.id,
      timestamp: new Date().toISOString(),
      ...parsedData,
      expenses: [],
      budget: parsedData.budget || [],
      occupants: parsedData.occupants || [],
    };
    
    await newTripRef.set(newTrip);
    
    const sanitizedNewTrip = sanitizeData(newTrip);
    return NextResponse.json(sanitizedNewTrip, { status: 201 });

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
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});
  
  try {
    const body = await req.json();
    const parsedData = updateTripSchema.parse(body);

    const tripRef = firestore.collection('users').doc(uid).collection('trips').doc(parsedData.id);
    await tripRef.set(parsedData, { merge: true });
    
    const sanitizedParsedData = sanitizeData(parsedData);
    return NextResponse.json({ message: 'Trip updated successfully.', trip: sanitizedParsedData }, { status: 200 });
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
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Trip ID is required for deletion.' }, { status: 400 });
    }
    
    await firestore.collection('users').doc(uid).collection('trips').doc(id).delete();
    
    return NextResponse.json({ message: 'Trip deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error deleting trip:', err);
    return NextResponse.json({ error: 'Failed to delete trip.', details: err.message }, { status: 500 });
  }
}
