# KamperHub Development Roadmap

This document tracks the development priorities, future features, and completed milestones for the KamperHub application.

---

## **Current Priorities**

### 1. Stability & Bug Fixing
*   **Objective:** Resolve persistent data loading and authentication issues to ensure a stable and reliable user experience on the new server-based infrastructure.
*   **Key Areas:**
    *   Investigate and fix errors preventing vehicle, caravan, and WDH data from loading on the `/vehicles` page.
    *   Address any remaining `Unauthorized: Invalid ID token` or `client is offline` errors.
    *   Ensure all user preferences and settings load correctly for all user types (including admin).

### 2. New Feature Development
*   **Objective:** Begin implementing new, high-value features now that the core data migration is complete.
*   **Next Up:**
    *   **Fuel Log & Maintenance Tracker:** Build the user interface for logging fuel and tracking vehicle/caravan maintenance tasks. The backend APIs for this are already in place.
    *   **AI-Powered Packing Assistant:** Create a Genkit flow to help users generate packing lists based on trip details.

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

### High-Impact Performance Overhaul
Based on industry best practices for Firebase and Next.js, this multi-phase plan will significantly improve the application's loading speed and responsiveness.

**Phase 1: Server-Side Data Fetching (Core Strategy)**
*   **The Problem:** Data-heavy pages currently show loading skeletons while the client fetches data, causing a noticeable delay.
*   **The Solution:** Implement server-side data fetching using Next.js Server Components.
    1.  **Pre-fetch Data on the Server:** When a page like `/vehicles` or `/inventory` is requested, the server will gather all necessary data from Firestore in a single, efficient operation.
    2.  **Eliminate Initial Loading States:** The page will be sent to the browser with data already included, making content appear almost instantly and improving the perceived performance.
    3.  **Retain Dynamic Updates:** The application will continue using TanStack Query for dynamic client-side updates after the initial fast load.

**Phase 2: Advanced Caching & CDN Optimization**
*   **The Problem:** While Firebase Hosting's CDN is automatic, we can optimize it further.
*   **The Solution:** Implement custom `Cache-Control` headers in `next.config.js`.
    1.  **Immutable Caching:** Set long-duration cache headers for static assets that have hashed names (e.g., JS/CSS chunks), telling browsers and the CDN to cache them for up to a year.
    2.  **Stale-While-Revalidate:** For server-rendered pages, use `stale-while-revalidate` headers to serve cached content instantly while fetching fresh data in the background.

**Phase 3: Frontend Asset Optimization**
*   **The Problem:** Large images and initial JavaScript bundles can slow down rendering.
*   **The Solution:** Ensure rigorous adherence to frontend best practices.
    1.  **Image Optimization:** Ensure every `next/image` component has explicit `width`, `height`, and `priority` props where appropriate to prevent layout shift and optimize loading.
    2.  **Component-Level Code Splitting:** Continue using `next/dynamic` to lazy-load large components (like the Trip Planner map) that are not critical for the initial page view.

**Phase 4: Backend & Genkit Flow Optimization**
*   **The Problem:** Serverless functions (like Genkit flows) can experience "cold starts," causing delays in AI-powered features.
*   **The Solution:** Optimize backend function performance.
    1.  **Dependency Pruning:** Review Genkit flows to ensure they only import the exact modules needed for their specific task, reducing cold start times.
    2.  **Minimum Instances (Future Scaling):** As traffic grows, for latency-sensitive functions like the chatbot, configure a minimum number of instances in `apphosting.yaml` to keep them "warm" and ready for instant responses.

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
