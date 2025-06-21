# Future Development Ideas for KamperHub

This document tracks potential new features and enhancements for the KamperHub application.

## Core Functionality Enhancements

*   **Multi-Stop Trip Planning:**
    *   Allow users to add multiple intermediate waypoints to their trips in the Trip Planner.
    *   Display the full multi-stop route on the map.
    *   Calculate total distance, duration, and fuel estimates for the entire multi-leg journey.
    *   Update the Trip Log to clearly represent and recall multi-stop trips.

*   **Cloud Data Sync & Backup:**
    *   Migrate user-specific data (Vehicles, Caravans, WDHs, Inventory, Trip Logs, Checklists, Bookings, Dashboard Layout) from `localStorage` to a cloud-based backend (e.g., Firestore).
    *   This would enable data persistence across devices and browsers, and provide a backup.

*   **Advanced Weight Distribution Calculator:**
    *   Enhance the Inventory & Weight Management section with a more precise calculator for Tow Ball Mass (TBM).
    *   Allow users to specify the exact longitudinal position of items within defined storage locations (or even general areas like "front," "middle," "rear" of the caravan).
    *   Use these positions and weights to provide a more accurate TBM estimation than the current simple percentage of payload.

## User Experience & Engagement

*   **Enhanced Rewards & Gamification:**
    *   Implement the "Rewards Program" outlined in `/rewards`.
    *   Introduce badges or achievements for milestones (e.g., total distance traveled, number of trips completed, types of sites visited).
    *   Potentially add a points system that could unlock minor perks or cosmetic customizations.

*   **Community Features (Phase 1 - Sharing):**
    *   Allow users to (optionally) share saved trips (anonymized or with attribution) with other KamperHub users.
    *   Enable sharing of public campsite reviews or tips.

*   **Offline Checklists:**
    *   Investigate options for making checklists (especially for an active trip) available and modifiable offline, with syncing when connectivity is restored.

## AI & Automation

*   **AI-Powered Trip Suggestions:**
    *   Based on user preferences (e.g., type of travel, interests, past trips), suggest potential destinations or routes.
    *   Integrate with the Chatbot to help users plan trips conversationally.

*   **Automated Maintenance Reminders:**
    *   Allow users to log caravan/vehicle service dates and set reminders for common maintenance tasks (e.g., tyre checks, bearing services) based on time or distance traveled (if GPS tracking were ever implemented).

## Newly Suggested Feature Ideas

*   **Internal Campsite/POI Review & Rating System:**
    *   Allow users to write personal reviews, give star ratings, and upload photos for campsites or POIs.
    *   Initially stored locally, with potential for cloud sync and community sharing later.
    *   Could integrate with Trip Log and Bookings.

*   **Fuel Log & Basic Maintenance Tracker:**
    *   **Fuel Log:** Users log fuel fill-ups (date, odometer, liters, price, location) to calculate actual fuel consumption.
    *   **Maintenance Tracker:** Log important maintenance tasks for tow vehicle and caravan (oil changes, services, certificate expiries) with dates, costs, and notes.

*   **Travel Journaling & Photo Gallery per Trip:**
    *   Within the Trip Log, allow users to add daily journal entries and upload/link a few photos for each trip to capture memories.

*   **AI-Powered Packing Assistant:**
    *   Utilize Genkit to create a flow that suggests packing items based on user input (trip duration, destination type, season, number of people).
    *   Could integrate with Inventory or Checklists features.

## Plan: Migrating from LocalStorage to Firestore

This plan outlines the steps required to move application data from the browser's `localStorage` to Firebase Firestore, providing a persistent, synchronized, and backed-up user experience.

### **Phase 1: Backend Setup & API Development**

The goal of this phase is to create secure API endpoints for all data management (CRUD - Create, Read, Update, Delete) operations. This abstracts Firestore logic from the frontend components.

1.  **Define Firestore Data Structure:**
    All user-specific data will be stored in subcollections under the existing `/users/{userId}` document.
    *   `/users/{userId}/vehicles/{vehicleId}` - Stores `StoredVehicle` objects.
    *   `/users/{userId}/caravans/{caravanId}` - Stores `StoredCaravan` objects, including `storageLocations` and `waterTanks`.
    *   `/users/{userId}/wdhs/{wdhId}` - Stores `StoredWDH` objects.
    *   `/users/{userId}/inventories/{caravanId}` - A document per caravan, containing an array of its `InventoryItem`s.
    *   `/users/{userId}/trips/{tripId}` - Stores `LoggedTrip` objects, including their unique `TripChecklistSet`.
    *   `/users/{userId}/bookings/{bookingId}` - Stores `BookingEntry` objects.
    *   The main `/users/{userId}` document will be updated to store user preferences:
        *   `activeVehicleId: string | null`
        *   `activeCaravanId: string | null`
        *   `activeWdhId: string | null`
        *   `dashboardLayout: string[] | null` (array of hrefs)
        *   `caravanWaterLevels: Record<string, Record<string, number>> | null` (e.g., `{ caravanId1: { tankId1: 80, tankId2: 50 } }`)
        *   `caravanDefaultChecklists: Record<string, CaravanDefaultChecklistSet> | null` (keyed by caravanId)

2.  **Create API Routes:**
    For each data type, create a new API route folder under `src/app/api/`. These routes will handle requests from the frontend, validate user authentication using the ID token, and interact with Firestore.
    *   `/api/vehicles/` -> `route.ts` (GET, POST, PUT, DELETE)
    *   `/api/caravans/` -> `route.ts` (GET, POST, PUT, DELETE)
    *   `/api/wdhs/` -> `route.ts` (GET, POST, PUT, DELETE)
    *   `/api/inventory/[caravanId]/` -> `route.ts` (GET, PUT)
    *   `/api/trips/` -> `route.ts` (GET, POST, PUT, DELETE)
    *   `/api/bookings/` -> `route.ts` (GET, POST, PUT, DELETE)
    *   `/api/user-preferences/` -> `route.ts` (GET, PUT) - To manage active IDs and dashboard layout.

### **Phase 2: Frontend Refactoring**

This phase involves updating the UI components to use the new APIs instead of directly accessing `localStorage`. The `react-query` library (already in `package.json`) should be used to manage server state, caching, and mutations.

1.  **Refactor Vehicle & Caravan Management (`/vehicles`):**
    *   In `src/components/features/vehicles/VehicleManager.tsx`, `CaravanManager.tsx`, and `WDHManager.tsx`:
        *   Replace `localStorage.getItem` with a `useQuery` hook to fetch data from the corresponding API endpoint (e.g., `useQuery(['vehicles'], fetchVehicles)`).
        *   Replace `localStorage.setItem` in save/delete handlers with `useMutation` hooks that call the API (e.g., `useMutation(deleteVehicle)`).
        *   The "Set Active" functionality will now call the `/api/user-preferences/` endpoint.

2.  **Refactor Inventory (`/inventory`):**
    *   In `src/app/inventory/page.tsx`, fetch active vehicle/caravan specs from their respective `useQuery` hooks.
    *   In `src/components/features/inventory/InventoryList.tsx`:
        *   Fetch the inventory for the active caravan using `useQuery(['inventory', activeCaravanId], fetchInventory)`.
        *   All inventory updates will use a mutation to send the entire updated list to `/api/inventory/[caravanId]`.
        *   Water tank level updates will call the `/api/user-preferences/` endpoint.

3.  **Refactor Trip Planner, Log, and Checklists (`/tripplanner`, `/triplog`, `/checklists`):**
    *   In `src/app/triplog/page.tsx`, fetch all trips with `useQuery(['trips'], fetchTrips)`. Delete/recall actions will use mutations.
    *   In `src/app/checklists/page.tsx`, fetch the required trip or caravan data via `useQuery`. Checklist updates will now be part of the PUT request for the associated trip or caravan document.
    *   In `src/components/features/triplanner/TripPlannerClient.tsx`, the "Save Trip" function will use a `useMutation` hook to POST the new trip to `/api/trips/`.

4.  **Refactor Bookings (`/bookings`):**
    *   In `src/app/bookings/page.tsx`, replace `localStorage` calls with `useQuery` and `useMutation` hooks pointing to the `/api/bookings/` API.

5.  **Refactor Dashboard (`/`):**
    *   In `src/app/page.tsx`, fetch the user's saved dashboard layout from `/api/user-preferences/`. The drag-and-drop handler will use a mutation to save the new layout order.

### **Phase 3: One-Time Data Migration**

This is a critical step to ensure existing users don't lose their data.

1.  **Create a Migration API Endpoint:**
    *   Create a one-time endpoint: `/api/migrate-local-storage`.
    *   This endpoint will accept a POST request containing a JSON object with all the user's data extracted from `localStorage`.
    *   It will validate the data and populate the user's Firestore collections accordingly.

2.  **Implement Client-Side Migration Logic:**
    *   In a central component like `src/components/layout/AppShell.tsx` or triggered upon login:
        *   Check if a migration flag (e.g., `localStorage.getItem('kamperhub_firestore_migrated')`) is set. If it is, do nothing.
        *   If the flag is not set, read all known KamperHub keys from `localStorage`.
        *   If any data exists, send it to the `/api/migrate-local-storage` endpoint.
        *   Upon a successful response (HTTP 200), set the `kamperhub_firestore_migrated` flag to `true` in `localStorage`.
        *   Optionally, after a successful migration, the client-side script could then clear the old KamperHub `localStorage` keys to free up space.

This phased approach ensures a structured and non-disruptive transition from `localStorage` to a robust, server-based data persistence model.
