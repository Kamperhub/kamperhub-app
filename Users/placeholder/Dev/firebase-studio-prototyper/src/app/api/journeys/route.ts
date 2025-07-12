// src/app/api/journeys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { Journey } from '@/types/journey';
import type { LoggedTrip } from '@/types/tripplanner';
import { z, ZodError } from 'zod';
import { decode, encode } from '@googlemaps/polyline-codec';
import type { firestore } from 'firebase-admin';

async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    return { uid: null, firestore: null, errorResponse: NextResponse.json({ error: 'Server configuration error.', details: error?.message }, { status: 503 }) };
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { uid: null, firestore, errorResponse: NextResponse.json({ error: 'Unauthorized: Missing Authorization header.' }, { status: 401 }) };
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, firestore, errorResponse: null };
  } catch (error: any) {
    return { uid: null, firestore, errorResponse: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message }, { status: 401 }) };
  }
}

async function recalculateAndSaveMasterPolyline(journeyId: string, userId: string, db: firestore.Firestore) {
    const journeyRef = db.collection('users').doc(userId).collection('journeys').doc(journeyId);
    const journeyDoc = await journeyRef.get();
    if (!journeyDoc.exists) {
        console.warn(`Journey ${journeyId} not found for recalculation.`);
        return;
    }

    const journeyData = journeyDoc.data() as Journey;
    const tripIds = journeyData.tripIds || [];

    if (tripIds.length === 0) {
        await journeyRef.update({ masterPolyline: null });
        return;
    }

    const tripRefs = tripIds.map(id => db.collection('users').doc(userId).collection('trips').doc(id));
    const tripDocs = await db.getAll(...tripRefs);
    const validTrips = tripDocs.map(doc => doc.data() as LoggedTrip).filter(trip => trip && trip.routeDetails?.polyline);

    // Ensure trips are sorted by their planned start date to create a logical path
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
                console.error(`Could not decode polyline for trip ${trip.id}:`, e);
            }
        }
    });

    const masterPolyline = allCoordinates.length > 0 ? encode(allCoordinates, 5) : null;
    await journeyRef.update({ masterPolyline });
}

const createJourneySchema = z.object({
  name: z.string().min(1, "Journey name is required"),
  description: z.string().optional().nullable(),
});

const updateJourneySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Journey name is required").optional(),
  description: z.string().optional().nullable(),
  tripIds: z.array(z.string()).optional(),
});

// GET all journeys for the user
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse) return errorResponse;
  if (!uid || !firestore) return NextResponse.json({ error: 'Server or authentication instance is not available.' }, { status: 503 });


  try {
    const journeysSnapshot = await firestore.collection('users').doc(uid).collection('journeys').orderBy('createdAt', 'desc').get();
    const journeys = journeysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Journey[];
    return NextResponse.json(journeys, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}

// POST a new journey
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse) return errorResponse;
  if (!uid || !firestore) return NextResponse.json({ error: 'Server or authentication instance is not available.' }, { status: 503 });


  try {
    const body = await req.json();
    const parsedData = createJourneySchema.parse(body);
    
    const newJourneyRef = firestore.collection('users').doc(uid).collection('journeys').doc();
    const now = new Date().toISOString();
    const newJourney: Journey = {
      id: newJourneyRef.id,
      ...parsedData,
      tripIds: [],
      masterPolyline: null,
      createdAt: now,
      updatedAt: now,
    };

    await newJourneyRef.set(newJourney);
    return NextResponse.json(newJourney, { status: 201 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create journey', details: error.message }, { status: 500 });
  }
}

// PUT (update) an existing journey
export async function PUT(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse) return errorResponse;
  if (!uid || !firestore) return NextResponse.json({ error: 'Server or authentication instance is not available.' }, { status: 503 });


  try {
    const body = await req.json();
    const parsedData = updateJourneySchema.parse(body);
    const { id, ...updateData } = parsedData;

    const journeyRef = firestore.collection('users').doc(uid).collection('journeys').doc(id);
    
    await journeyRef.update({
        ...updateData,
        updatedAt: new Date().toISOString(),
    });
    
    // If tripIds were part of the update, recalculate the master polyline
    if (updateData.tripIds) {
      await recalculateAndSaveMasterPolyline(id, uid, firestore);
    }

    const updatedDoc = await journeyRef.get();
    return NextResponse.json(updatedDoc.data(), { status: 200 });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update journey', details: error.message }, { status: 500 });
  }
}

// DELETE a journey
export async function DELETE(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse) return errorResponse;
    if (!uid || !firestore) return NextResponse.json({ error: 'Server or authentication instance is not available.' }, { status: 503 });


    try {
        const { id } = await req.json();
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'Journey ID is required.' }, { status: 400 });
        }
        
        await firestore.collection('users').doc(uid).collection('journeys').doc(id).delete();
        
        // Note: This does not unlink trips from the journey. A more robust solution
        // might involve a transaction to loop through trips and set journeyId to null.
        
        return NextResponse.json({ message: 'Journey deleted successfully.' }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
    }
}
