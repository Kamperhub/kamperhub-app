
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
} from 'firebase/firestore';

import type { StoredVehicle, VehicleFormData } from '@/types/vehicle';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import type { InventoryItem } from '@/types/inventory';
import type { LoggedTrip } from '@/types/tripplanner';
import type { BookingEntry } from '@/types/booking';
import type { UserProfile } from '@/types/auth';
import type { PackingListCategory } from '@/types/packing';

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
      const errorData = await response.json().catch(() => ({ error: 'API request failed with a non-JSON response.' }));
      throw new Error(errorData.details || errorData.error || errorData.message || 'API request failed.');
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

// ---- Consolidated Vehicle Page Data Fetcher ----
export const fetchAllVehicleData = () => apiFetch('/api/all-vehicle-data');


// ---- Vehicle API Functions ----
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
    return apiFetch('/api/vehicles', { method: 'DELETE', body: JSON.stringify({ id }) });
}

// ---- Caravan API Functions ----
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
    return apiFetch('/api/caravans', { method: 'DELETE', body: JSON.stringify({ id }) });
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
    return apiFetch(`/api/trips`, { method: 'DELETE', body: JSON.stringify({ id }) });
}

// ---- Booking API Functions ----
export async function fetchBookings(): Promise<BookingEntry[]> {
    return apiFetch('/api/bookings').then(res => res);
}
export async function createBooking(data: Omit<BookingEntry, 'id' | 'timestamp'>): Promise<BookingEntry> {
    return apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateBooking(data: BookingEntry): Promise<{ booking: BookingEntry }> {
    return apiFetch('/api/bookings', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteBooking(id: string): Promise<{ message: string }> {
    return apiFetch('/api/bookings', { method: 'DELETE', body: JSON.stringify({ id }) });
}

// ---- User Preferences API ----
export async function fetchUserPreferences(): Promise<Partial<UserProfile>> {
     return apiFetch('/api/user-preferences');
}
export async function updateUserPreferences(preferences: Partial<UserProfile>): Promise<{ message: string }> {
    return apiFetch('/api/user-preferences', { method: 'PUT', body: JSON.stringify(preferences) });
}

// ---- Packing List API Functions ----
export async function fetchPackingList(tripId: string): Promise<{ list: PackingListCategory[] }> {
    return apiFetch(`/api/packing-list/${tripId}`);
}
export async function updatePackingList(payload: { tripId: string; list: PackingListCategory[] }): Promise<{ message: string }> {
    return apiFetch(`/api/packing-list/${payload.tripId}`, { method: 'PUT', body: JSON.stringify(payload.list) });
}
export async function deletePackingList(tripId: string): Promise<{ message: string }> {
    return apiFetch(`/api/packing-list/${tripId}`, { method: 'DELETE' });
}

// ---- Admin & Auth Functions ----
export const fetchAllUsers = (): Promise<{uid: string, email: string | undefined}[]> => apiFetch('/api/admin/list-users');
export const generateGoogleAuthUrl = (): Promise<{ url: string }> => apiFetch('/api/auth/google/connect', { method: 'POST' });
export const disconnectGoogleAccount = (): Promise<{ message: string }> => apiFetch('/api/auth/google/disconnect', { method: 'POST' });
