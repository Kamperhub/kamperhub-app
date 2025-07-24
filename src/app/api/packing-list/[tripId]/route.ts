// src/app/api/packing-list/[tripId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { packingListCategorySchema } from '@/types/packing';
import { z, ZodError } from 'zod';
import type admin from 'firebase-admin';

// Helper to verify user and get Firestore instance
async function verifyUserAndGetInstances(req: NextRequest): Promise<{ uid: string; firestore: admin.firestore.Firestore }> {
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

// Zod schema for validating the incoming array of categories
const updatePackingListSchema = z.array(packingListCategorySchema);


const handleApiError = (error: any): NextResponse => {
  console.error('API Error in packing-list route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  if (error.message.includes('Unauthorized')) {
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
  if (error.message.includes('Server configuration error')) {
    return NextResponse.json({ error: 'Server configuration error', details: error.message }, { status: 503 });
  }
   if (error.code === 16) { // UNAUTHENTICATED from Firebase Admin
     return NextResponse.json({ error: 'Server Authentication Failed', details: `16 UNAUTHENTICATED: ${error.message}. This is a server configuration issue. Check your GOOGLE_APPLICATION_CREDENTIALS_JSON.` }, { status: 500 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

// GET the packing list for a specific trip
export async function GET(req: NextRequest, { params }: { params: { tripId: string } }): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { tripId } = params;
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required.' }, { status: 400 });
    }

    const packingListDocRef = firestore.collection('users').doc(uid).collection('packingLists').doc(tripId);
    const packingListDocSnap = await packingListDocRef.get();

    if (!packingListDocSnap.exists) {
      return NextResponse.json({ list: [] }, { status: 200 });
    }
    
    const packingListData = packingListDocSnap.data();
    const list = packingListData?.list || [];
    return NextResponse.json({ list }, { status: 200 });

  } catch (err: any) {
    return handleApiError(err);
  }
}

// PUT (create/replace) the packing list for a specific trip
export async function PUT(req: NextRequest, { params }: { params: { tripId: string } }): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { tripId } = params;
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required.' }, { status: 400 });
    }

    const body = await req.json();
    const parsedData = updatePackingListSchema.parse(body);

    const packingListDocRef = firestore.collection('users').doc(uid).collection('packingLists').doc(tripId);
    
    await packingListDocRef.set({ list: parsedData });
    
    return NextResponse.json({ message: 'Packing list updated successfully.', list: parsedData }, { status: 200 });

  } catch (err: any) {
    return handleApiError(err);
  }
}

// DELETE the packing list for a specific trip
export async function DELETE(req: NextRequest, { params }: { params: { tripId: string } }): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { tripId } = params;
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required.' }, { status: 400 });
    }
  
    const packingListDocRef = firestore.collection('users').doc(uid).collection('packingLists').doc(tripId);
    await packingListDocRef.delete();
    return NextResponse.json({ message: 'Packing list deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
