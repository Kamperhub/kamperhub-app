"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
// Import remoteConfig instance and the new functions from your central firebase.ts
import { remoteConfig, fetchAndActivateRC, getStringRC, getAllRC } from '@/lib/firebase';
// REMOVED: import { fetchAndActivate, getString, getAll } from 'firebase/remote-config'; // THIS LINE IS REMOVED!

interface RemoteConfigContextType {
  isConfigReady: boolean;
  getString: (key: string) => string;
  getAll: () => Record<string, string>;
}

const RemoteConfigContext = createContext<RemoteConfigContextType | undefined>(undefined);

export const RemoteConfigProvider = ({ children }: { children: ReactNode }) => {
  const [isConfigReady, setIsConfigReady] = useState(false);

  useEffect(() => {
    const activateConfig = async () => {
      // Ensure both remoteConfig instance AND the function are loaded
      if (remoteConfig && fetchAndActivateRC) { // Added check for fetchAndActivateRC
        try {
          await fetchAndActivateRC(remoteConfig); // Use the exported function
          console.log('[Remote Config] Fetched and activated successfully.');
          setIsConfigReady(true);
        } catch (error) {
          console.error('[Remote Config] Failed to fetch and activate:', error);
          // Still set to ready to allow the app to function with default values.
          setIsConfigReady(true);
        }
      } else {
         console.warn('[Remote Config] Remote Config service or fetchAndActivate function not initialized, using default values.');
         // Set ready even if not initialized, to use defaults.
         setIsConfigReady(true);
      }
    };
    activateConfig();
  }, []);

  const getConfigString = (key: string): string => {
    // Ensure both remoteConfig instance AND the function are loaded
    if (remoteConfig && isConfigReady && getStringRC) { // Added check for getStringRC
      return getStringRC(remoteConfig, key); // Use the exported function
    }
    return '';
  };
  
  const getAllConfig = (): Record<string, string> => {
     // Ensure both remoteConfig instance AND the function are loaded
     if (remoteConfig && isConfigReady && getAllRC) { // Added check for getAllRC
      const allValues = getAllRC(remoteConfig); // Use the exported function
      const stringValues: Record<string, string> = {};
      for (const key in allValues) {
        stringValues[key] = allValues[key].asString();
      }
      return stringValues;
    }
    return {};
  }

  return (
    <RemoteConfigContext.Provider value={{ isConfigReady, getString: getConfigString, getAll: getAllConfig }}>
      {children}
    </RemoteConfigContext.Provider>
  );
};

export const useRemoteConfig = (): RemoteConfigContextType => {
  const context = useContext(RemoteConfigContext);
  if (context === undefined) {
    throw new Error('useRemoteConfig must be used within a RemoteConfigProvider');
  }
  return context;
};
