// src/app/api/bookings-page-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { BookingEntry } from '@/types/booking';
import type { LoggedTrip } from '@/types/tripplanner';

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


async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    return { uid: null, firestore: null, errorResponse: NextResponse.json({ error: 'Server configuration error.', details: error?.message }, { status: 503 }) };
  }

  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { uid: null, firestore: null, errorResponse: NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, firestore, errorResponse: null };
  } catch (error: any) {
    return { uid: null, firestore: null, errorResponse: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message }, { status: 401 }) };
  }
}

export async function GET(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse) return errorResponse;
    if (!uid || !firestore) {
      return NextResponse.json({ error: 'Server or authentication instance is not available.' }, { status: 503 });
    }

    try {
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

        // Sanitize the final object before sending
        const sanitizedData = sanitizeData({ bookings, trips });
        return NextResponse.json(sanitizedData, { status: 200 });
        
    } catch (err: any) {
        console.error('API Error in bookings-page-data:', err);
        let errorTitle = 'Internal Server Error';
        let errorDetails = 'An unexpected error occurred.';
        if (err.code) {
            switch(err.code) {
                case 5: errorTitle = 'Database Not Found'; errorDetails = `The Firestore database 'kamperhubv2' could not be found.`; break;
                case 16: errorTitle = 'Server Authentication Failed'; errorDetails = `The server's credentials are not valid.`; break;
                default: errorDetails = err.message; break;
            }
        } else {
            errorDetails = err.message;
        }
        return NextResponse.json({ error: errorTitle, details: errorDetails }, { status: 500 });
    }
}
