
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
             const errorMsg = `User profile not found for UID: ${currentUser.uid}. This can happen if the signup process was interrupted. The user record exists in Firebase Authentication, but not in the Firestore database. You may need to delete this user from the Firebase Console's 'Authentication' tab and sign up again.`;
            
            console.error(errorMsg);
            setUserProfile(null);
            setSubscriptionDetails('free');
            setProfileError(errorMsg);
            setAuthStatus('ERROR');
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
            
          let errorMsg = `Failed to load user profile from the database. Original error: ${error.message}`;
          if (error.code === 'permission-denied' || error.message.toLowerCase().includes('unauthenticated') || error.message.toLowerCase().includes('permission denied')) {
            errorMsg = "PERMISSION_DENIED: Your app is being blocked by Firestore Security Rules. Please follow the instructions in FIREBASE_SETUP_CHECKLIST.md to deploy the rules file.";
          } else if (error.code === 5 || error.message.includes('NOT_FOUND') || error.message.toLowerCase().includes('database not found')) {
            errorMsg = "CRITICAL: The Firestore database 'kamperhubv2' could not be found. Please check Step 5 in FIREBASE_SETUP_CHECKLIST.md to ensure it was created with the correct ID.";
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
