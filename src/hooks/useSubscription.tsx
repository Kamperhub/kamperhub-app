
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
  type SubscriptionTier 
} from '@/types/auth';

const DEFAULT_TIER: SubscriptionTier = 'free';

interface SubscriptionContextType {
  subscriptionTier: SubscriptionTier;
  stripeCustomerId: string | null;
  trialEndsAt: string | null;
  setSubscriptionDetails: (tier: SubscriptionTier, customerId?: string | null, trialEnds?: string | null) => void;
  isLoading: boolean;
  hasProAccess: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [subscriptionTier, setSubscriptionTierState] = useState<SubscriptionTier>(DEFAULT_TIER);
  const [stripeCustomerId, setStripeCustomerIdState] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAtState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setSubscriptionDetails = useCallback((tier: SubscriptionTier, customerId?: string | null, trialEnds?: string | null) => {
    setSubscriptionTierState(tier);
    if (customerId !== undefined) { 
        setStripeCustomerIdState(customerId);
    }
    if (trialEnds !== undefined) {
        setTrialEndsAtState(trialEnds);
    }
    setIsLoading(false);
  }, []);
  
  const hasProAccess = 
    subscriptionTier === 'pro' || 
    (subscriptionTier === 'trialing' && typeof trialEndsAt === 'string' && new Date(trialEndsAt) > new Date());

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
