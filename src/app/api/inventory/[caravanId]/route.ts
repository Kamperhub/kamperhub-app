
// src/app/api/inventory/[caravanId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, adminFirestore, firebaseAdminInitError } from '@/lib/firebase-admin';
import type { InventoryItem } from '@/types/inventory';
import { z, ZodError } from 'zod';

async function verifyUserAndSDK(req: NextRequest): Promise<{ uid?: string; errorResponse?: NextResponse }> {
  if (firebaseAdminInitError || !adminFirestore || !admin.auth()) {
    console.error('API Route Error: Firebase Admin SDK not available.', firebaseAdminInitError);
    return {
      errorResponse: NextResponse.json({
        error: 'Server configuration error: The connection to the database or authentication service is not available. Please check server logs for details about GOOGLE_APPLICATION_CREDENTIALS_JSON.',
        details: firebaseAdminInitError?.message || "Firebase Admin SDK services are not initialized."
      }, { status: 503 })
    };
  }
  
  const authorizationHeader = req.headers.get('Authorization');
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 }) };
  }
  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error: any) {
    console.error('Error verifying Firebase ID token:', { message: error.message, code: error.code });
    return { errorResponse: NextResponse.json({ error: 'Unauthorized: Invalid ID token.', details: error.message, errorCode: error.code }, { status: 401 }) };
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
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;

  const { caravanId } = params;
  if (!caravanId) {
    return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
  }

  try {
    const inventoryDocRef = adminFirestore!.collection('users').doc(uid!).collection('inventories').doc(caravanId);
    const inventoryDocSnap = await inventoryDocRef.get();

    if (!inventoryDocSnap.exists()) {
      // It's not an error if a caravan doesn't have inventory yet, return an empty array.
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    
    const inventoryData = inventoryDocSnap.data();
    const items = inventoryData?.items || [];
    return NextResponse.json({ items }, { status: 200 });

  } catch (err: any) {
    console.error(`Error fetching inventory for caravan ${caravanId}:`, err);
    return NextResponse.json({ error: 'Failed to fetch inventory.', details: err.message }, { status: 500 });
  }
}

// PUT (create/replace) the inventory for a specific caravan
export async function PUT(req: NextRequest, { params }: { params: { caravanId: string } }) {
  const { uid, errorResponse } = await verifyUserAndSDK(req);
  if (errorResponse) return errorResponse;

  const { caravanId } = params;
  if (!caravanId) {
    return NextResponse.json({ error: 'Caravan ID is required.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    // The entire body should be an array of items, so we wrap it for schema validation
    const parsedData = updateInventorySchema.parse({ items: body });

    const inventoryDocRef = adminFirestore!.collection('users').doc(uid!).collection('inventories').doc(caravanId);
    
    // We overwrite the document with the new list of items.
    await inventoryDocRef.set({ items: parsedData.items });
    
    return NextResponse.json({ message: 'Inventory updated successfully.', items: parsedData.items }, { status: 200 });

  } catch (err: any) {
    console.error(`Error updating inventory for caravan ${caravanId}:`, err);
    if (err instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid inventory data.', details: err.format() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update inventory.', details: err.message }, { status: 500 });
  }
}
