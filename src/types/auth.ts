
// src/types/auth.ts

import type { CaravanDefaultChecklistSet } from './checklist';

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

export type SubscriptionTier = 'free' | 'pro' | 'trialing' | 'trial_expired';
