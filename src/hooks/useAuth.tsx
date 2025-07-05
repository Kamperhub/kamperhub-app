
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode, useRef } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, type Unsubscribe } from 'firebase/firestore';
import { auth, db, firebaseInitializationError } from '@/lib/firebase';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from './useSubscription';

export type AuthStatus = 'LOADING' | 'UNAUTHENTICATED' | 'READY' | 'ERROR';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  authStatus: AuthStatus;
  profileError: string | null;
  isAuthLoading: boolean; // Simplified loading state for consumers
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('LOADING');
  const [profileError, setProfileError] = useState<string | null>(null);
  const { setSubscriptionDetails } = useSubscription();
  
  useEffect(() => {
    if (firebaseInitializationError) {
      setAuthStatus('ERROR');
      setProfileError(`Firebase Client Error: ${firebaseInitializationError}`);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setAuthStatus('LOADING'); // Set to loading while we fetch profile
        setProfileError(null);
        
        try {
          const profileDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(profileDocRef);
          
          if (docSnap.exists()) {
              const profile = docSnap.data() as UserProfile;
              setUserProfile(profile);
              setSubscriptionDetails(
                profile.subscriptionTier || 'free',
                profile.stripeCustomerId,
                profile.trialEndsAt
              );
              setAuthStatus('READY');
          } else {
             // This is a critical error state. The user is authenticated but has no profile.
             throw new Error(`User profile document not found in the database. This can happen if the signup process was interrupted. Please try signing up again or contact support.`);
          }
        } catch (error: any) {
          console.error("AuthGuard - Error fetching user profile:", error);
          let errorMsg = `Failed to load user profile. Error: ${error.message}`;
           if (error.code === 'permission-denied' || error.message.toLowerCase().includes('permission denied')) {
            errorMsg = "PERMISSION_DENIED: Your app is being blocked by Firestore Security Rules. Please follow the instructions in FIREBASE_SETUP_CHECKLIST.md to deploy the rules file.";
          }
          setUserProfile(null);
          setSubscriptionDetails('free');
          setProfileError(errorMsg);
          setAuthStatus('ERROR');
        }
      } else {
        setUserProfile(null);
        setSubscriptionDetails('free');
        setAuthStatus('UNAUTHENTICATED');
        setProfileError(null);
      }
    }, (error) => {
        console.error("Firebase auth state error:", error);
        setProfileError(`An error occurred during authentication. Please refresh the page. Error: ${error.message}`);
        setAuthStatus('ERROR');
    });

    return () => unsubscribeAuth();
  }, [setSubscriptionDetails]);
  
  const isAuthLoading = authStatus === 'LOADING';

  const value = { user, userProfile, authStatus, profileError, isAuthLoading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
