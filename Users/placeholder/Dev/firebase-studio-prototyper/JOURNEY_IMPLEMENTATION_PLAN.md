
# KamperHub "Journey" Feature Implementation Plan

This document outlines the phased, step-by-step implementation of the new "Journey" feature, replacing the previous multi-stop waypoint system. Each phase will be implemented and approved sequentially to ensure stability and quality.

---

## **Phase 1: Foundation Cleanup & Simplification**

**Objective:** Remove the buggy waypoint system to create a stable foundation for the new architecture.

-   [x] **UI:** Remove the "Add Waypoint" button and associated form fields from the Trip Planner client component (`TripPlannerClient.tsx`).
-   [x] **API:** Simplify the Directions API (`/api/directions/route.ts`) to only accept a single start and end location. Remove all waypoint processing logic.
-   [x] **Data Types:** Update the core `LoggedTrip` and `TripPlannerFormValues` types in `src/types/tripplanner.ts` to remove the `waypoints` array. This ensures type safety across the application.
-   **Verification:** Confirm that the Trip Planner now correctly calculates a simple A-to-B route and that all UI elements related to waypoints are gone.

---

## **Phase 2: Core Journey Feature & Master Map**

**Objective:** Implement the backend and frontend for creating and viewing Journeys, including the master map view.

-   [x] **Data Model:**
    -   [x] Define a new `Journey` type in a new file `src/types/journey.ts`. It will include an ID, name, description, and an array of `tripIds`.
    -   [x] Update the `LoggedTrip` type to include an optional `journeyId` field.
-   [x] **Backend API:**
    -   [x] Create a new API endpoint group at `/api/journeys` for CRUD (Create, Read, Update, Delete) operations on Journey documents.
    -   [ ] Implement the "Set and Forget" logic on the server: When a Journey is updated (e.g., a trip is added), the server will calculate and save a single, combined `masterPolyline` to the Journey document. **(Note: Polyline stitching logic deferred pending library availability)**
-   [x] **Frontend UI:**
    -   [x] Create a new page at `/journeys` to list all created Journeys.
    -   [x] Create a new page at `/journeys/[journeyId]` to display the details of a single Journey.
    -   [x] Implement the "Journey Map" on the `[journeyId]` page, which will initially render the `masterPolyline` for fast loading.
    -   [x] Add UI for creating a new Journey and adding existing (or new) Trips to it.
-   **Verification:** A user can create a Journey, add several individual Trips to it, and see the entire combined route displayed correctly on the Journey Map.

---

## **Phase 3: Financials & Packing Integration**

**Objective:** Integrate the financial and packing features into the Journey model.

-   [ ] **Financials:**
    -   [ ] On the Journey details page, implement the logic to fetch all associated trips and calculate the aggregated "Total Journey Budget" and "Total Journey Spend."
    -   [ ] Display these aggregated totals in a new "Journey Financials" summary card.
-   [ ] **Packing Assistant:**
    -   [ ] **Trip-Level (Tactical):** Confirm the existing Packing Assistant works correctly on a per-trip basis within a journey.
    -   [ ] **Journey-Level (Strategic):** Implement the new "AI Packing Planner" on the Journey details page. This AI flow will take the *entire* journey's details as input and produce a high-level strategic packing plan (e.g., "Pack winter clothes in long-term storage until you reach Victoria").
-   **Verification:** A user can view the total cost of a journey and can generate both a strategic packing plan for the whole journey and a tactical checklist for each individual leg.

---

## **Phase 4: World Map Overview (Future Enhancement)**

**Objective:** Create a global map view of all travel history. This will be treated as a separate, major feature post-Journey implementation.

-   [ ] **Scope:** Design a new page at `/world-map`.
-   [ ] **Performance Strategy:** Implement performance-first data loading, such as map-bound data fetching and trip clustering, to handle a large number of logged trips without slowing down the UI.
-   [ ] **UI:** Design the map interface to be clean and interactive, allowing users to click on clusters to zoom in and reveal individual trip routes.

---
