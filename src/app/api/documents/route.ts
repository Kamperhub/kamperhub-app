
// src/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z, ZodError } from 'zod';
import type admin from 'firebase-admin';
import { documentTags, type StoredDocument } from '@/types/document';

async function verifyUserAndGetInstances(req: NextRequest): Promise<{ uid: string; firestore: admin.firestore.Firestore; }> {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) throw new Error('Server configuration error.');
  
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized: Missing Authorization header.');
  
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { uid: decodedToken.uid, firestore };
  } catch (error: any) {
    throw new Error('Unauthorized: Invalid ID token.');
  }
}

const documentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  description: z.string().optional().nullable(),
  fileUrl: z.string().url("Please enter a valid URL"),
  tags: z.array(z.enum(documentTags)).default([]),
});

const updateDocumentSchema = documentSchema.extend({
    id: z.string().min(1, "Document ID is required for updates"),
});


const handleApiError = (error: any): NextResponse => {
  console.error('API Error in documents route:', error);
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
    const docsSnapshot = await firestore.collection('users').doc(uid).collection('documents').orderBy('updatedAt', 'desc').get();
    const documents = docsSnapshot.docs.map(doc => doc.data() as StoredDocument);
    return NextResponse.json(documents, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = documentSchema.parse(body);

    const newDocRef = firestore.collection('users').doc(uid).collection('documents').doc();
    const now = new Date().toISOString();
    const newDocument: StoredDocument = {
      id: newDocRef.id,
      ...parsedData,
      description: parsedData.description || null,
      createdAt: now,
      updatedAt: now,
    };
    await newDocRef.set(newDocument);
    return NextResponse.json(newDocument, { status: 201 });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { uid, firestore } = await verifyUserAndGetInstances(req);
    const body = await req.json();
    const parsedData = updateDocumentSchema.parse(body);
    const { id, ...updateData } = parsedData;

    const docRef = firestore.collection('users').doc(uid).collection('documents').doc(id);
    await docRef.update({
      ...updateData,
      description: updateData.description || null,
      updatedAt: new Date().toISOString(),
    });
    const updatedDoc = await docRef.get();
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
      return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
    }
    await firestore.collection('users').doc(uid).collection('documents').doc(id).delete();
    return NextResponse.json({ message: 'Document deleted successfully.' }, { status: 200 });
  } catch (err: any) {
    return handleApiError(err);
  }
}
