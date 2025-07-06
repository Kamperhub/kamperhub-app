
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { calculateRoute } from '@/lib/google-maps-api';
import type { LoggedTrip, RouteDetails } from '@/types/tripplanner';

const ADMIN_EMAIL = 'info@kamperhub.com';

// Type guard to check for the old trip format
function isOldTripFormat(trip: any): boolean {
  return trip.routeDetails && typeof trip.routeDetails.distance === 'string';
}

export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }

  try {
    // 1. Verify Admin
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    let totalUsersScanned = 0;
    let totalTripsScanned = 0;
    let totalTripsMigrated = 0;
    const errors: string[] = [];

    // 2. Fetch all users
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;
    totalUsersScanned = users.length;

    // 3. Loop through each user
    for (const user of users) {
      try {
        const tripsRef = firestore.collection('users').doc(user.uid).collection('trips');
        const tripsSnapshot = await tripsRef.get();
        
        if (tripsSnapshot.empty) {
          continue;
        }

        const batch = firestore.batch();

        for (const tripDoc of tripsSnapshot.docs) {
          totalTripsScanned++;
          const tripData = tripDoc.data() as LoggedTrip;

          // 4. Check if migration is needed
          if (isOldTripFormat(tripData)) {
            try {
              // 5. Re-calculate route
              const newRouteDetails: RouteDetails = await calculateRoute(tripData.startLocationDisplay, tripData.endLocationDisplay);
              
              // 6. Update document in batch
              batch.update(tripDoc.ref, { routeDetails: newRouteDetails });
              totalTripsMigrated++;
            } catch (routeError: any) {
                console.error(`Failed to migrate trip ${tripDoc.id} for user ${user.uid}: ${routeError.message}`);
                errors.push(`Trip "${tripData.name}" (User: ${user.email}): ${routeError.message}`);
            }
          }
        }
        
        await batch.commit();
      } catch (userError: any) {
          console.error(`Error processing trips for user ${user.uid}: ${userError.message}`);
          errors.push(`User ${user.email}: ${userError.message}`);
      }
    }
    
    const message = `Migration complete. Scanned ${totalUsersScanned} users and ${totalTripsScanned} trips. Successfully migrated ${totalTripsMigrated} trips.`;
    return NextResponse.json({ message, errors }, { status: 200 });

  } catch (error: any) {
    console.error('Error in trip migration endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
