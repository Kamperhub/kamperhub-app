
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
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    console.log("AuthProvider: Mounting and setting up auth state listener.");
    if (firebaseInitializationError) {
      console.error("AuthProvider: Firebase initialization failed.", firebaseInitializationError);
      setAuthStatus('ERROR');
      setProfileError(`Firebase Client Error: ${firebaseInitializationError}`);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log("AuthProvider: Auth state changed.");
      setUser(currentUser);
      
      if (currentUser) {
        console.log(`AuthProvider: User is logged in (UID: ${currentUser.uid}). Setting status to LOADING.`);
        setAuthStatus('LOADING');
        setProfileError(null);
        
        try {
          const profileDocRef = doc(db, "users", currentUser.uid);
          console.log(`AuthProvider: Fetching user profile from Firestore at path: users/${currentUser.uid}`);
          
          const docSnap = await getDocWithTimeout(profileDocRef, 7000);

          if (docSnap.exists()) {
              console.log("AuthProvider: User profile document found.");
              const profile = docSnap.data() as UserProfile;
              setUserProfile(profile);
              console.log("AuthProvider: User profile state updated.", profile);
              setSubscriptionDetails(
                profile.subscriptionTier || 'free',
                profile.stripeCustomerId,
                profile.trialEndsAt
              );
              console.log("AuthProvider: Subscription details updated. Setting status to READY.");
              setAuthStatus('READY');
          } else {
             const errorMsg = `User profile not found. Your authentication record for '${currentUser.email}' exists, but your profile data is missing from the database. This can happen if signup was interrupted. Please ask the administrator to delete this user from the Firebase Authentication console, then sign up again.`;
             console.error(`AuthProvider: ${errorMsg}`);
             setProfileError(errorMsg);
             setAuthStatus('ERROR');
          }
        } catch (error: any) {
          console.error("AuthProvider: Error fetching user profile:", error);
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
        console.log("AuthProvider: No user is logged in. Setting status to UNAUTHENTICATED.");
        setUserProfile(null);
        setSubscriptionDetails('free');
        setAuthStatus('UNAUTHENTICATED');
        setProfileError(null);
      }
    }, (error) => {
        console.error("AuthProvider: Firebase auth state listener encountered an error:", error);
        setProfileError(`An error occurred during authentication. Please refresh the page. Error: ${error.message}`);
        setAuthStatus('ERROR');
    });

    return () => {
      console.log("AuthProvider: Unmounting and cleaning up auth listener.");
      unsubscribeAuth();
    }
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
