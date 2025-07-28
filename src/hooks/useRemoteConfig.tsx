
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { remoteConfig } from '@/lib/firebase';
import { fetchAndActivate, getString, getAll } from 'firebase/remote-config';

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
      if (remoteConfig) {
        try {
          await fetchAndActivate(remoteConfig);
          console.log('[Remote Config] Fetched and activated successfully.');
          setIsConfigReady(true);
        } catch (error) {
          console.error('[Remote Config] Failed to fetch and activate:', error);
          // Still set to ready to allow the app to function with default values.
          setIsConfigReady(true);
        }
      } else {
         console.warn('[Remote Config] Remote Config not initialized, using default values.');
         // Set ready even if not initialized, to use defaults.
         setIsConfigReady(true);
      }
    };
    activateConfig();
  }, []);

  const getConfigString = (key: string): string => {
    if (remoteConfig && isConfigReady) {
      return getString(remoteConfig, key);
    }
    return '';
  };
  
  const getAllConfig = (): Record<string, string> => {
     if (remoteConfig && isConfigReady) {
      const allValues = getAll(remoteConfig);
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
