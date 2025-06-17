
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
  MOCK_AUTH_SUBSCRIPTION_TIER_KEY, 
  MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY, 
  MOCK_AUTH_TRIAL_ENDS_AT_KEY,
  type SubscriptionTier 
} from '@/types/auth';

const DEFAULT_TIER: SubscriptionTier = 'free';

interface SubscriptionContextType {
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  trialEndsAt: string | null;
  setSubscriptionDetails: (tier: SubscriptionTier, customerId?: string | null, trialEnds?: string | null) => void;
  isLoading: boolean;
  hasProAccess: boolean; // Renamed from isProTier
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptionTier, setSubscriptionTierState] = useState<SubscriptionTier>(DEFAULT_TIER);
  const [stripeCustomerId, setStripeCustomerIdState] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAtState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
      const storedCustomerId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      const storedTrialEndsAt = localStorage.getItem(MOCK_AUTH_TRIAL_ENDS_AT_KEY);
      
      setSubscriptionTierState(storedTier || DEFAULT_TIER);
      setStripeCustomerIdState(storedCustomerId || null);
      setTrialEndsAtState(storedTrialEndsAt || null);
    } catch (error) {
      console.error("Error reading subscription details from localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  const setSubscriptionDetails = useCallback((tier: SubscriptionTier, customerId?: string | null, trialEnds?: string | null) => {
    setSubscriptionTierState(tier);
    if (customerId !== undefined) { 
        setStripeCustomerIdState(customerId);
    }
    if (trialEnds !== undefined) {
        setTrialEndsAtState(trialEnds);
    }

    try {
      localStorage.setItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY, tier);
      if (customerId) {
        localStorage.setItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY, customerId);
      } else {
        localStorage.removeItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      }
      if (trialEnds) {
        localStorage.setItem(MOCK_AUTH_TRIAL_ENDS_AT_KEY, trialEnds);
      } else {
        localStorage.removeItem(MOCK_AUTH_TRIAL_ENDS_AT_KEY);
      }
    } catch (error) {
      console.error("Error saving subscription details to localStorage:", error);
    }
  }, []);
  
  const hasProAccess = 
    subscriptionTier === 'pro' || 
    (subscriptionTier === 'trialing' && trialEndsAt && new Date(trialEndsAt) > new Date());

  return (
    <SubscriptionContext.Provider value={{ subscriptionTier, stripeCustomerId, trialEndsAt, setSubscriptionDetails, isLoading, hasProAccess }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
