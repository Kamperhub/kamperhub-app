// src/app/api/favorite-spots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import type { FavoriteSpot } from '@/types/favorites';
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

const favoriteSpotSchema = z.object({
  name: z.string().min(1, "Spot name is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

const updateFavoriteSpotSchema = favoriteSpotSchema.extend({
    id: z.string().min(1, "Spot ID is required for updates"),
});


const handleApiError = (error: any): NextResponse => {
  console.error('API Error in favorite-spots route:', error);
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
  }
   if (error.message.includes('Unauthorized')) {
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

export async function GET(req: NextRequest) {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const spotsSnapshot = await firestore.collection('users').doc(uid).collection('favoriteSpots').orderBy('addedDate', 'desc').get();
    const spots = spotsSnapshot.docs.map(doc => doc.data() as FavoriteSpot);
    return NextResponse.json(spots, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = favoriteSpotSchema.parse(body);

    const newSpotRef = firestore.collection('users').doc(uid).collection('favoriteSpots').doc();
    const newSpot: FavoriteSpot = {
      id: newSpotRef.id,
      ...parsedData,
      notes: parsedData.notes || null,
      externalId: parsedData.externalId || null,
      tags: parsedData.tags || [],
      addedDate: new Date().toISOString(),
    };
    await newSpotRef.set(newSpot);
    return NextResponse.json(newSpot, { status: 201 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = updateFavoriteSpotSchema.parse(body);
    const { id, ...updateData } = parsedData;

    const spotRef = firestore.collection('users').doc(uid).collection('favoriteSpots').doc(id);
    await spotRef.update({
      ...updateData,
      notes: updateData.notes || null,
      externalId: updateData.externalId || null,
      tags: updateData.tags || [],
    });
    const updatedDoc = await spotRef.get();
    return NextResponse.json(updatedDoc.data(), { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Spot ID is required.' }, { status: 400 });
    }
    await firestore.collection('users').doc(uid).collection('favoriteSpots').doc(id).delete();
    return NextResponse.json({ message: 'Favorite spot deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
