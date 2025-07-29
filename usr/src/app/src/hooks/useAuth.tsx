
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, type DocumentReference, type DocumentSnapshot } from 'firebase/firestore';
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

function getDocWithTimeout(docRef: DocumentReference, timeout: number): Promise<DocumentSnapshot> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firestore request timed out after ${timeout}ms. This usually means a problem connecting to the database. Please check your internet connection and ensure the database name in your configuration ('kamperhubv2') is correct in the Firebase Console.`));
    }, 7000);

    getDoc(docRef).then(
      (snapshot) => {
        clearTimeout(timer);
        resolve(snapshot);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

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
        // Sync the session cookie with the server.
        try {
            const idToken = await currentUser.getIdToken();
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });
        } catch (error) {
            console.error("Failed to sync session cookie:", error);
        }
        
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
               // This is the new, more robust logic for handling a missing profile.
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
                 // Attempt to create the document
                 await setDoc(profileDocRef, minimalProfile);
                 // The onSnapshot listener will fire again with the new data, so we don't set state here.
                 // We just ensure the profileStatus gets resolved on the next snapshot.
               } catch (creationError: any) {
                 // If creation fails, we must set an error state.
                 const errorMsg = `Failed to create user profile after signup. Error: ${creationError.message}`;
                 setProfileError(errorMsg);
                 setProfileStatus('ERROR');
               }
            }
          },
          (error) => {
            let errorMsg = `Failed to load user profile. Error: ${error.message}`;
            if (error.code === 'permission-denied' || error.message.toLowerCase().includes('permission denied')) {
              errorMsg = "PERMISSION_DENIED: Your app is being blocked by Firestore Security Rules. Please follow the instructions in FIREBASE_SETUP_CHECKLIST.md to deploy the rules file.";
            }
            setUserProfile(null);
            setSubscriptionDetails('free');
            setProfileError(errorMsg);
            setProfileStatus('ERROR');
          }
        );
      } else {
        // User logged out, clear the session cookie.
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
