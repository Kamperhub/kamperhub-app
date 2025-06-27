
// src/app/api/maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z, ZodError } from 'zod';
import { maintenanceTaskSchema } from '@/types/service';
import type { firestore } from 'firebase-admin';

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

const createMaintenanceTaskSchema = maintenanceTaskSchema.omit({ id: true, timestamp: true });
const updateMaintenanceTaskSchema = maintenanceTaskSchema.omit({ timestamp: true });

// GET all maintenance tasks for a user, optionally filtered by assetId
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  const assetId = req.nextUrl.searchParams.get('assetId');
  
  try {
    let query: firestore.Query = firestore
      .collection('users').doc(uid)
      .collection('maintenanceTasks');

    if (assetId) {
      query = query.where('assetId', '==', assetId);
    }
      
    const tasksSnapshot = await query.orderBy('dueDate', 'asc').get();
    const tasks = tasksSnapshot.docs.map(doc => doc.data());
    return NextResponse.json(tasks, { status: 200 });
  } catch (err: any) {
    console.error(`Error fetching maintenance tasks:`, err);
    return NextResponse.json({ error: 'Failed to fetch maintenance tasks.', details: err.message }, { status: 500 });
  }
}

// POST a new maintenance task
export async function POST(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const body = await req.json();
    const parsedData = createMaintenanceTaskSchema.parse(body);

    const newTaskRef = firestore
      .collection('users').doc(uid)
      .collection('maintenanceTasks').doc();
      
    const newTask = {
      id: newTaskRef.id,
      timestamp: new Date().toISOString(),
      ...parsedData,
    };
    
    await newTaskRef.set(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid maintenance task data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create maintenance task.', details: err.message }, { status: 500 });
  }
}

// PUT (update) an existing maintenance task
export async function PUT(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});
  
  try {
    const body = await req.json();
    const parsedData = updateMaintenanceTaskSchema.parse(body);

    const taskRef = firestore
      .collection('users').doc(uid)
      .collection('maintenanceTasks').doc(parsedData.id);
      
    await taskRef.set(parsedData, { merge: true });
    return NextResponse.json({ message: 'Maintenance task updated.', maintenanceTask: parsedData }, { status: 200 });
  } catch (err: any) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid task data for update.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update task.', details: err.message }, { status: 500 });
  }
}

// DELETE a maintenance task
export async function DELETE(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required for deletion.' }, { status: 400 });
    }
    
    await firestore
        .collection('users').doc(uid)
        .collection('maintenanceTasks').doc(id)
        .delete();
        
    return NextResponse.json({ message: 'Maintenance task deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete maintenance task.', details: err.message }, { status: 500 });
  }
}
