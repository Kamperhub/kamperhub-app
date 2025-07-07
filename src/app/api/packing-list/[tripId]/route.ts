import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { packingListCategorySchema } from '@/types/packing';
import { z, ZodError } from 'zod';

// Helper to verify user and get Firestore instance
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

// Zod schema for validating the incoming array of categories
const updatePackingListSchema = z.object({
  list: z.array(packingListCategorySchema),
});

const handleApiError = (error: any) => {
  console.error('API Error:', error);
  let errorTitle = 'Internal Server Error';
  let errorDetails = 'An unexpected error occurred.';
  let statusCode = 500;

  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
  
  if (error.code) {
      switch(error.code) {
          case 5: // NOT_FOUND
              errorTitle = 'Database Not Found';
              errorDetails = `The Firestore database 'kamperhubv2' could not be found. Please verify its creation in your Firebase project.`;
              statusCode = 500;
              break;
          case 16: // UNAUTHENTICATED
              errorTitle = 'Server Authentication Failed';
              errorDetails = `The server's credentials (GOOGLE_APPLICATION_CREDENTIALS_JSON) are invalid or lack permission for Firestore. Please check your setup.`;
              statusCode = 500;
              break;
          default:
              errorDetails = error.message;
              break;
      }
  } else {
    errorDetails = error.message;
  }

  return NextResponse.json({ error: errorTitle, details: errorDetails }, { status: statusCode });
};

// GET the packing list for a specific trip
export async function GET(req: NextRequest, { params }: { params: { tripId: string } }) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  const { tripId } = params;
  if (!tripId) {
    return NextResponse.json({ error: 'Trip ID is required.' }, { status: 400 });
  }

  try {
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
export async function PUT(req: NextRequest, { params }: { params: { tripId: string } }) {
  const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
  if (errorResponse || !uid || !firestore) return errorResponse;

  const { tripId } = params;
  if (!tripId) {
    return NextResponse.json({ error: 'Trip ID is required.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsedData = updatePackingListSchema.parse({ list: body });

    const packingListDocRef = firestore.collection('users').doc(uid).collection('packingLists').doc(tripId);
    
    await packingListDocRef.set({ list: parsedData.list });
    
    return NextResponse.json({ message: 'Packing list updated successfully.', list: parsedData.list }, { status: 200 });

  } catch (err: any) {
    return handleApiError(err);
  }
}

// DELETE the packing list for a specific trip
export async function DELETE(req: NextRequest, { params }: { params: { tripId: string } }) {
    const { uid, firestore, errorResponse } = await verifyUserAndGetInstances(req);
    if (errorResponse || !uid || !firestore) return errorResponse;
  
    const { tripId } = params;
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required.' }, { status: 400 });
    }
  
    try {
      const packingListDocRef = firestore.collection('users').doc(uid).collection('packingLists').doc(tripId);
      await packingListDocRef.delete();
      return NextResponse.json({ message: 'Packing list deleted successfully.' }, { status: 200 });
    } catch (err: any) {
      return handleApiError(err);
    }
}
