// src/app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { LoggedTrip } from '@/types/tripplanner';
import type { Journey } from '@/types/journey';
import { z, ZodError } from 'zod';
import type { firestore } from 'firebase-admin';
import { decode, encode } from '@googlemaps/polyline-codec';

async function verifyUserAndGetInstances(req: NextRequest): Promise<{ uid: string; firestore: firestore.Firestore; }> {
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

// Centralized function to calculate and save the master polyline for a journey
async function recalculateAndSaveMasterPolyline(journeyId: string, userId: string, db: firestore.Firestore, transaction?: firestore.Transaction) {
    console.log(`[Polyline] Recalculating for Journey ID: ${journeyId}`);
    const journeyRef = db.collection('users').doc(userId).collection('journeys').doc(journeyId);
    
    let journeyDoc;
    if (transaction) {
        journeyDoc = await transaction.get(journeyRef);
    } else {
        journeyDoc = await journeyRef.get();
    }
    

    if (!journeyDoc.exists) {
        console.warn(`[Polyline] Journey ${journeyId} not found for recalculation.`);
        return;
    }

    const journeyData = journeyDoc.data() as Journey;
    const tripIds = journeyData.tripIds || [];

    if (tripIds.length === 0) {
        console.log(`[Polyline] Journey ${journeyId} has no trips. Clearing master polyline.`);
        if(transaction) transaction.update(journeyRef, { masterPolyline: null });
        else await journeyRef.update({ masterPolyline: null });
        return;
    }

    const tripRefs = tripIds.map(id => db.collection('users').doc(userId).collection('trips').doc(id));
    
    const tripDocs = await (transaction ? Promise.all(tripRefs.map(ref => transaction.get(ref))) : db.getAll(...tripRefs));

    const validTrips = tripDocs.map(doc => doc.data() as LoggedTrip).filter(trip => trip && trip.routeDetails?.polyline);

    validTrips.sort((a, b) => {
        const dateA = a.plannedStartDate ? new Date(a.plannedStartDate).getTime() : 0;
        const dateB = b.plannedStartDate ? new Date(b.plannedStartDate).getTime() : 0;
        return dateA - dateB;
    });

    const allCoordinates: [number, number][] = [];
    validTrips.forEach(trip => {
        if (trip.routeDetails?.polyline) {
            try {
                const decodedPath = decode(trip.routeDetails.polyline, 5);
                allCoordinates.push(...decodedPath);
            } catch (e) {
                console.error(`[Polyline] Could not decode polyline for trip ${trip.id}:`, e);
            }
        }
    });

    const masterPolyline = allCoordinates.length > 0 ? encode(allCoordinates, 5) : null;
    console.log(`[Polyline] Saving new master polyline for Journey ${journeyId}. Length: ${masterPolyline?.length || 0}`);
    
    if(transaction) transaction.update(journeyRef, { masterPolyline });
    else await journeyRef.update({ masterPolyline });
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

const fuelStationSchema = z.object({
    name: z.string(),
    location: latLngSchema,
});

const routeDetailsSchema = z.object({
  distance: z.object({ text: z.string(), value: z.number() }),
  duration: z.object({ text: z.string(), value: z.number() }),
  startLocation: latLngSchema.optional().nullable(),
  endLocation: latLngSchema.optional().nullable(),
  polyline: z.string().optional().nullable(),
  warnings: z.array(z.string()).optional().nullable(),
  tollInfo: z.object({ text: z.string(), value: z.number() }).nullable().optional(),
  fuelStations: z.array(fuelStationSchema).optional(),
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


const handleApiError = (error: any): NextResponse => {
  console.error('API Error in trips route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

// GET all trips for the authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const tripsSnapshot = await firestore.collection('users').doc(uid).collection('trips').get();
    const trips: LoggedTrip[] = [];
    tripsSnapshot.forEach(doc => {
      if (doc.exists) {
        trips.push(doc.data() as LoggedTrip);
      }
    });
    return NextResponse.json(trips, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// POST a new trip for the authenticated user
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
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
            transaction.update(journeyRef, { 
              tripIds: firestore.FieldValue.arrayUnion(newTrip.id) 
            });
            transaction.set(newTripRef, newTrip);
        });
        await recalculateAndSaveMasterPolyline(newTrip.journeyId, uid, firestore);
    } else {
      await newTripRef.set(newTrip);
    }
    
    return NextResponse.json(newTrip, { status: 201 });

  } catch (err: any) {
    return handleApiError(err);
  }
}

// PUT (update) an existing trip for the authenticated user
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = updateTripSchema.parse(body);
    const { id: tripId, ...updateData } = parsedData;

    const tripRef = firestore.collection('users').doc(uid).collection('trips').doc(tripId);
    let journeysToUpdate: string[] = [];
    let journeyNeedsRecalculation = false;

    await firestore.runTransaction(async (transaction) => {
        const tripDoc = await transaction.get(tripRef);
        if (!tripDoc.exists) {
            throw new Error("Trip not found.");
        }
        
        const oldTripData = tripDoc.data() as LoggedTrip;
        const oldJourneyId = oldTripData.journeyId;
        const newJourneyId = "journeyId" in updateData ? updateData.journeyId : oldJourneyId;

        if (oldJourneyId !== newJourneyId) {
            if (oldJourneyId) {
                const oldJourneyRef = firestore.collection('users').doc(uid).collection('journeys').doc(oldJourneyId);
                transaction.update(oldJourneyRef, {
                    tripIds: firestore.FieldValue.arrayRemove(tripId)
                });
                journeysToUpdate.push(oldJourneyId);
            }
            if (newJourneyId) {
                const newJourneyRef = firestore.collection('users').doc(uid).collection('journeys').doc(newJourneyId);
                transaction.update(newJourneyRef, {
                    tripIds: firestore.FieldValue.arrayUnion(tripId)
                });
                journeysToUpdate.push(newJourneyId);
            }
        } else if (newJourneyId) {
            journeysToUpdate.push(newJourneyId);
        }

        const finalUpdateData = { ...updateData, updatedAt: new Date().toISOString() };
        transaction.set(tripRef, finalUpdateData, { merge: true });

        // Check if route has changed
        if (updateData.routeDetails?.polyline !== oldTripData.routeDetails?.polyline || updateData.plannedStartDate !== oldTripData.plannedStartDate) {
            journeyNeedsRecalculation = true;
        }
    });
    
    // After transaction, run recalculations
    if (journeyNeedsRecalculation) {
      for (const journeyId of [...new Set(journeysToUpdate)]) {
        if(journeyId) {
          await recalculateAndSaveMasterPolyline(journeyId, uid, firestore);
        }
      }
    }

    const updatedDoc = await tripRef.get();
    const updatedTrip = updatedDoc.data() as LoggedTrip;

    return NextResponse.json({ message: 'Trip updated successfully.', trip: updatedTrip }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

// DELETE a trip for the authenticated user
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { id: tripId } = await req.json();
    
    if (!tripId || typeof tripId !== 'string') {
      return NextResponse.json({ error: 'Trip ID is required in the request body.' }, { status: 400 });
    }
    
    const tripDocRef = firestore.collection('users').doc(uid).collection('trips').doc(tripId);
    const packingListDocRef = firestore.collection('users').doc(uid).collection('packingLists').doc(tripId);
    let journeyToUpdate: string | null = null;

    await firestore.runTransaction(async (transaction) => {
        const tripDoc = await transaction.get(tripDocRef);
        if (!tripDoc.exists) return;
        
        const tripData = tripDoc.data() as LoggedTrip;
        journeyToUpdate = tripData.journeyId || null;

        if (journeyToUpdate) {
            const journeyRef = firestore.collection('users').doc(uid).collection('journeys').doc(journeyToUpdate);
            transaction.update(journeyRef, {
                tripIds: firestore.FieldValue.arrayRemove(tripId)
            });
        }
        
        transaction.delete(tripDocRef);
        transaction.delete(packingListDocRef);
    });
    
    if (journeyToUpdate) {
        await recalculateAndSaveMasterPolyline(journeyToUpdate, uid, firestore);
    }
    
    return NextResponse.json({ message: 'Trip and its associated packing list deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
