
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode, useRef } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, type Unsubscribe } from 'firebase/firestore';
import { auth, db, firebaseInitializationError } from '@/lib/firebase';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from './useSubscription';

export type AuthStatus = 'LOADING' | 'UNAUTHENTICATED' | 'AWAITING_PROFILE' | 'READY' | 'ERROR';

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
  const authStatusRef = useRef(authStatus);
  authStatusRef.current = authStatus;

  useEffect(() => {
    const authTimeout = setTimeout(() => {
      if (authStatusRef.current === 'LOADING' || authStatusRef.current === 'AWAITING_PROFILE') {
        console.error("Auth state listener timed out after 10 seconds.");
        setAuthStatus('ERROR');
        setProfileError("Authentication timed out. This could be due to a network issue or a problem with the Firebase configuration. Please check your browser's console for more details and verify your project setup.");
      }
    }, 10000);

    if (firebaseInitializationError) {
      clearTimeout(authTimeout);
      setAuthStatus('ERROR');
      setProfileError(`Firebase Client Error: ${firebaseInitializationError}`);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(authTimeout);
      
      setUser(currentUser);
      
      if (currentUser) {
        setAuthStatus('AWAITING_PROFILE');
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
            const isAdmin = currentUser.email?.toLowerCase() === 'info@kamperhub.com';
            const errorMsg = isAdmin 
              ? `Your admin profile was not found in the database. Please use the one-time tool at /api/debug/create-admin-user to create it.`
              : `User profile not found for UID: ${currentUser.uid}. The signup process may have been interrupted. Please contact support.`;
            
            console.error(errorMsg);
            setUserProfile(null);
            setSubscriptionDetails('free');
            setProfileError(errorMsg);
            setAuthStatus('ERROR');
          }
        } catch (error: any) {
          console.error("Error fetching user profile:", error);
            
          let errorMsg = `Failed to load user profile from the database. Original error: ${error.message}`;
          if (error.code === 'permission-denied' || error.message.includes('UNAUTHENTICATED') || error.message.includes('permission denied')) {
            errorMsg = "PERMISSION_DENIED: Your browser is being blocked by Firestore Security Rules. This is the most common setup issue. Please copy the rules from firestore.rules into your Firebase console's Rules tab and click Publish. Ensure you've selected the `kamperhubv2` database before publishing.";
          } else if (error.code === 5 || error.message.includes('NOT_FOUND') || error.message.includes('database not found')) {
            errorMsg = "CRITICAL: The Firestore database has not been created in this Firebase project. Please go to the Firebase Console, select your project, find 'Firestore Database' in the Build menu, and click 'Create database'. Refer to the setup checklist for more details.";
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
        clearTimeout(authTimeout);
        console.error("Firebase auth state error:", error);
        setProfileError(`An error occurred during authentication. Please refresh the page. Error: ${error.message}`);
        setAuthStatus('ERROR');
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribeAuth();
    };
  }, [setSubscriptionDetails]);
  
  const isAuthLoading = authStatus === 'LOADING' || authStatus === 'AWAITING_PROFILE';

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
