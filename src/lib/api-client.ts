
'use client';

import { auth, db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs,
  getDoc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  writeBatch,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';

import type { StoredVehicle, VehicleFormData } from '@/types/vehicle';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import type { InventoryItem } from '@/types/inventory';
import type { LoggedTrip } from '@/types/tripplanner';
import type { BookingEntry } from '@/types/booking';
import type { UserProfile } from '@/types/auth';
import type { PackingListCategory } from '@/types/packing';
// Removed service types to prevent errors

// --- Generic Fetcher for API Routes (for admin/auth actions that MUST be on server) ---
async function apiFetch(url: string, options: RequestInit = {}) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated. Cannot make API call.');
    }
    const headers = new Headers(options.headers || {});
    const authToken = await user.getIdToken(true);
    headers.set('Authorization', `Bearer ${authToken}`);
    if (options.body) {
      headers.set('Content-Type', 'application/json');
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'API request failed.');
    }
    // Handle cases where the response body might be empty
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}


// ---- Vehicle API Functions ----
export async function fetchVehicles(): Promise<StoredVehicle[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated.");
  const querySnapshot = await getDocs(collection(db, 'users', uid, 'vehicles'));
  return querySnapshot.docs.map(doc => doc.data() as StoredVehicle);
}
export async function createVehicle(data: VehicleFormData): Promise<StoredVehicle> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const newDocRef = doc(collection(db, 'users', uid, 'vehicles'));
    const newVehicle: StoredVehicle = { id: newDocRef.id, ...data };
    await setDoc(newDocRef, newVehicle);
    return newVehicle;
}
export async function updateVehicle(data: StoredVehicle): Promise<{ vehicle: StoredVehicle }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await setDoc(doc(db, 'users', uid, 'vehicles', data.id), data, { merge: true });
    return { vehicle: data };
}
export async function deleteVehicle(id: string): Promise<{ message: string }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await deleteDoc(doc(db, 'users', uid, 'vehicles', id));
    return { message: 'Vehicle deleted successfully.' };
}

// ---- Caravan API Functions ----
export async function fetchCaravans(): Promise<StoredCaravan[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'caravans'));
    return querySnapshot.docs.map(doc => doc.data() as StoredCaravan);
}
export async function createCaravan(data: CaravanFormData): Promise<StoredCaravan> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const newDocRef = doc(collection(db, 'users', uid, 'caravans'));
    const newCaravan: StoredCaravan = { id: newDocRef.id, ...data };
    await setDoc(newDocRef, newCaravan);
    return newCaravan;
}
export async function updateCaravan(data: StoredCaravan): Promise<{ caravan: StoredCaravan }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await setDoc(doc(db, 'users', uid, 'caravans', data.id), data, { merge: true });
    return { caravan: data };
}
export async function deleteCaravan(id: string): Promise<{ message: string }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await deleteDoc(doc(db, 'users', uid, 'caravans', id));
    return { message: 'Caravan deleted successfully.' };
}

// ---- Inventory API Functions ----
export async function fetchInventory(caravanId: string): Promise<{ items: InventoryItem[] }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const docSnap = await getDoc(doc(db, 'users', uid, 'inventories', caravanId));
    return docSnap.exists() ? docSnap.data() as { items: InventoryItem[] } : { items: [] };
}
export async function updateInventory(payload: { caravanId: string; items: InventoryItem[] }): Promise<{ items: InventoryItem[] }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await setDoc(doc(db, 'users', uid, 'inventories', payload.caravanId), { items: payload.items });
    return { items: payload.items };
}

// ---- Trip API Functions ----
export async function fetchTrips(): Promise<LoggedTrip[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'trips'));
    return querySnapshot.docs.map(doc => doc.data() as LoggedTrip);
}
export async function createTrip(data: Omit<LoggedTrip, 'id' | 'timestamp'>): Promise<LoggedTrip> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const newDocRef = doc(collection(db, 'users', uid, 'trips'));
    const newTrip: LoggedTrip = { ...data, id: newDocRef.id, timestamp: new Date().toISOString() };
    await setDoc(newDocRef, newTrip);
    return newTrip;
}
export async function updateTrip(data: LoggedTrip): Promise<{ trip: LoggedTrip }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await setDoc(doc(db, 'users', uid, 'trips', data.id), data, { merge: true });
    return { trip: data };
}
export async function deleteTrip(id: string): Promise<{ message: string }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await deleteDoc(doc(db, 'users', uid, 'trips', id));
    return { message: 'Trip deleted successfully.' };
}

// ---- Booking API Functions ----
export async function fetchBookings(): Promise<BookingEntry[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'bookings'));
    return querySnapshot.docs.map(doc => doc.data() as BookingEntry);
}
export async function createBooking(data: Omit<BookingEntry, 'id' | 'timestamp'>): Promise<BookingEntry> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const newDocRef = doc(collection(db, 'users', uid, 'bookings'));
    const newBooking: BookingEntry = { ...data, id: newDocRef.id, timestamp: new Date().toISOString() };
    await setDoc(newDocRef, newBooking);
    return newBooking;
}
export async function updateBooking(data: BookingEntry): Promise<{ booking: BookingEntry }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await setDoc(doc(db, 'users', uid, 'bookings', data.id), data, { merge: true });
    return { booking: data };
}
export async function deleteBooking(id: string): Promise<{ message: string }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await deleteDoc(doc(db, 'users', uid, 'bookings', id));
    return { message: 'Booking deleted successfully.' };
}

// ---- User Preferences API ----
export async function fetchUserPreferences(): Promise<Partial<UserProfile>> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) {
        throw new Error("User profile document not found.");
    }
    return docSnap.data() as UserProfile;
}
export async function updateUserPreferences(preferences: Partial<UserProfile>): Promise<{ message: string }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await updateDoc(doc(db, 'users', uid), { ...preferences, updatedAt: new Date().toISOString() });
    return { message: 'Preferences updated.' };
}

// ---- Packing List API Functions ----
export async function fetchPackingList(tripId: string): Promise<{ list: PackingListCategory[] }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    const docSnap = await getDoc(doc(db, 'users', uid, 'packingLists', tripId));
    return docSnap.exists() ? docSnap.data() as { list: PackingListCategory[] } : { list: [] };
}
export async function updatePackingList(payload: { tripId: string; list: PackingListCategory[] }): Promise<{ message: string }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await setDoc(doc(db, 'users', uid, 'packingLists', payload.tripId), { list: payload.list });
    return { message: 'Packing list updated.' };
}
export async function deletePackingList(tripId: string): Promise<{ message: string }> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated.");
    await deleteDoc(doc(db, 'users', uid, 'packingLists', tripId));
    return { message: 'Packing list deleted.' };
}

// ---- Service Log Functions ----
// All service log functions have been removed to restore application stability.

// ---- Admin & Auth Functions (Still need API routes) ----
export const fetchAllUsers = (): Promise<{uid: string, email: string | undefined}[]> => apiFetch('/api/admin/list-users');
export const generateGoogleAuthUrl = (): Promise<{ url: string }> => apiFetch('/api/auth/google/connect', { method: 'POST' });
export const disconnectGoogleAccount = (): Promise<{ message: string }> => apiFetch('/api/auth/google/disconnect', { method: 'POST' });
