
// src/app/api/all-vehicle-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import type { LoggedTrip } from '@/types/tripplanner';
import type admin from 'firebase-admin';

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

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const { uid, firestore } = await verifyUserAndGetInstances(req);

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
        return NextResponse.json({ error: 'Failed to fetch consolidated data', details: err.message }, { status: 500 });
    }
}
