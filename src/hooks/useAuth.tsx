
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, type DocumentReference, type DocumentSnapshot } from 'firebase/firestore';
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

/**
 * A wrapper for Firestore's getDoc that adds a timeout.
 * This prevents the app from hanging indefinitely if the database is misconfigured (e.g., wrong name).
 * @param docRef The document reference to fetch.
 * @param timeout The timeout in milliseconds.
 * @returns A promise that resolves with the DocumentSnapshot.
 */
function getDocWithTimeout(docRef: DocumentReference, timeout: number): Promise<DocumentSnapshot> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firestore request timed out after ${timeout}ms. This usually means a problem connecting to the database. Please check your internet connection and ensure the database name in your configuration ('kamperhubv2') is correct in the Firebase Console.`));
    }, timeout);

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
        setAuthStatus('LOADING');
        setProfileError(null);
        
        try {
          const profileDocRef = doc(db, "users", currentUser.uid);
          
          // Use the timeout function to prevent the app from hanging
          const docSnap = await getDocWithTimeout(profileDocRef, 7000);

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
             // Handle orphaned user: Auth record exists but Firestore doc is missing.
             const errorMsg = `User profile not found. Your authentication record for '${currentUser.email}' exists, but your profile data is missing from the database. This can happen if signup was interrupted. Please ask the administrator to delete this user from the Firebase Authentication console, then sign up again.`;
             console.error(errorMsg);
             setProfileError(errorMsg);
             setAuthStatus('ERROR');
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
