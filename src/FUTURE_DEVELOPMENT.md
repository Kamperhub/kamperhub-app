
# KamperHub Development Roadmap

This document tracks the development priorities, future features, and completed milestones for the KamperHub application.

---

## **Current Priorities**

### 1. Stability & Bug Fixing
*   **Objective:** Resolve persistent data loading and authentication issues to ensure a stable and reliable user experience on the new server-based infrastructure.
*   **Key Areas:**
    *   **Chatbot Auto-Scroll:** The chatbot interface does not automatically scroll to the newest message, creating a poor user experience. This needs a reliable fix.
    *   Revisit and implement a functional, user-friendly date-range picker on the Bookings page.
    *   Investigate and fix errors preventing vehicle, caravan, and WDH data from loading on the `/vehicles` page.
    *   Address any remaining `Unauthorized: Invalid ID token` or `client is offline` errors.
    *   Ensure all user preferences and settings load correctly for all user types (including admin).
    *   **Fuel Log Toast Action:** Ensure the "Add Category" button in the "Missing 'Fuel' Category" error message correctly navigates the user to the trip planner.

### 2. New Feature Development
*   **Objective:** Begin implementing new, high-value features.
*   **Next Up:**
    *   **Fuel Log & Maintenance Tracker:** Build the user interface for logging fuel and tracking vehicle/caravan maintenance tasks. The backend APIs for this are already in place.

---

## **Completed Milestones**

### ✅ **Feature: Height-Aware Trip Routing**
*   **Status:** Complete
*   **Objective:** Ensure trips planned in the app consider vehicle height to avoid low clearance obstacles.
*   **Details:** The Trip Planner now uses Google's advanced Routes API via a secure backend endpoint. It automatically includes the height of the active vehicle/caravan in route calculations and will display warnings for any potential height restrictions, such as low bridges.

### ✅ **Feature: Advanced Weight Distribution Calculator**
*   **Status:** Complete
*   **Objective:** Provide a more accurate, physics-based calculation for Tow Ball Mass (TBM).
*   **Details:** The Inventory & Weight Management calculator now uses a moment-based calculation based on the precise location of inventory items, water, and gas relative to the caravan's axles. This replaces the previous simple percentage-based estimate, providing a much more accurate TBM figure.

### ✅ **Feature: Vehicle-Only Trip Planning**
*   **Status:** Complete
*   **Objective:** Allow users to plan trips that do not involve towing a caravan.
*   **Details:** Added a "Towing a caravan?" switch to the Trip Planner. When disabled, trips are saved as "Vehicle Only," using a simplified checklist template and not affecting caravan-related data. The Trip Log now visually distinguishes these trips.

### ✅ **Project: Performance & Stability Improvements**
*   **Status:** Complete
*   **Objective:** Improve initial page load times for data-heavy pages like "Vehicles" and "Inventory".
*   **Details:**
    *   The `/checklists` page has been converted to a Next.js Server Component, pre-fetching all necessary trip data on the server. This provides a faster initial load for users.
    *   The `/vehicles` and `/inventory` pages have been refactored to use a single, consolidated API endpoint for data fetching, improving stability and reducing network requests.

### ✅ **Feature: AI-Powered Packing Assistant**
*   **Status:** Complete
*   **Objective:** Help users generate packing lists based on trip details.
*   **Details:** The Genkit flow to help users generate packing lists based on trip details is now complete and integrated into the `/trip-packing` page.

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
    
*   **Polished Video Placeholders:**
    *   Source high-quality, relevant placeholder images or short video clips for the "Support & Learn" page to replace the "Coming Soon" text.

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

*   **New Article: Towing Mirrors Guide:**
    *   Create an article explaining the legal requirements and practical benefits of using towing mirrors.
    *   Cover different types of mirrors (e.g., clamp-on, door-mounted, replacement).
    *   Provide tips on how to set them up correctly for maximum visibility and safety.

*   **New Article: Power Management Tips:**
    *   Create a guide explaining 12V systems, solar power, battery maintenance, and tips for conserving power while off-grid.

*   **New Resource: Games & Activities for Camping:**
    *   Compile a list of suggestions for games (card games, outdoor games) and suitable for families, couples, and solo travelers while camping.

### Dynamic In-App Content with Firestore

The Recommended Approach for KamperHub: Dynamic In-App Content with Firestore!

Given your app is a Web app and you're already using Firebase Firestore for kamperhubv2 , the absolute best approach is to store your blog article content in Firestore and fetch it dynamically within your app.

**How it works:**

*   **Store Content in Firestore:** Create a new collection in your kamperhubv2 database, perhaps named `blogPosts`. Each document in this collection would represent a single blog article.
*   **Document Structure:**
    *   `id`: (Firestore Document ID) e.g., "pack-smart-tow-safe"
    *   `title`: "Pack Smart, Tow Safe: A Novice's Guide..."
    *   `introduction`: "The exhilarating moment of packing..."
    *   `sections`: An array of objects, where each object represents a section with a `heading` and `content`.
    *   `wordCount`: ~1000
    *   `publishDate`: (Timestamp)
    *   `imageUrl`: (Optional, link to a Cloud Storage image)
    *   `relatedTopics`: (Optional, array of strings for tagging/categorization)
    *   `author`: "KamperHub Team"
*   **Fetch Content in App:** When a user navigates to an article in your KamperHub app, your JavaScript/TypeScript code makes a call to Firestore to retrieve the relevant document from the `blogPosts` collection.
*   **Display in App:** Your app then dynamically renders the title, introduction, and sections. You can use Markdown rendering libraries if you store your content in Markdown format within Firestore.

**Why this is the best for KamperHub:**

*   **Seamless UX:** Users never leave your app.
*   **Consistent Design:** You control the styling completely.
*   **Dynamic Updates:** Change an article in Firestore, and it immediately updates in the app for all users without needing to redeploy your web app.
*   **Leverages Existing Firebase:** You're already set up with Firestore, so you're not introducing new backend services.
*   **Offline Support:** Firestore has built-in offline capabilities, meaning users can access previously viewed articles even without a connection (if implemented correctly on the client side).
*   **Personalization (Future):** You could personalize content delivery, track popular articles, or even allow users to bookmark articles within your app.

**In conclusion:**

For your KamperHub web app, definitely add the text to the app, but do it dynamically by storing the content in Firebase Firestore. This gives you the best of both worlds: a fantastic user experience and flexible, real-time content management. It truly makes your app feel like a comprehensive resource for caravanners!
