
// src/api/maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { maintenanceTaskSchema } from '@/types/service';
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
  console.error('API Error in maintenance route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

// GET all maintenance tasks for a user
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;
  
  try {
    const tasksSnapshot = await firestore.collection('users').doc(uid).collection('maintenanceTasks').orderBy('dateCompleted', 'desc').get();
    const tasks = tasksSnapshot.docs.map(doc => doc.data());
    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST a new maintenance task
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  try {
    const body = await req.json();
    const parsedData = maintenanceTaskSchema.omit({ id: true, timestamp: true }).parse(body);

    const newTaskRef = firestore.collection('users').doc(uid).collection('maintenanceTasks').doc();
    const newTask = {
      id: newTaskRef.id,
      ...parsedData,
      timestamp: new Date().toISOString(),
    };
    
    await newTaskRef.set(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT (update) an existing maintenance task
export async function PUT(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse || !uid || !firestore) return errorResponse;

    try {
        const body = await req.json();
        const parsedData = maintenanceTaskSchema.parse(body);
        const { id, ...updateData } = parsedData;

        const taskRef = firestore.collection('users').doc(uid).collection('maintenanceTasks').doc(id);
        await taskRef.update({
            ...updateData,
            timestamp: new Date().toISOString()
        });
        
        return NextResponse.json({ id, ...updateData });
    } catch(error) {
        return handleApiError(error);
    }
}

// DELETE a maintenance task
export async function DELETE(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse || !uid || !firestore) return errorResponse;

    try {
        const { id } = await req.json();
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'Maintenance Task ID is required for deletion.' }, { status: 400 });
        }
        await firestore.collection('users').doc(uid).collection('maintenanceTasks').doc(id).delete();
        return NextResponse.json({ message: 'Maintenance task deleted successfully.' });
    } catch(error) {
        return handleApiError(error);
    }
}
