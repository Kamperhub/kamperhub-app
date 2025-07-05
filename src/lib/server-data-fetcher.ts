'use server';

import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import type { UserProfile } from '@/types/auth';

// Helper to serialize Firestore data, converting Timestamps to ISO strings.
function serializeFirestoreData<T>(data: any): T {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  // Check for Firestore Timestamp
  if (data.toDate && typeof data.toDate === 'function') {
    return data.toDate().toISOString() as any;
  }
  // Handle nested arrays
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData) as any;
  }
  // Handle nested objects
  const serialized: { [key: string]: any } = {};
  for (const key in data) {
    serialized[key] = serializeFirestoreData(data[key]);
  }
  return serialized as T;
}


async function fetchCollection<T>(userId: string, collectionName: string): Promise<T[]> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) throw new Error("Firestore Admin SDK not initialized.");
  const snapshot = await firestore.collection('users').doc(userId).collection(collectionName).get();
  if (snapshot.empty) return [];
  return snapshot.docs.map(doc => serializeFirestoreData<T>({ id: doc.id, ...doc.data() } as T));
}

export async function getVehicles(userId: string): Promise<StoredVehicle[]> {
  return fetchCollection<StoredVehicle>(userId, 'vehicles');
}

export async function getCaravans(userId: string): Promise<StoredCaravan[]> {
  return fetchCollection<StoredCaravan>(userId, 'caravans');
}

export async function getUserPreferences(userId: string): Promise<Partial<UserProfile>> {
  const { firestore } = getFirebaseAdmin();
  if (!firestore) throw new Error("Firestore Admin SDK not initialized.");
  const docRef = firestore.collection('users').doc(userId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    // It's possible for a user to exist in Auth but not have a profile doc yet.
    // Return an empty object to avoid crashing the app.
    return {};
  }
  return serializeFirestoreData<UserProfile>(docSnap.data() as UserProfile);
}
