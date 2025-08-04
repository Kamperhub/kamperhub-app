
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db, firebaseInitializationError } from '@/lib/firebase';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from './useSubscription';

export type AuthStatus = 'LOADING' | 'UNAUTHENTICATED' | 'AUTHENTICATED' | 'ERROR';
export type ProfileStatus = 'LOADING' | 'SUCCESS' | 'ERROR' | 'NOT_APPLICABLE';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  authStatus: AuthStatus;
  profileStatus: ProfileStatus;
  profileError: string | null;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('LOADING');
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('LOADING');
  const [profileError, setProfileError] = useState<string | null>(null);
  const { setSubscriptionDetails } = useSubscription();
  
  useEffect(() => {
    if (firebaseInitializationError) {
      setAuthStatus('ERROR');
      setProfileStatus('ERROR');
      setProfileError(`Firebase Client Error: ${firebaseInitializationError}`);
      return;
    }

    const unsubscribeAuth = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      let unsubscribeProfile: (() => void) | undefined;

      if (currentUser) {
        setAuthStatus('AUTHENTICATED');
        setProfileStatus('LOADING');
        setProfileError(null);

        const profileDocRef = doc(db, "users", currentUser.uid);
        unsubscribeProfile = onSnapshot(profileDocRef, 
          async (docSnap) => { // Make this async to handle profile creation
            if (docSnap.exists()) {
                const profile = docSnap.data() as UserProfile;
                setUserProfile(profile);
                setSubscriptionDetails(
                  profile.subscriptionTier || 'free',
                  profile.stripeCustomerId,
                  profile.trialEndsAt
                );
                setProfileStatus('SUCCESS');
            } else {
               console.warn(`User document for ${currentUser.uid} not found. Attempting to create a new default profile.`);
               try {
                 const trialEndDate = new Date();
                 trialEndDate.setDate(trialEndDate.getDate() + 7);

                 const minimalProfile: UserProfile = {
                    uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName,
                    firstName: null, lastName: null, city: null, state: null, country: null,
                    subscriptionTier: 'trialing', stripeCustomerId: null, createdAt: new Date().toISOString(),
                    trialEndsAt: trialEndDate.toISOString(),
                 };
                 await setDoc(profileDocRef, minimalProfile);
               } catch (creationError: any) {
                 const errorMsg = `Failed to create user profile after signup. Error: ${creationError.message}`;
                 setProfileError(errorMsg);
                 setProfileStatus('ERROR');
               }
            }
          },
          (error) => {
            let errorMsg = `Failed to load user profile. Error: ${error.message}`;
            if (error.code === 'permission-denied' || error.message.toLowerCase().includes('permission denied')) {
              errorMsg = "PERMISSION_DENIED: Your app is being blocked by Firestore Security Rules. Please deploy the rules file.";
            }
            setUserProfile(null);
            setSubscriptionDetails('free');
            setProfileError(errorMsg);
            setProfileStatus('ERROR');
          }
        );
      } else {
        fetch('/api/auth/session', { method: 'DELETE' });
        
        setUserProfile(null);
        setSubscriptionDetails('free');
        setAuthStatus('UNAUTHENTICATED');
        setProfileStatus('NOT_APPLICABLE');
        setProfileError(null);
      }

      return () => {
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
      };
    }, (error) => {
        setProfileError(`An error occurred during authentication. Please refresh the page. Error: ${error.message}`);
        setAuthStatus('ERROR');
    });

    return () => unsubscribeAuth();
  }, [setSubscriptionDetails]);
  
  const isAuthLoading = authStatus === 'LOADING' || (authStatus === 'AUTHENTICATED' && profileStatus === 'LOADING');

  const value = { user, userProfile, authStatus, profileStatus, profileError, isAuthLoading };

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
