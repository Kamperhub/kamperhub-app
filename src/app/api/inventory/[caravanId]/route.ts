
// src/app/api/inventory/[caravanId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { InventoryItem } from '@/types/inventory';
import { z, ZodError } from 'zod';
import type admin from 'firebase-admin';

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

async function verifyUserAndGetInstances(req: NextRequest): Promise<{ uid: string; firestore: admin.firestore.Firestore; }> {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    throw new Error('Server configuration error.');
  }

  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid Authorization header.');
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, firestore };
  } catch (error: any) {
    throw new Error('Unauthorized: Invalid ID token.');
  }
}

// Zod schema for validating a single inventory item
const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required"),
  weight: z.coerce.number().min(0, "Weight must be a non-negative number"),
  quantity: z.coerce.number().int().min(0, "Quantity must be a non-negative integer"),
  locationId: z.string().nullable().optional(),
});

// Zod schema for validating the incoming array of items for the PUT request
const updateInventorySchema = z.object({
  items: z.array(inventoryItemSchema),
});

const handleApiError = (error: any): NextResponse => {
  console.error('API Error:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

// GET the inventory for a specific caravan
export async function GET(req: NextRequest, { params }: { params: { caravanId: string } }): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { caravanId } = params;
    if (!caravanId) {
      return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
    }

    const inventoryDocRef = firestore.collection('users').doc(uid).collection('inventories').doc(caravanId);
    const inventoryDocSnap = await inventoryDocRef.get();

    if (!inventoryDocSnap.exists) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    
    const inventoryData = inventoryDocSnap.data();
    const items = inventoryData?.items || [];
    const serializableData = sanitizeData({ items });
    return NextResponse.json(serializableData, { status: 200 });

  } catch (err: any) {
    return handleApiError(err);
  }
}

// PUT (create/replace) the inventory for a specific caravan
export async function PUT(req: NextRequest, { params }: { params: { caravanId: string } }): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { caravanId } = params;
    if (!caravanId) {
      return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
    }

    const body = await req.json();
    const parsedData = updateInventorySchema.parse({ items: body });

    const inventoryDocRef = firestore.collection('users').doc(uid).collection('inventories').doc(caravanId);
    
    await inventoryDocRef.set({ items: parsedData.items });
    
    const sanitizedItems = sanitizeData(parsedData.items);
    return NextResponse.json({ message: 'Inventory updated successfully.', items: sanitizedItems }, { status: 200 });

  } catch (err: any) {
    return handleApiError(err);
  }
}
