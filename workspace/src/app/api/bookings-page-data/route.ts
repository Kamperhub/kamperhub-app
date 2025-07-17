
// src/app/api/bookings-page-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { BookingEntry } from '@/types/booking';
import type { LoggedTrip } from '@/types/tripplanner';
import type admin from 'firebase-admin';

// A robust replacer function for JSON.stringify to handle Firestore Timestamps.
const firestoreTimestampReplacer = (key: any, value: any) => {
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    return value;
};

// Helper function to create a clean, JSON-safe object.
const sanitizeData = (data: any) => {
    const jsonString = JSON.stringify(data, firestoreTimestampReplacer);
    return JSON.parse(jsonString);
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

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in bookings-page-data route:', error);
  if (error.message.includes('Unauthorized')) {
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
  if (error.message.includes('Server configuration error')) {
    return NextResponse.json({ error: 'Server configuration error', details: error.message }, { status: 503 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const { uid, firestore } = await verifyUserAndGetInstances(req);

        const [bookingsSnapshot, tripsSnapshot] = await Promise.all([
            firestore.collection('users').doc(uid).collection('bookings').get(),
            firestore.collection('users').doc(uid).collection('trips').get()
        ]);

        const bookings: BookingEntry[] = [];
        bookingsSnapshot.forEach(doc => {
            try {
                if (doc.exists) {
                    bookings.push(doc.data() as BookingEntry);
                }
            } catch (docError: any) {
                console.warn(`Skipping malformed booking document ID ${doc.id} due to error: ${docError.message}`);
            }
        });
        
        const trips: LoggedTrip[] = [];
        tripsSnapshot.forEach(doc => {
            try {
                if (doc.exists) {
                    trips.push(doc.data() as LoggedTrip);
                }
            } catch (docError: any) {
                console.warn(`Skipping malformed trip document ID ${doc.id} due to error: ${docError.message}`);
            }
        });

        const sanitizedData = sanitizeData({ bookings, trips });
        return NextResponse.json(sanitizedData, { status: 200 });
        
    } catch (err: any) {
        return handleApiError(err);
    }
}
