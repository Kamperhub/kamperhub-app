
// src/types/auth.ts

export const MOCK_AUTH_USERNAME_KEY = 'kamperhub_mock_username';
export const MOCK_AUTH_LOGGED_IN_KEY = 'kamperhub_mock_is_logged_in';
export const MOCK_AUTH_EMAIL_KEY = 'kamperhub_mock_email';
export const MOCK_AUTH_FIRST_NAME_KEY = 'kamperhub_mock_first_name';
export const MOCK_AUTH_LAST_NAME_KEY = 'kamperhub_mock_last_name';
export const MOCK_AUTH_SUBSCRIPTION_TIER_KEY = 'kamperhub_mock_subscription_tier';
export const MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY = 'kamperhub_mock_stripe_customer_id';

// New key for the user registry
export const MOCK_AUTH_USER_REGISTRY_KEY = 'kamperhub_mock_user_registry';

export type SubscriptionTier = 'free' | 'pro'; // Add more tiers as needed

export interface MockAuthSession {
  isLoggedIn: boolean;
  username: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  subscriptionTier?: SubscriptionTier | null;
  stripeCustomerId?: string | null;
}

// Structure for an entry in the user registry
export interface MockUserRegistryEntry {
  username: string;
  email: string;
}
