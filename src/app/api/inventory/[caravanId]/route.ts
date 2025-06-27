
// src/app/api/inventory/[caravanId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { InventoryItem } from '@/types/inventory';
import { z, ZodError } from 'zod';

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
  if (error) {
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

// GET the inventory for a specific caravan
export async function GET(req: NextRequest, { params }: { params: { caravanId: string } }) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  const { caravanId } = params;
  if (!caravanId) {
    return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
  }

  try {
    const inventoryDocRef = firestore.collection('users').doc(uid).collection('inventories').doc(caravanId);
    const inventoryDocSnap = await inventoryDocRef.get();

    if (!inventoryDocSnap.exists()) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    
    const inventoryData = inventoryDocSnap.data();
    const items = inventoryData?.items || [];
    const serializableData = sanitizeData({ items });
    return NextResponse.json(serializableData, { status: 200 });

  } catch (err: any) {
    console.error(`Error fetching inventory for caravan ${caravanId}:`, err);
    return NextResponse.json({ error: 'Failed to fetch inventory.', details: err.message }, { status: 500 });
  }
}

// PUT (create/replace) the inventory for a specific caravan
export async function PUT(req: NextRequest, { params }: { params: { caravanId: string } }) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse || NextResponse.json({ error: "Internal Server Error"}, { status: 500});

  const { caravanId } = params;
  if (!caravanId) {
    return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsedData = updateInventorySchema.parse({ items: body });

    const inventoryDocRef = firestore.collection('users').doc(uid).collection('inventories').doc(caravanId);
    
    await inventoryDocRef.set({ items: parsedData.items });
    
    const sanitizedItems = sanitizeData(parsedData.items);
    return NextResponse.json({ message: 'Inventory updated successfully.', items: sanitizedItems }, { status: 200 });

  } catch (err: any) {
    console.error(`Error updating inventory for caravan ${caravanId}:`, err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid inventory data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update inventory.', details: err.message }, { status: 500 });
  }
}
