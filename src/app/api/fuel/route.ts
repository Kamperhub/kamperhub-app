
// src/app/api/fuel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z, ZodError } from 'zod';
import { fuelLogSchema } from '@/types/service';
import type { LoggedTrip } from '@/types/tripplanner';
import type { Expense } from '@/types/expense';
import type { firestore } from 'firebase-admin';

// A robust replacer function for JSON.stringify to handle Firestore Timestamps.
const firestoreTimestampReplacer = (key: any, value: any) => {
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
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
const updateFuelLogSchema = fuelLogSchema;

// GET all fuel logs for a specific vehicle
export async function GET(req: NextRequest) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicleId query parameter is required.' }, { status: 400 });
  }

  try {
    let query: firestore.Query = firestore
      .collection('users').doc(uid)
      .collection('vehicles').doc(vehicleId)
      .collection('fuelLogs');
      
    const logsSnapshot = await query.get();
    const logs = logsSnapshot.docs.map(doc => doc.data()).filter(Boolean);
    const sanitizedLogs = sanitizeData(logs);
    return NextResponse.json(sanitizedLogs, { status: 200 });
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
    const { assignedTripId, ...fuelLogDetails } = parsedData;

    const newLogRef = firestore
      .collection('users').doc(uid)
      .collection('vehicles').doc(fuelLogDetails.vehicleId)
      .collection('fuelLogs').doc();
      
    const newLog = {
      id: newLogRef.id,
      timestamp: new Date().toISOString(),
      ...fuelLogDetails,
      assignedTripId: assignedTripId || null,
    };
    
    if (assignedTripId) {
        await firestore.runTransaction(async (transaction) => {
            const tripRef = firestore.collection('users').doc(uid).collection('trips').doc(assignedTripId);
            const tripDoc = await transaction.get(tripRef);

            if (!tripDoc.exists) throw new Error("Assigned trip not found.");

            const tripData = tripDoc.data() as LoggedTrip;
            const fuelCategory = tripData.budget?.find(cat => cat.name.toLowerCase() === 'fuel');

            if (!fuelCategory) throw new Error("Could not find a 'Fuel' budget category in the selected trip.");

            const newExpense: Expense = {
                id: newLog.id, // Use fuel log ID as expense ID for easy linking
                categoryId: fuelCategory.id,
                amount: newLog.totalCost,
                description: `Fuel purchase at ${newLog.location || 'unknown location'}`,
                date: newLog.date,
                timestamp: newLog.timestamp,
            };

            const updatedExpenses = [...(tripData.expenses || []), newExpense];
            transaction.update(tripRef, { expenses: updatedExpenses });
            transaction.set(newLogRef, newLog);
        });
    } else {
        await newLogRef.set(newLog);
    }
    
    const sanitizedNewLog = sanitizeData(newLog);
    return NextResponse.json(sanitizedNewLog, { status: 201 });

  } catch (err: any) {
    console.error("Error creating fuel log:", err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid fuel log data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create fuel log.', details: err.message }, { status: 500 });
  }
}


// PUT (update) an existing fuel log
export async function PUT(req: NextRequest) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error" }, { status: 500 });

    try {
        const body = await req.json();
        const parsedData = updateFuelLogSchema.parse(body);
        const { id: logId, vehicleId, assignedTripId, ...fuelLogDetails } = parsedData;

        const logRef = firestore.collection('users').doc(uid).collection('vehicles').doc(vehicleId).collection('fuelLogs').doc(logId);
        
        const updatedLogData = {
            ...fuelLogDetails,
            id: logId,
            vehicleId,
            assignedTripId: assignedTripId || null,
        };

        await firestore.runTransaction(async (transaction) => {
            // Update the fuel log itself
            transaction.update(logRef, updatedLogData);

            // If it's assigned to a trip, update the corresponding expense
            if (assignedTripId) {
                const tripRef = firestore.collection('users').doc(uid).collection('trips').doc(assignedTripId);
                const tripDoc = await transaction.get(tripRef);

                if (!tripDoc.exists) throw new Error("Assigned trip not found.");
                
                const tripData = tripDoc.data() as LoggedTrip;
                const expenses = tripData.expenses || [];
                const expenseIndex = expenses.findIndex(exp => exp.id === logId);

                if (expenseIndex !== -1) {
                    expenses[expenseIndex].amount = updatedLogData.totalCost;
                    expenses[expenseIndex].date = updatedLogData.date;
                    expenses[expenseIndex].description = `Fuel purchase at ${updatedLogData.location || 'unknown location'}`;
                    transaction.update(tripRef, { expenses });
                } else {
                    // If for some reason the expense doesn't exist, we could create it.
                    // For now, we'll just log a warning. The main use case is updating an existing one.
                    console.warn(`Could not find matching expense for fuel log ID ${logId} in trip ${assignedTripId} to update.`);
                }
            }
            // Note: This simplified PUT does not handle moving an expense from one trip to another.
        });
        
        return NextResponse.json({ message: 'Fuel log updated.', fuelLog: sanitizeData(updatedLogData) }, { status: 200 });

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
    const { vehicleId, id: logId } = await req.json();
    if (!logId || !vehicleId) {
      return NextResponse.json({ error: 'vehicleId and log ID are required.' }, { status: 400 });
    }
    
    const logRef = firestore
        .collection('users').doc(uid)
        .collection('vehicles').doc(vehicleId)
        .collection('fuelLogs').doc(logId);
        
    await firestore.runTransaction(async (transaction) => {
        const logDoc = await transaction.get(logRef);
        if (!logDoc.exists) throw new Error("Fuel log to delete not found.");

        const logData = logDoc.data() as FuelLogEntry;
        const { assignedTripId } = logData;
        
        // If assigned to a trip, remove the corresponding expense
        if (assignedTripId) {
            const tripRef = firestore.collection('users').doc(uid).collection('trips').doc(assignedTripId);
            const tripDoc = await transaction.get(tripRef);
            if (tripDoc.exists) {
                const tripData = tripDoc.data() as LoggedTrip;
                const updatedExpenses = (tripData.expenses || []).filter(exp => exp.id !== logId);
                transaction.update(tripRef, { expenses: updatedExpenses });
            }
        }
        
        // Delete the fuel log itself
        transaction.delete(logRef);
    });
        
    return NextResponse.json({ message: 'Fuel log deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error("Error deleting fuel log:", err);
    return NextResponse.json({ error: 'Failed to delete fuel log.', details: err.message }, { status: 500 });
  }
}
