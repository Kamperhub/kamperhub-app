'use client';

import { auth } from './firebase';

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

// ---- Consolidated Page Data Fetchers ----
export const fetchAllVehicleData = () => apiFetch('/api/all-vehicle-data');
export const fetchBookingsPageData = () => apiFetch('/api/bookings-page-data');


// ---- Vehicle API Functions ----
export const createVehicle = (data: any) => apiFetch('/api/vehicles', { method: 'POST', body: JSON.stringify(data) });
export const updateVehicle = (data: any) => apiFetch('/api/vehicles', { method: 'PUT', body: JSON.stringify(data) });
export const deleteVehicle = (id: string) => apiFetch('/api/vehicles', { method: 'DELETE', body: JSON.stringify({ id }) });
export const fetchVehicles = () => apiFetch('/api/vehicles');

// ---- Caravan API Functions ----
export const createCaravan = (data: any) => apiFetch('/api/caravans', { method: 'POST', body: JSON.stringify(data) });
export const updateCaravan = (data: any) => apiFetch('/api/caravans', { method: 'PUT', body: JSON.stringify(data) });
export const deleteCaravan = (id: string) => apiFetch('/api/caravans', { method: 'DELETE', body: JSON.stringify({ id }) });
export const fetchCaravans = () => apiFetch('/api/caravans');

// ---- Inventory API Functions ----
export const fetchInventory = (caravanId: string) => apiFetch(`/api/inventory/${caravanId}`);
export const updateInventory = (payload: { caravanId: string; items: any[] }) => apiFetch(`/api/inventory/${payload.caravanId}`, { method: 'PUT', body: JSON.stringify(payload.items) });

// ---- Trip API Functions ----
export const fetchTrips = () => apiFetch('/api/trips');
export const createTrip = (data: any) => apiFetch('/api/trips', { method: 'POST', body: JSON.stringify(data) });
export const updateTrip = (data: any) => apiFetch('/api/trips', { method: 'PUT', body: JSON.stringify(data) });
export const deleteTrip = (id: string) => apiFetch(`/api/trips`, { method: 'DELETE', body: JSON.stringify({ id }) });
export const copyTripToJourney = (payload: { sourceTripId: string; destinationJourneyId: string }) => apiFetch('/api/trips/copy', { method: 'POST', body: JSON.stringify(payload) });

// ---- Journey API Functions ----
export const fetchJourneys = () => apiFetch('/api/journeys');
export const createJourney = (data: any) => apiFetch('/api/journeys', { method: 'POST', body: JSON.stringify(data) });
export const updateJourney = (data: any) => apiFetch('/api/journeys', { method: 'PUT', body: JSON.stringify(data) });
export const deleteJourney = (id: string) => apiFetch('/api/journeys', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- Booking API Functions ----
export const fetchBookings = () => apiFetch('/api/bookings');
export const createBooking = (data: any) => apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify(data) });
export const updateBooking = (data: any) => apiFetch('/api/bookings', { method: 'PUT', body: JSON.stringify(data) });
export const deleteBooking = (id: string) => apiFetch('/api/bookings', { method: 'DELETE', body: JSON.stringify({ id }) });

// ---- Document API Functions ----
export const fetchDocuments = () => apiFetch('/api/documents');
export const createDocument = (data: any) => apiFetch('/api/documents', { method: 'POST', body: JSON.stringify(data) });
export const updateDocument = (data: any) => apiFetch('/api/documents', { method: 'PUT', body: JSON.stringify(data) });
export const deleteDocument = (id: string) => apiFetch('/api/documents', { method: 'DELETE', body: JSON.stringify({ id }) });


// ---- User Preferences API ----
export const fetchUserPreferences = () => apiFetch('/api/user-preferences');
export const updateUserPreferences = (preferences: any) => apiFetch('/api/user-preferences', { method: 'PUT', body: JSON.stringify(preferences) });

// ---- Packing List API Functions ----
export const fetchPackingList = (tripId: string) => apiFetch(`/api/packing-list/${tripId}`);
export const updatePackingList = (payload: { tripId: string; list: any[] }) => apiFetch(`/api/packing-list/${payload.tripId}`, { method: 'PUT', body: JSON.stringify(payload.list) });
export const deletePackingList = (tripId: string) => apiFetch(`/api/packing-list/${tripId}`, { method: 'DELETE' });

// ---- Admin & Auth Functions ----
export const fetchAllUsers = () => apiFetch('/api/admin/list-users');
export const generateGoogleAuthUrl = () => apiFetch('/api/auth/google/connect', { method: 'POST' });
export const disconnectGoogleAccount = () => apiFetch('/api/auth/google/disconnect', { method: 'POST' });
