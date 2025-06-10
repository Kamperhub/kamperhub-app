
// src/types/auth.ts

// These keys are related to the OLD MOCK system.
// Some might be phased out or repurposed as we integrate Firebase.
export const MOCK_AUTH_USERNAME_KEY = 'kamperhub_mock_username'; // Will be replaced by Firebase Auth display name
export const MOCK_AUTH_LOGGED_IN_KEY = 'kamperhub_mock_is_logged_in'; // Will be replaced by Firebase Auth state
export const MOCK_AUTH_EMAIL_KEY = 'kamperhub_mock_email'; // Will be replaced by Firebase Auth email
export const MOCK_AUTH_FIRST_NAME_KEY = 'kamperhub_mock_first_name'; // For Firestore
export const MOCK_AUTH_LAST_NAME_KEY = 'kamperhub_mock_last_name'; // For Firestore
export const MOCK_AUTH_SUBSCRIPTION_TIER_KEY = 'kamperhub_mock_subscription_tier'; // Will link to Firebase UID later
export const MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY = 'kamperhub_mock_stripe_customer_id'; // Will link to Firebase UID later

export const MOCK_AUTH_CITY_KEY = 'kamperhub_mock_city'; // For Firestore
export const MOCK_AUTH_STATE_KEY = 'kamperhub_mock_state'; // For Firestore
export const MOCK_AUTH_COUNTRY_KEY = 'kamperhub_mock_country'; // For Firestore

// This registry is being replaced by Firebase Authentication.
// It can be removed once all dependent mock logic is updated.
export const MOCK_AUTH_USER_REGISTRY_KEY = 'kamperhub_mock_user_registry';

export type SubscriptionTier = 'free' | 'pro';

// Represents the user data we might store in Firestore, associated with a Firebase UID.
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  subscriptionTier?: SubscriptionTier;
  stripeCustomerId?: string | null;
  // Add any other app-specific user fields here
}

// This interface was for the old mock system.
// It can be phased out.
export interface MockAuthSession {
  isLoggedIn: boolean;
  username: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  subscriptionTier?: SubscriptionTier | null;
  stripeCustomerId?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

// This interface was for the old mock user registry.
// It's being replaced by Firebase Authentication and Firestore for profile data.
export interface MockUserRegistryEntry {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string; // This was for mock password storage
  city?: string;
  state?: string;
  country?: string;
}
