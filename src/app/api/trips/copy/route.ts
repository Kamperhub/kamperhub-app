// src/app/api/trips/copy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { LoggedTrip } from '@/types/tripplanner';
import type { ChecklistItem, ChecklistStage } from '@/types/checklist';
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

const copyTripSchema = z.object({
  sourceTripId: z.string().min(1, "Source Trip ID is required"),
  destinationJourneyId: z.string().min(1, "Destination Journey ID is required"),
});

export async function POST(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse || !uid || !firestore) return errorResponse;

    try {
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
                // Reset fields for a new trip as per requirements
                expenses: [], // Keep budget, but reset expenses
                isCompleted: false,
                plannedStartDate: null,
                plannedEndDate: null,
                checklists: checklists,
            };

            // Set the new trip document
            transaction.set(newTripRef, newTripData);

            // Update the destination journey's tripIds array
            transaction.update(destinationJourneyRef, {
                tripIds: admin.firestore.FieldValue.arrayUnion(newTripRef.id)
            });

            newTripDataForResponse = newTripData;
        });
        
        return NextResponse.json(newTripDataForResponse, { status: 201 });

    } catch (err: any) {
        return handleApiError(err);
    }
}
