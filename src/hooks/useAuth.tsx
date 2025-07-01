
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { auth, db, firebaseInitializationError } from '@/lib/firebase';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from './useSubscription';

export type AuthStatus = 'LOADING' | 'UNAUTHENTICATED' | 'AWAITING_PROFILE' | 'READY' | 'ERROR';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  authStatus: AuthStatus;
  profileError: string | null;
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

    let unsubscribeFromProfile: Unsubscribe = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeFromProfile(); // Unsubscribe from any previous profile listener

      setUser(currentUser);
      
      if (currentUser) {
        setAuthStatus('AWAITING_PROFILE');
        setProfileError(null);
        const profileDocRef = doc(db, "users", currentUser.uid);

        unsubscribeFromProfile = onSnapshot(profileDocRef,
          (docSnap) => {
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
              const isAdmin = currentUser.email === 'info@kamperhub.com';
              const errorMsg = isAdmin 
                ? `Your admin profile was not found in the database. Please use the one-time tool at /api/debug/create-admin-user to create it.`
                : `User profile not found for UID: ${currentUser.uid}. The signup process may have been interrupted. Please contact support.`;
              
              console.error(errorMsg);
              setUserProfile(null);
              setSubscriptionDetails('free');
              setProfileError(errorMsg);
              setAuthStatus('ERROR');
            }
          },
          (error) => {
            console.error("Error listening to user profile:", error);
            const errorMsg = `Failed to load user profile from the database. This is often a permission issue. Please check your Firestore security rules. Original error: ${error.message}`;
            setUserProfile(null);
            setSubscriptionDetails('free');
            setProfileError(errorMsg);
            setAuthStatus('ERROR');
          }
        );
      } else {
        // No user is logged in
        setUserProfile(null);
        setSubscriptionDetails('free');
        setAuthStatus('UNAUTHENTICATED');
        setProfileError(null);
      }
    }, (error) => {
        // Handle errors with onAuthStateChanged itself
        console.error("Firebase auth state error:", error);
        setProfileError(`An error occurred during authentication. Please refresh the page. Error: ${error.message}`);
        setAuthStatus('ERROR');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFromProfile();
    };
  }, [setSubscriptionDetails]);

  const value = { user, userProfile, authStatus, profileError };

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

    