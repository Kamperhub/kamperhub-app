
// src/types/auth.ts

export const MOCK_AUTH_USERNAME_KEY = 'kamperhub_mock_username';
export const MOCK_AUTH_LOGGED_IN_KEY = 'kamperhub_mock_is_logged_in';
export const MOCK_AUTH_EMAIL_KEY = 'kamperhub_mock_email';
export const MOCK_AUTH_SUBSCRIPTION_TIER_KEY = 'kamperhub_mock_subscription_tier';
export const MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY = 'kamperhub_mock_stripe_customer_id';

export type SubscriptionTier = 'free' | 'pro'; // Add more tiers as needed

export interface MockAuthSession {
  isLoggedIn: boolean;
  username: string | null;
  email?: string | null;
  subscriptionTier?: SubscriptionTier | null;
  stripeCustomerId?: string | null;
}
