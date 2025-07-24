
# KamperHub Testing Strategy

This document outlines the recommended testing strategy to ensure the stability, reliability, and quality of the KamperHub application, with a strong focus on the critical authentication and user data flows.

---

## 1. Unit Testing

**Objective:** Verify that individual components and hooks behave correctly in isolation.

*   **Framework:** Jest with React Testing Library.
*   **Location:** Tests should be co-located with the components they are testing (e.g., `useAuth.test.tsx` alongside `useAuth.tsx`).

### Key Areas for Unit Tests:

*   #### **`useAuth` Hook (`src/hooks/useAuth.tsx`)**
    *   **Test Initial State:** Verify that the hook initializes with `authStatus: 'LOADING'` and `user: null`.
    *   **Test Authenticated State:** Mock the `onAuthStateChanged` callback to return a user object. Assert that `authStatus` becomes `'AUTHENTICATED'` and the user object is set correctly.
    *   **Test Unauthenticated State:** Mock `onAuthStateChanged` to return `null`. Assert that `authStatus` becomes `'UNAUTHENTICATED'`.
    *   **Test Profile Fetching Success:** Mock the `getDoc` call to return a valid user profile. Assert that `profileStatus` becomes `'SUCCESS'` and the `userProfile` object is populated.
    *   **Test Profile Fetching Failure (Not Found):** Mock `getDoc` to return a non-existent document. Assert that `profileStatus` still becomes `'SUCCESS'` but with a minimal, default profile.
    *   **Test Profile Fetching Failure (Permissions):** Mock `getDoc` to throw a `permission-denied` error. Assert that `profileStatus` becomes `'ERROR'` and the `profileError` message is set appropriately.

*   #### **Utility Functions (`src/lib/utils.ts`, etc.)**
    *   Write pure function tests for any complex utility functions to ensure they return expected outputs for given inputs.

---

## 2. Integration Testing

**Objective:** Verify that different parts of the application work together correctly, simulating real user flows.

*   **Framework:** Cypress or Playwright.
*   **Focus:** End-to-end user journeys.

### Key Integration Test Scenarios:

*   #### **Login & Redirect Flow**
    *   **Scenario:** Unauthenticated user navigates to a protected route (e.g., `/dashboard`).
    *   **Expected:** The user is automatically redirected to `/login`.
    *   **Scenario:** Unauthenticated user fills out the login form with valid credentials.
    *   **Expected:** The user is successfully logged in and redirected to `/dashboard`.
    *   **Scenario:** An already authenticated user navigates directly to `/login`.
    *   **Expected:** The user is immediately and seamlessly redirected to `/dashboard` without seeing the login form.

*   #### **Signup Flow**
    *   **Scenario:** A new user fills out the signup form with valid data.
    *   **Expected:** A new user is created in Firebase Auth, a corresponding user profile document is created in Firestore, and the user is redirected to `/dashboard`.

*   #### **Data Loading on Protected Pages**
    *   **Scenario:** A logged-in user navigates to the `/vehicles` page.
    *   **Expected:** The page should display a loading state initially, then successfully render the user's vehicle data fetched from the API.

---

## 3. End-to-End (E2E) Testing

**Objective:** Validate complete workflows from the user's perspective, including interactions with external services where possible.

*   **Framework:** Cypress or Playwright.

### Key E2E Test Scenarios:

*   #### **Full Trip Creation Workflow**
    *   **Steps:**
        1.  Log in.
        2.  Navigate to "Vehicle Setup" and create a new vehicle and caravan.
        3.  Navigate to the "Trip Planner".
        4.  Enter start and end locations and calculate a route.
        5.  Save the trip with a name and notes.
        6.  Navigate to the "Trip Log".
        7.  Verify that the newly created trip appears correctly in the log.

*   #### **Google Tasks Integration (Mocked)**
    *   **Scenario:** A user generates a packing list and clicks "Send to Google Tasks".
    *   **Expected:** Mock the Google OAuth flow. Verify that the application makes the correct API call to the `/api/google-tasks/create-list` endpoint with the properly formatted packing list data.

By implementing this tiered testing strategy, KamperHub can catch regressions early, verify critical user flows automatically, and ensure a high-quality, reliable experience for all users.
