
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
import type { FuelLogEntry, MaintenanceTask } from '@/types/service';
import type { PackingListCategory } from '@/types/packing';

// ---- NEW Generic Helper ----
// This ensures we always have the UID before making a call.
async function getUid(): Promise<string> {
  // If the user is readily available, return the UID immediately.
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  
  // If not, wait for the auth state to be confirmed. This handles initial page loads.
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe(); // Unsubscribe to prevent memory leaks
      if (user) {
        resolve(user.uid);
      } else {
        reject(new Error('User is not authenticated.'));
      }
    });
  });
}

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
  const uid = await getUid();
  const querySnapshot = await getDocs(collection(db, 'users', uid, 'vehicles'));
  return querySnapshot.docs.map(doc => doc.data() as StoredVehicle);
}
export async function createVehicle(data: VehicleFormData): Promise<StoredVehicle> {
    const uid = await getUid();
    const newDocRef = doc(collection(db, 'users', uid, 'vehicles'));
    const newVehicle: StoredVehicle = { id: newDocRef.id, ...data };
    await setDoc(newDocRef, newVehicle);
    return newVehicle;
}
export async function updateVehicle(data: StoredVehicle): Promise<{ vehicle: StoredVehicle }> {
    const uid = await getUid();
    await setDoc(doc(db, 'users', uid, 'vehicles', data.id), data, { merge: true });
    return { vehicle: data };
}
export async function deleteVehicle(id: string): Promise<{ message: string }> {
    const uid = await getUid();
    await deleteDoc(doc(db, 'users', uid, 'vehicles', id));
    return { message: 'Vehicle deleted successfully.' };
}

// ---- Caravan API Functions ----
export async function fetchCaravans(): Promise<StoredCaravan[]> {
    const uid = await getUid();
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'caravans'));
    return querySnapshot.docs.map(doc => doc.data() as StoredCaravan);
}
export async function createCaravan(data: CaravanFormData): Promise<StoredCaravan> {
    const uid = await getUid();
    const newDocRef = doc(collection(db, 'users', uid, 'caravans'));
    const newCaravan: StoredCaravan = { id: newDocRef.id, ...data };
    await setDoc(newDocRef, newCaravan);
    return newCaravan;
}
export async function updateCaravan(data: StoredCaravan): Promise<{ caravan: StoredCaravan }> {
    const uid = await getUid();
    await setDoc(doc(db, 'users', uid, 'caravans', data.id), data, { merge: true });
    return { caravan: data };
}
export async function deleteCaravan(id: string): Promise<{ message: string }> {
    const uid = await getUid();
    await deleteDoc(doc(db, 'users', uid, 'caravans', id));
    return { message: 'Caravan deleted successfully.' };
}

// ---- Inventory API Functions ----
export async function fetchInventory(caravanId: string): Promise<{ items: InventoryItem[] }> {
    const uid = await getUid();
    const docSnap = await getDoc(doc(db, 'users', uid, 'inventories', caravanId));
    return docSnap.exists() ? docSnap.data() as { items: InventoryItem[] } : { items: [] };
}
export async function updateInventory(payload: { caravanId: string; items: InventoryItem[] }): Promise<{ items: InventoryItem[] }> {
    const uid = await getUid();
    await setDoc(doc(db, 'users', uid, 'inventories', payload.caravanId), { items: payload.items });
    return { items: payload.items };
}

// ---- Trip API Functions ----
export async function fetchTrips(): Promise<LoggedTrip[]> {
    const uid = await getUid();
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'trips'));
    return querySnapshot.docs.map(doc => doc.data() as LoggedTrip);
}
export async function createTrip(data: Omit<LoggedTrip, 'id' | 'timestamp'>): Promise<LoggedTrip> {
    const uid = await getUid();
    const newDocRef = doc(collection(db, 'users', uid, 'trips'));
    const newTrip: LoggedTrip = { ...data, id: newDocRef.id, timestamp: new Date().toISOString() };
    await setDoc(newDocRef, newTrip);
    return newTrip;
}
export async function updateTrip(data: LoggedTrip): Promise<{ trip: LoggedTrip }> {
    const uid = await getUid();
    await setDoc(doc(db, 'users', uid, 'trips', data.id), data, { merge: true });
    return { trip: data };
}
export async function deleteTrip(id: string): Promise<{ message: string }> {
    const uid = await getUid();
    await deleteDoc(doc(db, 'users', uid, 'trips', id));
    return { message: 'Trip deleted successfully.' };
}

// ---- Booking API Functions ----
export async function fetchBookings(): Promise<BookingEntry[]> {
    const uid = await getUid();
    const querySnapshot = await getDocs(collection(db, 'users', uid, 'bookings'));
    return querySnapshot.docs.map(doc => doc.data() as BookingEntry);
}
export async function createBooking(data: Omit<BookingEntry, 'id' | 'timestamp'>): Promise<BookingEntry> {
    const uid = await getUid();
    const newDocRef = doc(collection(db, 'users', uid, 'bookings'));
    const newBooking: BookingEntry = { ...data, id: newDocRef.id, timestamp: new Date().toISOString() };
    await setDoc(newDocRef, newBooking);
    return newBooking;
}
export async function updateBooking(data: BookingEntry): Promise<{ booking: BookingEntry }> {
    const uid = await getUid();
    await setDoc(doc(db, 'users', uid, 'bookings', data.id), data, { merge: true });
    return { booking: data };
}
export async function deleteBooking(id: string): Promise<{ message: string }> {
    const uid = await getUid();
    await deleteDoc(doc(db, 'users', uid, 'bookings', id));
    return { message: 'Booking deleted successfully.' };
}

// ---- User Preferences API ----
export async function fetchUserPreferences(): Promise<Partial<UserProfile>> {
    const uid = await getUid();
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) {
        throw new Error("User profile document not found.");
    }
    return docSnap.data() as UserProfile;
}
export async function updateUserPreferences(preferences: Partial<UserProfile>): Promise<{ message: string }> {
    const uid = await getUid();
    await updateDoc(doc(db, 'users', uid), { ...preferences, updatedAt: new Date().toISOString() });
    return { message: 'Preferences updated.' };
}

// ---- Service Log API Functions ----
export async function fetchFuelLogs(vehicleId: string): Promise<FuelLogEntry[]> {
  const uid = await getUid();
  const fuelLogsRef = collection(db, 'users', uid, 'vehicles', vehicleId, 'fuelLogs');
  const querySnapshot = await getDocs(fuelLogsRef);
  return querySnapshot.docs.map(doc => doc.data() as FuelLogEntry);
}
export async function createFuelLog(data: Omit<FuelLogEntry, 'id' | 'timestamp'>): Promise<FuelLogEntry> {
    const uid = await getUid();
    const fuelLogsRef = collection(db, 'users', uid, 'vehicles', data.vehicleId, 'fuelLogs');
    const newDocRef = doc(fuelLogsRef);
    const newLog: FuelLogEntry = { ...data, id: newDocRef.id, timestamp: new Date().toISOString() };
    await setDoc(newDocRef, newLog);
    return newLog;
}
export async function updateFuelLog(data: FuelLogEntry): Promise<{ fuelLog: FuelLogEntry }> {
    const uid = await getUid();
    await setDoc(doc(db, 'users', uid, 'vehicles', data.vehicleId, 'fuelLogs', data.id), data, { merge: true });
    return { fuelLog: data };
}
export async function deleteFuelLog(vehicleId: string, id: string): Promise<{ message: string }> {
    const uid = await getUid();
    await deleteDoc(doc(db, 'users', uid, 'vehicles', vehicleId, 'fuelLogs', id));
    return { message: 'Fuel log deleted.' };
}
export async function fetchMaintenanceTasks(assetId?: string): Promise<MaintenanceTask[]> {
    const uid = await getUid();
    const tasksRef = collection(db, 'users', uid, 'maintenanceTasks');
    const q = assetId ? query(tasksRef, where("assetId", "==", assetId)) : tasksRef;
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as MaintenanceTask);
}
export async function createMaintenanceTask(data: Omit<MaintenanceTask, 'id' | 'timestamp'>): Promise<MaintenanceTask> {
    const uid = await getUid();
    const newDocRef = doc(collection(db, 'users', uid, 'maintenanceTasks'));
    const newTask: MaintenanceTask = { ...data, id: newDocRef.id, timestamp: new Date().toISOString() };
    await setDoc(newDocRef, newTask);
    return newTask;
}
export async function updateMaintenanceTask(data: MaintenanceTask): Promise<{ maintenanceTask: MaintenanceTask }> {
    const uid = await getUid();
    await setDoc(doc(db, 'users', uid, 'maintenanceTasks', data.id), data, { merge: true });
    return { maintenanceTask: data };
}
export async function deleteMaintenanceTask(id: string): Promise<{ message: string }> {
    const uid = await getUid();
    await deleteDoc(doc(db, 'users', uid, 'maintenanceTasks', id));
    return { message: 'Task deleted.' };
}

// ---- Packing List API Functions ----
export async function fetchPackingList(tripId: string): Promise<{ list: PackingListCategory[] }> {
    const uid = await getUid();
    const docSnap = await getDoc(doc(db, 'users', uid, 'packingLists', tripId));
    return docSnap.exists() ? docSnap.data() as { list: PackingListCategory[] } : { list: [] };
}
export async function updatePackingList(payload: { tripId: string; list: PackingListCategory[] }): Promise<{ message: string }> {
    const uid = await getUid();
    await setDoc(doc(db, 'users', uid, 'packingLists', payload.tripId), { list: payload.list });
    return { message: 'Packing list updated.' };
}
export async function deletePackingList(tripId: string): Promise<{ message: string }> {
    const uid = await getUid();
    await deleteDoc(doc(db, 'users', uid, 'packingLists', tripId));
    return { message: 'Packing list deleted.' };
}

// ---- Admin & Auth Functions (Still need API routes) ----
export const fetchAllUsers = (): Promise<{uid: string, email: string | undefined}[]> => apiFetch('/api/admin/list-users');
export const generateGoogleAuthUrl = (): Promise<{ url: string }> => apiFetch('/api/auth/google/connect', { method: 'POST' });
export const disconnectGoogleAccount = (): Promise<{ message: string }> => apiFetch('/api/auth/google/disconnect', { method: 'POST' });
