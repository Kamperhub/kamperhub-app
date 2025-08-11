// src/app/api/all-vehicle-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import type { UserProfile } from '@/types/auth';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import type { LoggedTrip } from '@/types/tripplanner';

const firestoreTimestampReplacer = (key: any, value: any) => {
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    return value;
};

const sanitizeData = (data: any) => {
    try {
        const jsonString = JSON.stringify(data, firestoreTimestampReplacer);
        return JSON.parse(jsonString);
    } catch (error: any) {
        console.error('Error in sanitizeData:', error);
        throw new Error(`Failed to serialize data: ${error.message}`);
    }
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

export async function GET(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse || !uid || !firestore) return errorResponse;

    try {
        const [vehiclesSnapshot, caravansSnapshot, userDocSnap, tripsSnapshot] = await Promise.all([
            firestore.collection('users').doc(uid).collection('vehicles').get(),
            firestore.collection('users').doc(uid).collection('caravans').get(),
            firestore.collection('users').doc(uid).get(),
            firestore.collection('users').doc(uid).collection('trips').get()
        ]);

        const vehicles = vehiclesSnapshot.docs.map(doc => doc.data() as StoredVehicle);
        const caravans = caravansSnapshot.docs.map(doc => doc.data() as StoredCaravan);
        const userProfile = userDocSnap.exists ? userDocSnap.data() as UserProfile : null;
        const trips = tripsSnapshot.docs.map(doc => doc.data() as LoggedTrip);

        const data = {
            vehicles,
            caravans,
            userProfile,
            trips,
        };
        
        const sanitizedData = sanitizeData(data);

        return NextResponse.json(sanitizedData, { status: 200 });
    } catch (err: any) {
        console.error('API Error in all-vehicle-data:', err);
        let errorTitle = 'Internal Server Error';
        let errorDetails = 'An unexpected error occurred.';
        if (err.code) {
            switch(err.code) {
                case 5: errorTitle = 'Database Not Found'; errorDetails = `The Firestore database '(default)' could not be found.`; break;
                case 16: errorTitle = 'Server Authentication Failed'; errorDetails = `The server's credentials are not valid.`; break;
                default: errorDetails = err.message; break;
            }
        } else {
            errorDetails = err.message;
        }
        return NextResponse.json({ error: errorTitle, details: errorDetails }, { status: 500 });
    }
}
