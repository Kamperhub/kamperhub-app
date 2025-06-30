
# KamperHub Development Roadmap

This document tracks the development priorities, future features, and completed milestones for the KamperHub application.

---

## **Current Priorities**

### 1. New Feature Development
*   **Objective:** Implement new, high-value features on the stable server-based infrastructure.
*   **Next Up:**
    *   **Fuel Log Toast Action:** Ensure the "Add Category" button in the "Missing 'Fuel' Category" error message correctly navigates the user to the trip planner.

### 2. In Progress
*   **AI-Powered Packing Assistant:**
    *   **Status:** Initial version complete.
    *   **Features:**
        *   New "Trip Packing" page added to navigation.
        *   Genkit flow created to generate packing lists based on trip details (destination, duration, activities, passenger count).
        *   UI allows users to select a trip, generate a list, and manage items (add, edit, delete, check-off).
    *   **Next Steps:**
        *   Implement saving/loading of packing lists to Firestore.
        *   Add reusable packing templates.
        *   Integrate with weather APIs for smarter suggestions.
        *   Explore collaborative packing features.

---

## **Completed Milestones**

### ✅ **Project: Migrate from LocalStorage to Firestore**

*   **Status:** Complete
*   **Objective:** Move all application data from the browser's `localStorage` to Firebase Firestore to provide a persistent, synchronized, and backed-up user experience.

#### **Phase 1: Backend Setup & API Development (Complete)**
*   Defined Firestore data structures for all user-specific models under `/users/{userId}`.
*   Created secure API endpoints for all CRUD (Create, Read, Update, Delete) operations for Vehicles, Caravans, WDHs, Inventory, Trips, Bookings, and User Preferences.

#### **Phase 2: Frontend Refactoring (Complete)**
*   Refactored all relevant pages and components (`/vehicles`, `/inventory`, `/trip-expense-planner`, `/triplog`, `/checklists`, `/bookings`, `/`) to use `react-query` for server state management.
*   All UI components now fetch and mutate data via the new API endpoints instead of directly accessing `localStorage`.

#### **Phase 3: One-Time Data Migration (Complete & Obsolete)**
*   A one-time migration path was established to move existing user data from localStorage.
*   The `/api/migrate-local-storage` endpoint, used for this one-time migration, is now obsolete and has been removed.

---

## Future Development Ideas

This section tracks potential new features and enhancements for future consideration.

### Core Functionality Enhancements

*   **Multi-Stop Trip Planning:**
    *   Allow users to add multiple intermediate waypoints to their trips in the Trip Planner.
    *   Display the full multi-stop route on the map.
    *   Calculate total distance, duration, and fuel estimates for the entire multi-leg journey.
    *   Update the Trip Log to clearly represent and recall multi-stop trips.

*   **Advanced Weight Distribution Calculator:**
    *   Enhance the Inventory & Weight Management section with a more precise calculator for Tow Ball Mass (TBM).
    *   Allow users to specify the exact longitudinal position of items within defined storage locations (or even general areas like "front," "middle," "rear" of the caravan).
    *   Use these positions and weights to provide a more accurate TBM estimation than the current simple percentage of payload.

### User Experience & Engagement

*   **Enhanced Rewards & Gamification:**
    *   Implement the "Rewards Program" outlined in `/rewards`.
    *   Introduce badges or achievements for milestones (e.g., total distance traveled, number of trips completed, types of sites visited).
    *   Potentially add a points system that could unlock minor perks or cosmetic customizations.

*   **Community Features (Phase 1 - Sharing):**
    *   Allow users to (optionally) share saved trips (anonymized or with attribution) with other KamperHub users.
    *   Enable sharing of public campsite reviews or tips.

*   **Offline Checklists:**
    *   Investigate options for making checklists (especially for an active trip) available and modifiable offline, with syncing when connectivity is restored.

### AI & Automation

*   **AI-Powered Trip Suggestions:**
    *   Based on user preferences (e.g., type of travel, interests, past trips), suggest potential destinations or routes.
    *   Integrate with the Chatbot to help users plan trips conversationally.

*   **Automated Maintenance Reminders:**
    *   Allow users to log caravan/vehicle service dates and set reminders for common maintenance tasks (e.g., tyre checks, bearing services) based on time or distance traveled (if GPS tracking were ever implemented).

### Newly Suggested Feature Ideas

*   **Internal Campsite/POI Review & Rating System:**
    *   Allow users to write personal reviews, give star ratings, and upload photos for campsites or POIs.
    *   Initially stored locally, with potential for cloud sync and community sharing later.
    *   Could integrate with Trip Log and Bookings.

*   **Travel Journaling & Photo Gallery per Trip:**
    *   Within the Trip Log, allow users to add daily journal entries and upload/link a few photos for each trip to capture memories.
