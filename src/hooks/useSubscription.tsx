
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const SUBSCRIPTION_STORAGE_KEY = 'kamperhub_subscription_status';

interface SubscriptionContextType {
  isSubscribed: boolean;
  setIsSubscribed: (status: boolean) => void;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribedState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true

  useEffect(() => {
    // This effect runs only on the client
    try {
      const storedStatus = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
      if (storedStatus) {
        setIsSubscribedState(JSON.parse(storedStatus));
      }
    } catch (error) {
      console.error("Error reading subscription status from localStorage:", error);
      // Keep default isSubscribed (false)
    }
    setIsLoading(false); // Done loading from localStorage
  }, []);

  const setIsSubscribed = useCallback((status: boolean) => {
    setIsSubscribedState(status);
    try {
      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.error("Error saving subscription status to localStorage:", error);
    }
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, setIsSubscribed, isLoading }}>
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
