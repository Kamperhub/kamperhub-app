
"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { 
  type SubscriptionTier 
} from '@/types/auth';
import { isAfter, parseISO } from 'date-fns';

const DEFAULT_TIER: SubscriptionTier = 'free';

interface SubscriptionContextType {
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  trialEndsAt: string | null; // ISO string
  setSubscriptionDetails: (tier: SubscriptionTier, customerId?: string | null, trialEnd?: string | null) => void;
  isLoading: boolean;
  hasProAccess: boolean;
  isTrialActive: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptionTier, setSubscriptionTierState] = useState<SubscriptionTier>(DEFAULT_TIER);
  const [stripeCustomerId, setStripeCustomerIdState] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAtState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setSubscriptionDetails = useCallback((tier: SubscriptionTier, customerId?: string | null, trialEnd?: string | null) => {
    setSubscriptionTierState(tier);
    if (customerId !== undefined) { 
        setStripeCustomerIdState(customerId);
    }
    if (trialEnd !== undefined) {
      setTrialEndsAtState(trialEnd);
    }
    setIsLoading(false);
  }, []);

  const isTrialActive = useMemo(() => {
    if (subscriptionTier !== 'trialing' || !trialEndsAt) {
      return false;
    }
    try {
      const trialEndDate = parseISO(trialEndsAt);
      return isAfter(trialEndDate, new Date());
    } catch (e) {
      // Invalid date string will cause parseISO to throw an error
      console.error("Error parsing trialEndsAt date:", e);
      return false;
    }
  }, [subscriptionTier, trialEndsAt]);
  
  const hasProAccess = subscriptionTier === 'pro' || isTrialActive;

  return (
    <SubscriptionContext.Provider value={{ subscriptionTier, stripeCustomerId, trialEndsAt, setSubscriptionDetails, isLoading, hasProAccess, isTrialActive }}>
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
