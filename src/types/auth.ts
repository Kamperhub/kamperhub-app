
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
  homeAddress?: string | null;
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId?: string | null;
  trialEndsAt?: string | null; // ISO Date string for when trial ends
  createdAt: string; // ISO Date string or Firestore Timestamp
  updatedAt?: string; // ISO Date string or Firestore Timestamp
  isAdmin?: boolean;
  hasDismissedGettingStartedGuide?: boolean; // New field to track guide dismissal

  // User Preferences
  activeVehicleId?: string | null;
  activeCaravanId?: string | null;
  dashboardLayout?: string[] | null;
  caravanWaterLevels?: Record<string, Record<string, number>> | null; // { [caravanId]: { [tankId]: level } }
  caravanDefaultChecklists?: Record<string, CaravanDefaultChecklistSet> | null; // { [caravanId]: ChecklistSet }
  
  // New field for storing Google API credentials
  googleAuth?: {
    accessToken: string;
    refreshToken: string; // Very sensitive, store securely
    expiryDate: number; // Unix timestamp for access token expiry
    scopes: string[];
  } | null;
}

export type SubscriptionTier = 'free' | 'pro' | 'trialing';
