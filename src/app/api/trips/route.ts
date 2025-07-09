
// src/app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { LoggedTrip } from '@/types/tripplanner';
import { z, ZodError } from 'zod';
import type admin from 'firebase-admin';

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

const routeDetailsSchema = z.object({
  distance: z.object({ text: z.string(), value: z.number() }),
  duration: z.object({ text: z.string(), value: z.number() }),
  startLocation: latLngSchema.optional().nullable(),
  endLocation: latLngSchema.optional().nullable(),
  polyline: z.string().optional().nullable(),
  warnings: z.array(z.string()).optional().nullable(),
  tollInfo: z.object({ text: z.string(), value: z.number() }).nullable().optional(),
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

const tripChecklistSetSchema = z.union([
  z.array(z.object({ // New stage-based format
    title: z.string(),
    items: z.array(checklistItemSchema),
  })),
  z.object({ // Old format for backward compatibility
    preDeparture: z.array(checklistItemSchema),
    campsiteSetup: z.array(checklistItemSchema),
    packDown: z.array(checklistItemSchema),
  })
]);


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
  fuelEfficiency: z.coerce.number().positive(),
  fuelPrice: z.coerce.number().positive(),
  routeDetails: routeDetailsSchema,
  fuelEstimate: fuelEstimateSchema.nullable(),
  plannedStartDate: z.string().datetime().nullable().optional(),
  plannedEndDate: z.string().datetime().nullable().optional(),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional().default(false),
  isVehicleOnly: z.boolean().optional().default(false),
  checklists: tripChecklistSetSchema.optional(),
  budget: z.array(budgetCategorySchema).optional(),
  expenses: z.array(expenseSchema).optional(),
  occupants: z.array(occupantSchema).min(1, "At least one occupant (e.g., the driver) is required.").optional(),
  activeCaravanIdAtTimeOfCreation: z.string().nullable().optional(),
  activeCaravanNameAtTimeOfCreation: z.string().nullable().optional(),
  journeyId: z.string().nullable().optional(),
});

// For PUT, make most fields optional but require the ID.
const updateTripSchema = createTripSchema.partial().extend({
  id: z.string().min(1, "Trip ID is required for updates"),
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

// GET all trips for the authenticated user
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  try {
    const tripsSnapshot = await firestore.collection('users').doc(uid).collection('trips').get();
    const trips: LoggedTrip[] = [];
    tripsSnapshot.forEach(doc => {
      if (doc.exists()) {
        trips.push(doc.data() as LoggedTrip);
      }
    });
    return NextResponse.json(trips, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// POST a new trip for the authenticated user
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  try {
    const body = await req.json();
    const parsedData = createTripSchema.parse(body);

    const newTripRef = firestore.collection('users').doc(uid).collection('trips').doc();
    const newTrip: LoggedTrip = {
      id: newTripRef.id,
      timestamp: new Date().toISOString(),
      ...parsedData,
      notes: parsedData.notes || null,
      isVehicleOnly: parsedData.isVehicleOnly || false,
      expenses: parsedData.expenses || [],
      budget: parsedData.budget || [],
      occupants: (parsedData.occupants || []).map(occ => ({
        ...occ,
        age: occ.age ?? null,
        notes: occ.notes ?? null,
      })),
      journeyId: parsedData.journeyId || null,
    };
    
    // If a journeyId is provided, update the journey as well in a transaction
    if (newTrip.journeyId) {
        const journeyRef = firestore.collection('users').doc(uid).collection('journeys').doc(newTrip.journeyId);
        await firestore.runTransaction(async (transaction) => {
            const journeyDoc = await transaction.get(journeyRef);
            if (!journeyDoc.exists) {
                throw new Error("Journey not found. Cannot associate trip.");
            }
            // Atomically add the new trip's ID to the journey's tripIds array
            transaction.update(journeyRef, { 
              tripIds: admin.firestore.FieldValue.arrayUnion(newTrip.id) 
            });
            // Create the new trip
            transaction.set(newTripRef, newTrip);
        });
    } else {
      // Just create the trip if no journey is associated
      await newTripRef.set(newTrip);
    }
    
    return NextResponse.json(newTrip, { status: 201 });

  } catch (err: any) {
    return handleApiError(err);
  }
}

// PUT (update) an existing trip for the authenticated user
export async function PUT(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;
  
  try {
    const body = await req.json();
    const parsedData = updateTripSchema.parse(body);
    const { id: tripId, ...updateData } = parsedData;

    const tripRef = firestore.collection('users').doc(uid).collection('trips').doc(tripId);

    await firestore.runTransaction(async (transaction) => {
        const tripDoc = await transaction.get(tripRef);
        if (!tripDoc.exists) {
            throw new Error("Trip not found.");
        }
        
        const oldTripData = tripDoc.data() as LoggedTrip;
        const oldJourneyId = oldTripData.journeyId;
        const newJourneyId = updateData.journeyId;

        // If journey assignment has changed, we need to update the journey documents
        if (oldJourneyId !== newJourneyId) {
            // Remove from old journey if it existed
            if (oldJourneyId) {
                const oldJourneyRef = firestore.collection('users').doc(uid).collection('journeys').doc(oldJourneyId);
                transaction.update(oldJourneyRef, {
                    tripIds: admin.firestore.FieldValue.arrayRemove(tripId)
                });
            }
            // Add to new journey if it exists
            if (newJourneyId) {
                const newJourneyRef = firestore.collection('users').doc(uid).collection('journeys').doc(newJourneyId);
                transaction.update(newJourneyRef, {
                    tripIds: admin.firestore.FieldValue.arrayUnion(tripId)
                });
            }
        }

        // Now update the trip document itself
        const finalUpdateData = {
          ...updateData,
          timestamp: new Date().toISOString(),
        };
        transaction.set(tripRef, finalUpdateData, { merge: true });
    });

    // Fetch the updated doc to return the full object
    const updatedDoc = await tripRef.get();
    const updatedTrip = updatedDoc.data() as LoggedTrip;

    return NextResponse.json({ message: 'Trip updated successfully.', trip: updatedTrip }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// DELETE a trip for the authenticated user
export async function DELETE(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  try {
    const { id: tripId } = await req.json();
    
    if (!tripId || typeof tripId !== 'string') {
      return NextResponse.json({ error: 'Trip ID is required in the request body.' }, { status: 400 });
    }
    
    const tripDocRef = firestore.collection('users').doc(uid).collection('trips').doc(tripId);
    const packingListDocRef = firestore.collection('users').doc(uid).collection('packingLists').doc(tripId);

    await firestore.runTransaction(async (transaction) => {
        const tripDoc = await transaction.get(tripDocRef);
        if (!tripDoc.exists) return; // If trip doesn't exist, nothing to do.
        
        const tripData = tripDoc.data() as LoggedTrip;

        // If the trip is part of a journey, remove its ID from the journey's list
        if (tripData.journeyId) {
            const journeyRef = firestore.collection('users').doc(uid).collection('journeys').doc(tripData.journeyId);
            transaction.update(journeyRef, {
                tripIds: admin.firestore.FieldValue.arrayRemove(tripId)
            });
        }
        
        // Delete the trip and its packing list
        transaction.delete(tripDocRef);
        transaction.delete(packingListDocRef); // This will succeed even if the packing list doc doesn't exist
    });
    
    return NextResponse.json({ message: 'Trip and its associated packing list deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
