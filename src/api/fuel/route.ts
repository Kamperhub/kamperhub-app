// src/api/fuel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { fuelLogSchema } from '@/types/service';
import { z, ZodError } from 'zod';

async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    return { uid: null, errorResponse: NextResponse.json({ error: 'Server configuration error.', details: error?.message }, { status: 503 }) };
  }
  const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) return { uid: null, errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, firestore, errorResponse: null };
  } catch (error) {
    return { uid: null, errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in fuel route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

// GET all fuel logs for a user
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;
  
  try {
    const logsSnapshot = await firestore.collection('users').doc(uid).collection('fuelLogs').orderBy('date', 'desc').get();
    const logs = logsSnapshot.docs.map(doc => doc.data());
    return NextResponse.json(logs);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST a new fuel log
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  try {
    const body = await req.json();
    const parsedData = fuelLogSchema.omit({ id: true, timestamp: true }).parse(body);

    const newLogRef = firestore.collection('users').doc(uid).collection('fuelLogs').doc();
    const newLog = {
      id: newLogRef.id,
      ...parsedData,
      timestamp: new Date().toISOString(),
    };
    
    await newLogRef.set(newLog);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT (update) an existing fuel log
export async function PUT(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse || !uid || !firestore) return errorResponse;

    try {
        const body = await req.json();
        const parsedData = fuelLogSchema.parse(body);
        const { id, ...updateData } = parsedData;

        const logRef = firestore.collection('users').doc(uid).collection('fuelLogs').doc(id);
        await logRef.update({
            ...updateData,
            timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({ id, ...updateData });
    } catch(error) {
        return handleApiError(error);
    }
}

// DELETE a fuel log
export async function DELETE(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse || !uid || !firestore) return errorResponse;

    try {
        const { id } = await req.json();
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'Fuel Log ID is required for deletion.' }, { status: 400 });
        }
        await firestore.collection('users').doc(uid).collection('fuelLogs').doc(id).delete();
        return NextResponse.json({ message: 'Fuel log deleted successfully.' });
    } catch(error) {
        return handleApiError(error);
    }
}
