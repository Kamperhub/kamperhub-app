
'use client';

import { auth } from './firebase';
import type { StoredVehicle, VehicleFormData } from '@/types/vehicle';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import type { StoredWDH, WDHFormData } from '@/types/wdh';
import type { InventoryItem } from '@/types/inventory';
import type { LoggedTrip, TripPlannerFormValues } from '@/types/tripplanner';
import type { BookingEntry } from '@/types/booking';
import type { UserProfile } from '@/types/auth';
import type { FuelLogEntry, MaintenanceTask } from '@/types/service';

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    // This will be caught by react-query's error handling if a query is enabled without a user.
    throw new Error('User not authenticated. Cannot make API call.');
  }
  return user.getIdToken(true);
}

// ---- Generic Fetcher ----
async function apiFetch(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
    // Try to get more detailed error from server response
    const errorMessage = errorData.error || errorData.details || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  // Handle cases where response might be empty (e.g., DELETE 204 No Content)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
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
