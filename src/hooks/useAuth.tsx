
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { auth, db, firebaseInitializationError } from '@/lib/firebase';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from './useSubscription';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAuthLoading: boolean;
  isProfileLoading: boolean;
  profileError: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const { setSubscriptionDetails } = useSubscription();

  useEffect(() => {
    if (firebaseInitializationError) {
      setIsAuthLoading(false);
      setIsProfileLoading(false);
      return;
    }

    let unsubscribeFromProfile: Unsubscribe = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // When auth state changes, first unsubscribe from any previous profile listener
      unsubscribeFromProfile();

      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        setIsProfileLoading(true);
        setProfileError(null);
        const profileDocRef = doc(db, "users", currentUser.uid);

        // Set up the new listener and store its unsubscribe function
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
            } else {
              console.warn(`No Firestore profile found for user UID: ${currentUser.uid}`);
              setUserProfile(null);
              setSubscriptionDetails('free'); // Default to free if no profile
              setProfileError(new Error("User profile not found."));
            }
            setIsProfileLoading(false);
          },
          (error) => {
            console.error("Error listening to user profile:", error);
            setUserProfile(null);
            setSubscriptionDetails('free');
            setProfileError(error);
            setIsProfileLoading(false);
          }
        );
      } else {
        // No user, so clear profile data and reset loading states
        setUserProfile(null);
        setSubscriptionDetails('free');
        setIsProfileLoading(false);
        setProfileError(null);
      }
    });

    // Cleanup function for the useEffect hook
    return () => {
      unsubscribeAuth();
      unsubscribeFromProfile();
    };
  }, [setSubscriptionDetails]);

  const value = { user, userProfile, isAuthLoading, isProfileLoading, profileError };

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
