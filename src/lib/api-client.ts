'use client';

import { auth, appCheck } from './firebase';
import { getToken } from 'firebase/app-check';
import type { StoredVehicle, VehicleFormData } from '@/types/vehicle';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import type { StoredWDH, WDHFormData } from '@/types/wdh';
import type { InventoryItem } from '@/types/inventory';
import type { LoggedTrip, TripPlannerFormValues } from '@/types/tripplanner';
import type { BookingEntry } from '@/types/booking';
import type { UserProfile } from '@/types/auth';
import type { FuelLogEntry, MaintenanceTask } from '@/types/service';

// ---- Generic Fetcher ----
async function apiFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated. Cannot make API call.');
  }

  // Get App Check token
  let appCheckTokenResponse;
  try {
    if (appCheck) {
      appCheckTokenResponse = await getToken(appCheck, /* forceRefresh= */ false);
    } else {
      console.warn("App Check not initialized. This is expected on the server. Proceeding without token.");
    }
  } catch (err: any) {
    if (err.code === 'appCheck/recaptcha-error') {
      console.error("App Check failed: A reCAPTCHA error occurred. This is often due to the website's domain (e.g., localhost) not being authorized for the reCAPTCHA Site Key in the Google Cloud Console. Please check your key's configuration.", err);
    } else {
      console.error("Failed to get App Check token, proceeding without it.", err);
    }
    // Let the request proceed without the token; server-side App Check enforcement will handle it.
  }
  
  // Get Auth token
  const authToken = await user.getIdToken(true);

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${authToken}`);

  // Add App Check token to header if available
  if (appCheckTokenResponse) {
    headers.set('X-Firebase-AppCheck', appCheckTokenResponse.token);
  }
  
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
    const errorMessage = errorData.error || errorData.message || `Request failed with status ${response.status}`;
    // Include more details if available from the server error response
    const errorDetails = errorData.details ? ` Details: ${JSON.stringify(errorData.details)}` : '';
    throw new Error(`${errorMessage}${errorDetails}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    // Handle empty JSON response (e.g., from a DELETE)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  return; 
}

// ---- Vehicle API Functions ----
export const fetchVehicles = (): Promise<StoredVehicle[]> => apiFetch('/api/vehicles');
export const createVehicle = (data: VehicleFormData): Promise<StoredVehicle> => apiFetch('/api/vehicles', { method: 'POST', body: JSON.stringify(data) });
export const updateVehicle = (data: StoredVehicle): Promise<{ vehicle: StoredVehicle }> => apiFetch('/api/vehicles', { method: 'PUT', body: JSON.stringify(data) });
export const deleteVehicle = (id: string): Promise<{ message: string }> => apiFetch('/api/vehicles', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- Caravan API Functions ----
export const fetchCaravans = (): Promise<StoredCaravan[]> => apiFetch('/api/caravans');
export const createCaravan = (data: CaravanFormData): Promise<StoredCaravan> => apiFetch('/api/caravans', { method: 'POST', body: JSON.stringify(data) });
export const updateCaravan = (data: StoredCaravan): Promise<{ caravan: StoredCaravan }> => apiFetch('/api/caravans', { method: 'PUT', body: JSON.stringify(data) });
export const deleteCaravan = (id: string): Promise<{ message: string }> => apiFetch('/api/caravans', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- WDH API Functions ----
export const fetchWdhs = (): Promise<StoredWDH[]> => apiFetch('/api/wdhs');
export const createWdh = (data: WDHFormData): Promise<StoredWDH> => apiFetch('/api/wdhs', { method: 'POST', body: JSON.stringify(data) });
export const updateWdh = (data: StoredWDH): Promise<{ wdh: StoredWDH }> => apiFetch('/api/wdhs', { method: 'PUT', body: JSON.stringify(data) });
export const deleteWdh = (id: string): Promise<{ message: string }> => apiFetch('/api/wdhs', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- Inventory API Functions ----
export const fetchInventory = (caravanId: string): Promise<{ items: InventoryItem[] }> => apiFetch(`/api/inventory/${caravanId}`);
export const updateInventory = (payload: { caravanId: string; items: InventoryItem[] }): Promise<{ items: InventoryItem[] }> => apiFetch(`/api/inventory/${payload.caravanId}`, { method: 'PUT', body: JSON.stringify(payload.items) });

// ---- Trip API Functions ----
export const fetchTrips = (): Promise<LoggedTrip[]> => apiFetch('/api/trips');
export const createTrip = (data: Omit<LoggedTrip, 'id' | 'timestamp'>): Promise<LoggedTrip> => apiFetch('/api/trips', { method: 'POST', body: JSON.stringify(data) });
export const updateTrip = (data: LoggedTrip): Promise<{ trip: LoggedTrip }> => apiFetch('/api/trips', { method: 'PUT', body: JSON.stringify(data) });
export const deleteTrip = (id: string): Promise<{ message: string }> => apiFetch('/api/trips', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- Booking API Functions ----
export const fetchBookings = (): Promise<BookingEntry[]> => apiFetch('/api/bookings');
export const createBooking = (data: Omit<BookingEntry, 'id' | 'timestamp'>): Promise<BookingEntry> => apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(data) });
export const updateBooking = (data: BookingEntry): Promise<{ booking: BookingEntry }> => apiFetch('/api/bookings', { method: 'PUT', body: JSON.stringify(data) });
export const deleteBooking = (id: string): Promise<{ message: string }> => apiFetch('/api/bookings', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- User Preferences API Functions ----
export const fetchUserPreferences = (): Promise<Partial<UserProfile>> => apiFetch('/api/user-preferences');
export const updateUserPreferences = (preferences: Partial<UserProfile>): Promise<{ message: string }> => apiFetch('/api/user-preferences', { method: 'PUT', body: JSON.stringify(preferences) });

// ---- Service Log API Functions ----
// Fuel Logs
export const fetchFuelLogs = (vehicleId: string): Promise<FuelLogEntry[]> => apiFetch(`/api/fuel?vehicleId=${vehicleId}`);
export const createFuelLog = (data: Omit<FuelLogEntry, 'id' | 'timestamp'>): Promise<FuelLogEntry> => apiFetch('/api/fuel', { method: 'POST', body: JSON.stringify(data) });
export const updateFuelLog = (data: FuelLogEntry): Promise<{ fuelLog: FuelLogEntry }> => apiFetch('/api/fuel', { method: 'PUT', body: JSON.stringify(data) });
export const deleteFuelLog = (vehicleId: string, id: string): Promise<{ message: string }> => apiFetch('/api/fuel', { method: 'DELETE', body: JSON.stringify({ vehicleId, id }) });

// Maintenance Tasks
export const fetchMaintenanceTasks = (assetId?: string): Promise<MaintenanceTask[]> => {
  const url = assetId ? `/api/maintenance?assetId=${assetId}` : '/api/maintenance';
  return apiFetch(url);
};
export const createMaintenanceTask = (data: Omit<MaintenanceTask, 'id' | 'timestamp'>): Promise<MaintenanceTask> => apiFetch('/api/maintenance', { method: 'POST', body: JSON.stringify(data) });
export const updateMaintenanceTask = (data: MaintenanceTask): Promise<{ maintenanceTask: MaintenanceTask }> => apiFetch('/api/maintenance', { method: 'PUT', body: JSON.stringify(data) });
export const deleteMaintenanceTask = (id: string): Promise<{ message: string }> => apiFetch('/api/maintenance', { method: 'DELETE', body: JSON.stringify({ id }) });
