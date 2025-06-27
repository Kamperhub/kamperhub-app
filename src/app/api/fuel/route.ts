
// src/app/api/fuel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z, ZodError } from 'zod';
import { fuelLogSchema } from '@/types/service';

// Helper function to recursively convert Firestore Timestamps to ISO strings
function serializeFirestoreTimestamps(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreTimestamps);
  }
  if (typeof data.toDate === 'function') { // Check for Firestore Timestamp
    return data.toDate().toISOString();
  }
  if (typeof data === 'object' && data !== null && !Buffer.isBuffer(data)) {
    const res: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
          res[key] = serializeFirestoreTimestamps(data[key]);
      }
    }
    return res;
  }
  return data;
}

async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !firestore || !auth) {
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

const createFuelLogSchema = fuelLogSchema.omit({ id: true, timestamp: true });
const updateFuelLogSchema = fuelLogSchema.omit({ timestamp: true });

// GET all fuel logs for a specific vehicle
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicleId query parameter is required.' }, { status: 400 });
  }

  try {
    const logsSnapshot = await firestore
      .collection('users').doc(uid)
      .collection('vehicles').doc(vehicleId)
      .collection('fuelLogs')
      .orderBy('date', 'desc')
      .get();
      
    const logs = logsSnapshot.docs.map(doc => {
      const data = doc.data();
      if (!data) return null;
      return serializeFirestoreTimestamps(data);
    }).filter(Boolean);
    return NextResponse.json(logs, { status: 200 });
  } catch (err: any) {
    console.error(`Error fetching fuel logs for vehicle ${vehicleId}:`, err);
    return NextResponse.json({ error: 'Failed to fetch fuel logs.', details: err.message }, { status: 500 });
  }
}

// POST a new fuel log
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const body = await req.json();
    const parsedData = createFuelLogSchema.parse(body);

    const newLogRef = firestore
      .collection('users').doc(uid)
      .collection('vehicles').doc(parsedData.vehicleId)
      .collection('fuelLogs').doc();
      
    const newLog = {
      id: newLogRef.id,
      timestamp: new Date().toISOString(),
      ...parsedData,
    };
    
    await newLogRef.set(newLog);
    return NextResponse.json(newLog, { status: 201 });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid fuel log data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create fuel log.', details: err.message }, { status: 500 });
  }
}

// PUT (update) an existing fuel log
export async function PUT(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});
  
  try {
    const body = await req.json();
    const parsedData = updateFuelLogSchema.parse(body);

    const logRef = firestore
      .collection('users').doc(uid)
      .collection('vehicles').doc(parsedData.vehicleId)
      .collection('fuelLogs').doc(parsedData.id);
      
    await logRef.set(parsedData, { merge: true });
    return NextResponse.json({ message: 'Fuel log updated.', fuelLog: parsedData }, { status: 200 });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid fuel log data for update.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update fuel log.', details: err.message }, { status: 500 });
  }
}

// DELETE a fuel log
export async function DELETE(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const { vehicleId, id } = await req.json();
    if (!id || !vehicleId) {
      return NextResponse.json({ error: 'vehicleId and log ID are required.' }, { status: 400 });
    }
    
    await firestore
        .collection('users').doc(uid)
        .collection('vehicles').doc(vehicleId)
        .collection('fuelLogs').doc(id)
        .delete();
        
    return NextResponse.json({ message: 'Fuel log deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete fuel log.', details: err.message }, { status: 500 });
  }
}
