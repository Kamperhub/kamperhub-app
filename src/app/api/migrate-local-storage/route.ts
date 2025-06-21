// src/app/api/migrate-local-storage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore } from '@/lib/firebase-admin';
import { z, ZodError } from 'zod';

// For this one-off migration script, we use lightweight validation.
// The client will be responsible for sending the correctly structured data.
const migrationPayloadSchema = z.object({
  vehicles: z.array(z.any()).optional(),
  caravans: z.array(z.any()).optional(),
  wdhs: z.array(z.any()).optional(),
  inventories: z.record(z.array(z.any())).optional(), // Record<caravanId, InventoryItem[]>
  trips: z.array(z.any()).optional(),
  bookings: z.array(z.any()).optional(),
  userPreferences: z.object({
    activeVehicleId: z.string().nullable().optional(),
    activeCaravanId: z.string().nullable().optional(),
    activeWdhId: z.string().nullable().optional(),
    dashboardLayout: z.array(z.string()).nullable().optional(),
    caravanWaterLevels: z.record(z.record(z.number())).nullable().optional(),
    caravanDefaultChecklists: z.record(z.any()).optional(),
  }).optional(),
});

async function verifyUser(req: NextRequest): Promise<{ uid: string; error?: NextResponse }> {
  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    console.error('Error verifying Firebase ID token in migration:', error);
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message }, { status: 401 }) };
  }
}

export async function POST(req: NextRequest) {
  if (!adminFirestore) {
    return NextResponse.json({ error: 'Server configuration error: Firestore is not available.' }, { status: 503 });
  }

  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const parsedData = migrationPayloadSchema.parse(body);

    const userDocRef = adminFirestore.collection('users').doc(uid);
    
    // Check if migration has already been run for this user by checking for any vehicles.
    const vehiclesSnapshot = await userDocRef.collection('vehicles').limit(1).get();
    if (!vehiclesSnapshot.empty) {
        console.log(`Migration for user ${uid} skipped: Existing data found.`);
        return NextResponse.json({ message: 'Migration not needed. Data already exists for user.' }, { status: 200 });
    }

    const batch = adminFirestore.batch();

    // Migrate vehicles
    if (parsedData.vehicles && parsedData.vehicles.length > 0) {
      parsedData.vehicles.forEach((vehicle: any) => {
        if (vehicle.id && typeof vehicle.id === 'string') {
          const docRef = userDocRef.collection('vehicles').doc(vehicle.id);
          batch.set(docRef, vehicle);
        }
      });
    }

    // Migrate caravans
    if (parsedData.caravans && parsedData.caravans.length > 0) {
      parsedData.caravans.forEach((caravan: any) => {
        if (caravan.id && typeof caravan.id === 'string') {
          const docRef = userDocRef.collection('caravans').doc(caravan.id);
          batch.set(docRef, caravan);
        }
      });
    }
    
    // Migrate WDHs
    if (parsedData.wdhs && parsedData.wdhs.length > 0) {
      parsedData.wdhs.forEach((wdh: any) => {
        if (wdh.id && typeof wdh.id === 'string') {
          const docRef = userDocRef.collection('wdhs').doc(wdh.id);
          batch.set(docRef, wdh);
        }
      });
    }

    // Migrate inventories
    if (parsedData.inventories) {
        for (const caravanId in parsedData.inventories) {
            if (Object.prototype.hasOwnProperty.call(parsedData.inventories, caravanId)) {
                const items = parsedData.inventories[caravanId];
                const docRef = userDocRef.collection('inventories').doc(caravanId);
                batch.set(docRef, { items });
            }
        }
    }

    // Migrate trips
    if (parsedData.trips && parsedData.trips.length > 0) {
        parsedData.trips.forEach((trip: any) => {
            if (trip.id && typeof trip.id === 'string') {
                const docRef = userDocRef.collection('trips').doc(trip.id);
                batch.set(docRef, trip);
            }
        });
    }

    // Migrate bookings
    if (parsedData.bookings && parsedData.bookings.length > 0) {
        parsedData.bookings.forEach((booking: any) => {
            if (booking.id && typeof booking.id === 'string') {
                const docRef = userDocRef.collection('bookings').doc(booking.id);
                batch.set(docRef, booking);
            }
        });
    }

    // Migrate user preferences from localStorage
    if (parsedData.userPreferences) {
        batch.set(userDocRef, parsedData.userPreferences, { merge: true });
    }

    await batch.commit();

    console.log(`Migration successful for user ${uid}.`);
    return NextResponse.json({ message: 'Local storage data migrated successfully.' }, { status: 200 });

  } catch (err: any) {
    console.error('Error during data migration:', err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid migration data payload.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to migrate data.', details: err.message }, { status: 500 });
  }
}
