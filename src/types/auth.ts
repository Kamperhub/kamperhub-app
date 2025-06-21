// src/types/auth.ts

import type { CaravanDefaultChecklistSet } from './checklist';

// These keys are related to the OLD MOCK system or temporary localStorage syncing.
// Many will be primarily sourced from Firestore going forward.
export const MOCK_AUTH_USERNAME_KEY = 'kamperhub_mock_username'; // Firebase Auth display name is the source of truth
export const MOCK_AUTH_LOGGED_IN_KEY = 'kamperhub_mock_is_logged_in'; // Firebase Auth state is the source of truth
export const MOCK_AUTH_EMAIL_KEY = 'kamperhub_mock_email'; // Firebase Auth email is the source of truth

// These are for temporary sync with localStorage until all components read directly from Firestore/Auth state.
export const MOCK_AUTH_FIRST_NAME_KEY = 'kamperhub_mock_first_name';
export const MOCK_AUTH_LAST_NAME_KEY = 'kamperhub_mock_last_name';
export const MOCK_AUTH_SUBSCRIPTION_TIER_KEY = 'kamperhub_mock_subscription_tier';
export const MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY = 'kamperhub_mock_stripe_customer_id';
export const MOCK_AUTH_CITY_KEY = 'kamperhub_mock_city';
export const MOCK_AUTH_STATE_KEY = 'kamperhub_mock_state';
export const MOCK_AUTH_COUNTRY_KEY = 'kamperhub_mock_country';
export const MOCK_AUTH_TRIAL_ENDS_AT_KEY = 'kamperhub_mock_trial_ends_at';


// This registry is being replaced by Firebase Authentication & Firestore.
export const MOCK_AUTH_USER_REGISTRY_KEY = 'kamperhub_mock_user_registry';

export type SubscriptionTier = 'free' | 'pro' | 'trialing' | 'trial_expired';

// Represents the user data stored in Firestore.
export interface UserProfile {
  uid: string; // Firebase Auth User ID
  email: string | null;
  displayName: string | null; // Corresponds to 'username' from signup form
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId?: string | null; 
  subscriptionStatus?: string | null; 
  currentPeriodEnd?: string | null; // ISO Date string or Firestore Timestamp for actual end
  trialEndsAt?: string | null; // ISO Date string or Firestore Timestamp
  createdAt: string; // ISO Date string or Firestore Timestamp
  updatedAt?: string; // ISO Date string or Firestore Timestamp
  isAdmin?: boolean;

  // User Preferences
  activeVehicleId?: string | null;
  activeCaravanId?: string | null;
  activeWdhId?: string | null;
  dashboardLayout?: string[] | null;
  caravanWaterLevels?: Record<string, Record<string, number>> | null; // { [caravanId]: { [tankId]: level } }
  caravanDefaultChecklists?: Record<string, CaravanDefaultChecklistSet> | null; // { [caravanId]: ChecklistSet }
}

// This interface was for the old mock system.
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
  trialEndsAt?: string | null;
}

// This interface was for the old mock user registry.
// It's being replaced by Firebase Authentication and Firestore for profile data.
export interface MockUserRegistryEntry {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string; // Only for mock system, Firebase handles actual passwords
  city?: string;
  state?: string;
  country?: string;
}

    