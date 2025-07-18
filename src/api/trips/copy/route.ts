// src/app/api/trips/copy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { LoggedTrip } from '@/types/tripplanner';
import type { ChecklistItem, ChecklistStage } from '@/types/checklist';
import { z, ZodError } from 'zod';
import admin from 'firebase-admin';
import type { firestore } from 'firebase-admin';
import { decode, encode } from '@googlemaps/polyline-codec';
import type { Journey } from '@/types/journey';

// This function should be imported from the centralized location if needed.
// For now, we are placing it here temporarily for simplicity, assuming it's used
// in more than one trips-related endpoint. Ideally this would live in a shared lib.
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

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in trips/copy route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  if (error.message.includes('Unauthorized')) {
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
  if (error.message.includes('Server configuration error')) {
    return NextResponse.json({ error: 'Server configuration error', details: error.message }, { status: 503 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

const copyTripSchema = z.object({
  sourceTripId: z.string().min(1, "Source Trip ID is required"),
  destinationJourneyId: z.string().min(1, "Destination Journey ID is required"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const { uid, firestore } = await verifyUserAndGetInstances(req);
        const body = await req.json();
        const { sourceTripId, destinationJourneyId } = copyTripSchema.parse(body);

        const sourceTripRef = firestore.collection('users').doc(uid).collection('trips').doc(sourceTripId);
        const destinationJourneyRef = firestore.collection('users').doc(uid).collection('journeys').doc(destinationJourneyId);
        const newTripRef = firestore.collection('users').doc(uid).collection('trips').doc();

        let newTripDataForResponse: LoggedTrip | null = null;

        await firestore.runTransaction(async (transaction) => {
            const [sourceTripDoc, destinationJourneyDoc] = await transaction.getAll(sourceTripRef, destinationJourneyRef);

            if (!sourceTripDoc.exists) {
                throw new Error("Source trip not found.");
            }
            if (!destinationJourneyDoc.exists) {
                throw new Error("Destination journey not found.");
            }

            const sourceTripData = sourceTripDoc.data() as LoggedTrip;

            // Deep clone and reset checklist completion status
            const checklists = sourceTripData.checklists ? JSON.parse(JSON.stringify(sourceTripData.checklists)) : undefined;
            if (checklists && Array.isArray(checklists)) {
                checklists.forEach((stage: ChecklistStage) => {
                    if (stage.items && Array.isArray(stage.items)) {
                        stage.items.forEach((item: ChecklistItem) => {
                            item.completed = false;
                        });
                    }
                });
            }

            const newTripData: LoggedTrip = {
                ...sourceTripData,
                id: newTripRef.id,
                name: `Copy of: ${sourceTripData.name}`,
                timestamp: new Date().toISOString(),
                journeyId: destinationJourneyId,
                expenses: [],
                isCompleted: false,
                plannedStartDate: null,
                plannedEndDate: null,
                checklists: checklists,
            };

            transaction.set(newTripRef, newTripData);

            transaction.update(destinationJourneyRef, {
                tripIds: admin.firestore.FieldValue.arrayUnion(newTripRef.id)
            });

            newTripDataForResponse = newTripData;
        });

        // After the transaction completes, recalculate the master polyline
        await recalculateAndSaveMasterPolyline(destinationJourneyId, uid, firestore);
        
        if (!newTripDataForResponse) {
          throw new Error("Transaction failed to produce new trip data.");
        }
        
        return NextResponse.json(newTripDataForResponse, { status: 201 });

    } catch (err: any) {
        return handleApiError(err);
    }
}
