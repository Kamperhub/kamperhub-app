// src/app/api/journeys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import type { Journey } from '@/types/journey';
import { z, ZodError } from 'zod';
import type admin from 'firebase-admin';

async function verifyUserAndGetInstances(req: NextRequest): Promise<{ uid: string; firestore: admin.firestore.Firestore; }> {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    throw new Error('Server configuration error.');
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing Authorization header.');
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, firestore };
  } catch (error: any) {
    throw new Error('Unauthorized: Invalid ID token.');
  }
}

const createJourneySchema = z.object({
  name: z.string().min(1, "Journey name is required"),
  description: z.string().optional().nullable(),
});

const updateJourneySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Journey name is required").optional(),
  description: z.string().optional().nullable(),
  tripIds: z.array(z.string()).optional(),
});

const handleApiError = (error: any): NextResponse => {
    console.error('API Error in journeys route:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.format() }, { status: 400 });
    }
    if (error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

// GET all journeys for the user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const journeysSnapshot = await firestore.collection('users').doc(uid).collection('journeys').orderBy('createdAt', 'desc').get();
    const journeys = journeysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Journey[];
    return NextResponse.json(journeys, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST a new journey
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = createJourneySchema.parse(body);
    
    const newJourneyRef = firestore.collection('users').doc(uid).collection('journeys').doc();
    const now = new Date().toISOString();
    const newJourney: Journey = {
      id: newJourneyRef.id,
      name: parsedData.name,
      description: parsedData.description || null,
      tripIds: [],
      masterPolyline: null,
      createdAt: now,
      updatedAt: now,
    };

    await newJourneyRef.set(newJourney);
    return NextResponse.json(newJourney, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}

// PUT (update) an existing journey
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = updateJourneySchema.parse(body);
    const { id, ...updateData } = parsedData;

    const journeyRef = firestore.collection('users').doc(uid).collection('journeys').doc(id);
    
    await journeyRef.update({
        ...updateData,
        updatedAt: new Date().toISOString(),
    });
    
    const updatedDoc = await journeyRef.get();
    return NextResponse.json(updatedDoc.data(), { status: 200 });

  } catch (error: any) {
    return handleApiError(error);
  }
}

// DELETE a journey
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    try {
        const { uid, firestore } = await verifyUserAndGetInstances(req);
        const { id } = await req.json();
        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'Journey ID is required.' }, { status: 400 });
        }
        
        await firestore.collection('users').doc(uid).collection('journeys').doc(id).delete();
        
        return NextResponse.json({ message: 'Journey deleted successfully.' }, { status: 200 });
    } catch (err: any) {
        return handleApiError(err);
    }
}
