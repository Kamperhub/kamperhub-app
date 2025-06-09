
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { MOCK_AUTH_SUBSCRIPTION_TIER_KEY, MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY, type SubscriptionTier } from '@/types/auth';

const DEFAULT_TIER: SubscriptionTier = 'free';

interface SubscriptionContextType {
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  setSubscriptionDetails: (tier: SubscriptionTier, customerId?: string | null) => void;
  isLoading: boolean;
  isProTier: boolean; // Convenience getter
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptionTier, setSubscriptionTierState] = useState<SubscriptionTier>(DEFAULT_TIER);
  const [stripeCustomerId, setStripeCustomerIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
      const storedCustomerId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      
      setSubscriptionTierState(storedTier || DEFAULT_TIER);
      setStripeCustomerIdState(storedCustomerId || null);
    } catch (error) {
      console.error("Error reading subscription details from localStorage:", error);
    }
    setIsLoading(false);
  }, []);

  const setSubscriptionDetails = useCallback((tier: SubscriptionTier, customerId?: string | null) => {
    setSubscriptionTierState(tier);
    if (customerId !== undefined) { // Allow clearing customerId by passing null
        setStripeCustomerIdState(customerId);
    }
    try {
      localStorage.setItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY, tier);
      if (customerId) {
        localStorage.setItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY, customerId);
      } else {
        localStorage.removeItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      }
    } catch (error) {
      console.error("Error saving subscription details to localStorage:", error);
    }
  }, []);
  
  const isProTier = subscriptionTier === 'pro';

  return (
    <SubscriptionContext.Provider value={{ subscriptionTier, stripeCustomerId, setSubscriptionDetails, isLoading, isProTier }}>
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
