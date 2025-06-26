// src/app/api/fuel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore } from '@/lib/firebase-admin';
import { z, ZodError } from 'zod';
import { fuelLogSchema } from '@/types/service';

async function verifyUser(req: NextRequest): Promise<{ uid: string; error?: NextResponse }> {
  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Missing Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    return { uid: '', error: NextResponse.json({ error: 'Unauthorized: Invalid ID token.' }, { status: 401 }) };
  }
}

const createFuelLogSchema = fuelLogSchema.omit({ id: true, timestamp: true });
const updateFuelLogSchema = fuelLogSchema.omit({ timestamp: true });

// GET all fuel logs for a specific vehicle
export async function GET(req: NextRequest) {
  if (!adminFirestore) {
    return NextResponse.json({ error: 'Server configuration error: Database service is not available.' }, { status: 503 });
  }
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicleId query parameter is required.' }, { status: 400 });
  }

  try {
    const logsSnapshot = await adminFirestore
      .collection('users').doc(uid)
      .collection('vehicles').doc(vehicleId)
      .collection('fuelLogs')
      .orderBy('date', 'desc')
      .get();
      
    const logs = logsSnapshot.docs.map(doc => doc.data());
    return NextResponse.json(logs, { status: 200 });
  } catch (err: any) {
    console.error(`Error fetching fuel logs for vehicle ${vehicleId}:`, err);
    return NextResponse.json({ error: 'Failed to fetch fuel logs.', details: err.message }, { status: 500 });
  }
}

// POST a new fuel log
export async function POST(req: NextRequest) {
  if (!adminFirestore) {
    return NextResponse.json({ error: 'Server configuration error: Database service is not available.' }, { status: 503 });
  }
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const parsedData = createFuelLogSchema.parse(body);

    const newLogRef = adminFirestore
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
  if (!adminFirestore) {
    return NextResponse.json({ error: 'Server configuration error: Database service is not available.' }, { status: 503 });
  }
  const { uid, error } = await verifyUser(req);
  if (error) return error;
  
  try {
    const body = await req.json();
    const parsedData = updateFuelLogSchema.parse(body);

    const logRef = adminFirestore
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
  if (!adminFirestore) {
    return NextResponse.json({ error: 'Server configuration error: Database service is not available.' }, { status: 503 });
  }
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const { vehicleId, id } = await req.json();
    if (!id || !vehicleId) {
      return NextResponse.json({ error: 'vehicleId and log ID are required.' }, { status: 400 });
    }
    
    await adminFirestore
        .collection('users').doc(uid)
        .collection('vehicles').doc(vehicleId)
        .collection('fuelLogs').doc(id)
        .delete();
        
    return NextResponse.json({ message: 'Fuel log deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete fuel log.', details: err.message }, { status: 500 });
  }
}
