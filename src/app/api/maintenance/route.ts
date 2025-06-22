// src/app/api/maintenance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore } from '@/lib/firebase-admin';
import { z, ZodError } from 'zod';
import { maintenanceTaskSchema } from '@/types/service';

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

const createMaintenanceTaskSchema = maintenanceTaskSchema.omit({ id: true, timestamp: true });
const updateMaintenanceTaskSchema = maintenanceTaskSchema.omit({ timestamp: true });

// GET all maintenance tasks for a user, optionally filtered by assetId
export async function GET(req: NextRequest) {
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  const assetId = req.nextUrl.searchParams.get('assetId');
  
  try {
    let query: admin.firestore.Query = adminFirestore
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
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    const parsedData = createMaintenanceTaskSchema.parse(body);

    const newTaskRef = adminFirestore
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
  const { uid, error } = await verifyUser(req);
  if (error) return error;
  
  try {
    const body = await req.json();
    const parsedData = updateMaintenanceTaskSchema.parse(body);

    const taskRef = adminFirestore
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
  const { uid, error } = await verifyUser(req);
  if (error) return error;

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Task ID is required for deletion.' }, { status: 400 });
    }
    
    await adminFirestore
        .collection('users').doc(uid)
        .collection('maintenanceTasks').doc(id)
        .delete();
        
    return NextResponse.json({ message: 'Maintenance task deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete maintenance task.', details: err.message }, { status: 500 });
  }
}
