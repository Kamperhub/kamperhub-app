# KamperHub "Journey" Feature Implementation Plan

This document outlines the phased, step-by-step implementation of the new "Journey" feature, replacing the previous multi-stop waypoint system. Each phase will be implemented and approved sequentially to ensure stability and quality. This plan has been updated to include critical technical considerations for performance, security, and data consistency.

---

## **Phase 1: Foundation Cleanup & Simplification**

**Objective:** Remove the buggy waypoint system to create a stable, clean foundation for the new architecture.

-   [x] **UI:** Remove the "Add Waypoint" button and associated form fields from the Trip Planner client component (`TripPlannerClient.tsx`).
-   [x] **API:** Simplify the Directions API (`/api/directions/route.ts`) to only accept a single start and end location. Remove all waypoint processing logic.
-   [x] **Data Types:** Update the core `LoggedTrip` and `TripPlannerFormValues` types in `src/types/tripplanner.ts` to remove the `waypoints` array.
-   [x] **CRITICAL - Data Migration:** Implement a one-time script or server function to iterate through all existing `LoggedTrip` documents in Firestore and remove the now-obsolete `waypoints` field using `FieldValue.delete()`. This prevents "dead data" and potential client-side errors.
-   [x] **CRITICAL - Security Rules:** Review and remove any Firestore security rules that specifically validated the old `waypoints` array structure.

**Verification:** The Trip Planner correctly calculates a simple A-to-B route. All UI related to waypoints is gone. The Firestore database no longer contains `waypoints` fields on trip documents.

---

## **Phase 2: Core Journey Feature & Master Map**

**Objective:** Implement the backend and frontend for creating and viewing Journeys, including the master map view.

-   [x] **Data Model:**
    -   [x] Define a new `Journey` type in `src/types/journey.ts`. It will include an ID, name, description, an array of `tripIds`, and a `masterPolyline` field (initially null).
    -   [x] Update the `LoggedTrip` type in `src/types/tripplanner.ts` to include an optional `journeyId` string field.
-   [x] **Backend API & Logic (`/api/journeys`):**
    -   [x] Create API endpoints for CRUD (Create, Read, Update, Delete) operations on Journey documents.
    -   [x] **Polyline Calculation:** Implement the "Set and Forget" logic. When a Journey's `tripIds` array is updated (via the `/api/trips` route), the server will fetch the corresponding trips and stitch their polylines together into a single `masterPolyline`.
        -   **Note on Performance:** For this prototype, the stitching will happen within the API route. In a production environment, this would be offloaded to a Cloud Function to keep the API response fast.
        -   **Note on Firestore Limits:** Be mindful of the 1MB Firestore document size limit for very long, complex `masterPolyline` strings.
-   [x] **Data Consistency:**
    -   [x] When a trip is deleted, its ID must be removed from its parent Journey's `tripIds` array. This will be handled within the `/api/trips` DELETE endpoint.
    -   [x] **(Future Enhancement):** For full robustness, a Cloud Function triggered on `LoggedTrip` updates could re-calculate the `masterPolyline` if a trip's route changes after it's been added to a journey. This is deferred for now.
-   [x] **CRITICAL - Firestore Security Rules:**
    -   [x] Implement new rules for the `/users/{userId}/journeys/{journeyId}` collection to ensure users can only access their own journeys.
    -   [x] Rules must validate that a user can only add `tripIds` to a journey that they themselves own.
-   [x] **Frontend UI:**
    -   [x] Create a new page at `/journeys` to list all created Journeys.
    -   [x] Create a new dynamic page at `/journeys/[journeyId]` to display a Journey's details.
    -   [x] On the `[journeyId]` page, implement the "Journey Map" that renders the `masterPolyline`.
    -   [x] On the Trip Planner page, add a dropdown to assign a new or recalled trip to an existing Journey.
-   [x] **UI Feedback:** The Journey details page UI should show a "Calculating Route..." state if the `masterPolyline` is being generated asynchronously (relevant for future Cloud Function implementation).

**Verification:** A user can create a Journey, add trips to it, and see the combined route on the Journey Map. All security rules prevent cross-user data access.

---

## **Phase 3: Financials & Packing Integration**

**Objective:** Integrate the financial and packing features into the Journey model.

-   [x] **Financials:**
    -   [x] **Server-Side Aggregation:** To improve performance and reduce cost, financial totals for a Journey will be calculated and stored directly on the `Journey` document.
        -   **Implementation:** When a trip's `budget` or `expenses` change, a server-side process (initially in the API, ideally a Cloud Function) will be triggered to update `totalJourneyBudget` and `totalJourneySpend` fields on the parent `Journey` document.
    -   [x] **UI:** The Journey details page will display these aggregated totals from the Journey document for a fast, efficient user experience.
-   [x] **Packing Assistant:**
    -   [x] **Trip-Level (Tactical):** Confirm the existing Packing Assistant works correctly on a per-trip basis within a journey.
    -   [x] **Journey-Level (Strategic):** Implement the new "AI Packing Planner" on the Journey details page. This AI flow will take the *entire* journey's details as input and produce a high-level strategic packing plan.
    -   [x] **CRITICAL - Security:** Ensure all AI functionality is handled through secure, server-side Genkit flows (as is current practice), with no API keys ever exposed to the client.

**Verification:** A user can view the total cost of a journey and can generate both a strategic packing plan for the whole journey and a tactical checklist for each individual leg.

---

## **Phase 4: World Map Overview (Future Enhancement)**

**Objective:** Create a global map view of all travel history. This will be treated as a separate, major feature post-Journey implementation.

-   [x] **Scope:** Design a new page at `/world-map`.
-   [x] **Performance Strategy:** Implement performance-first data loading, such as map-bound data fetching and trip clustering, to handle a large number of logged trips without slowing down the UI.
-   [x] **UI:** Design the map interface to be clean and interactive, allowing users to click on clusters to zoom in and reveal individual trip routes.

---
