
'use client';

import { auth, appCheck } from './firebase';
import { getToken } from 'firebase/app-check';
import type { StoredVehicle, VehicleFormData } from '@/types/vehicle';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import type { InventoryItem } from '@/types/inventory';
import type { LoggedTrip, TripPlannerFormValues } from '@/types/tripplanner';
import type { BookingEntry } from '@/types/booking';
import type { UserProfile } from '@/types/auth';
import type { FuelLogEntry, MaintenanceTask } from '@/types/service';
import type { PackingListCategory } from '@/types/packing';

// ---- Generic Fetcher ----
async function apiFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated. Cannot make API call.');
    }

    const headers = new Headers(options.headers || {});

    const authToken = await user.getIdToken(true);
    headers.set('Authorization', `Bearer ${authToken}`);

    if (appCheck) {
      try {
        const appCheckTokenResponse = await getToken(appCheck, false);
        headers.set('X-Firebase-AppCheck', appCheckTokenResponse.token);
      } catch (err: any) {
        console.warn("App Check getToken() failed. Proceeding without App Check token.", err);
      }
    }
    
    if (options.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers, signal: controller.signal });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorInfo = `Request to ${url} failed with status ${response.status}.`;
      
      try {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          const errorMessage = errorData.error || errorData.message || 'No specific error message provided.';
          const errorDetails = errorData.details ? ` Details: ${JSON.stringify(errorData.details, null, 2)}` : '';
          errorInfo = `${errorMessage}${errorDetails}`;
        } catch (jsonError) {
          if (errorText.toLowerCase().includes('<html')) {
             errorInfo = `Server returned an HTML error page, which indicates a critical backend crash. Status: ${response.status}. Check server logs.`;
          } else {
             errorInfo = `Server returned a non-JSON response. Status: ${response.status}. Body: ${errorText.substring(0, 500)}`;
          }
        }
      } catch (e) {
        errorInfo = `Request failed with status ${response.status}. Could not read response body.`;
      }

      console.error("API Fetch Error Details:", errorInfo);
      throw new Error(errorInfo);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }
    return;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`API Fetch Error: Request to ${url} timed out after 15 seconds.`);
      throw new Error(`The request to the server timed out. This could be due to a server-side problem. Please try again.`);
    }
    // Re-throw other errors
    throw error;
  }
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

// ---- WDH API (Obsolete - kept for reference if needed, but should not be used) ----
export const fetchWdhs = async (): Promise<any[]> => { console.warn("fetchWdhs is obsolete."); return Promise.resolve([]); };
export const createWdh = async (data: any): Promise<any> => { console.warn("createWdh is obsolete."); return Promise.reject(new Error("Obsolete")); };
export const updateWdh = async (data: any): Promise<any> => { console.warn("updateWdh is obsolete."); return Promise.reject(new Error("Obsolete")); };
export const deleteWdh = async (id: string): Promise<any> => { console.warn("deleteWdh is obsolete."); return Promise.reject(new Error("Obsolete")); };


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

// ---- Packing List API Functions ----
export const fetchPackingList = (tripId: string): Promise<{ list: PackingListCategory[] }> => apiFetch(`/api/packing-list/${tripId}`);
export const updatePackingList = (payload: { tripId: string; list: PackingListCategory[] }): Promise<{ message: string }> => apiFetch(`/api/packing-list/${payload.tripId}`, { method: 'PUT', body: JSON.stringify(payload.list) });
export const deletePackingList = (tripId: string): Promise<{ message: string }> => apiFetch(`/api/packing-list/${tripId}`, { method: 'DELETE' });

// ---- Admin API Functions ----
export const fetchAllUsers = (): Promise<{uid: string, email: string | undefined}[]> => apiFetch('/api/admin/list-users');
