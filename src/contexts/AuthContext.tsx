
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider, // Import GoogleAuthProvider
  signInWithPopup,      // Import signInWithPopup
  type AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Your Firebase auth instance
import { useRouter } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (email: string, pass: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>; // Add signInWithGoogle
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAuthError = (err: AuthError | any): string => { // Adjusted to handle generic error for popup
    console.error("Firebase Auth Error:", err.code, err.message);
    // Handle cases where err.code might not exist (e.g., popup closed by user)
    if (!err.code) {
        if (err.message && err.message.includes('popup-closed-by-user')) {
            return 'Sign-in process was cancelled (popup closed).';
        }
        if (err.message && err.message.includes('account-exists-with-different-credential')) {
            return 'An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.';
        }
        return err.message || 'An unexpected error occurred. Please try again.';
    }

    switch (err.code) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'This email address is already in use.';
      case 'auth/weak-password':
        return 'Password is too weak. It should be at least 6 characters.';
      case 'auth/operation-not-allowed':
          return 'Email/password accounts are not enabled.';
      case 'auth/popup-closed-by-user':
          return 'Sign-in process was cancelled (popup closed).';
      case 'auth/account-exists-with-different-credential':
          return 'An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.';
      default:
        return err.message || 'An unexpected error occurred. Please try again.';
    }
  };

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setLoading(false);
      return true;
    } catch (err) {
      setError(handleAuthError(err as AuthError));
      setLoading(false);
      return false;
    }
  };

  const signUp = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      setLoading(false);
      return true;
    } catch (err) {
      setError(handleAuthError(err as AuthError));
      setLoading(false);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle setting the user and redirecting
      setLoading(false);
      return true;
    } catch (err) {
      setError(handleAuthError(err as AuthError)); // Cast to AuthError, or handle more generically if needed
      setLoading(false);
      return false;
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null); // Ensure local state is updated immediately
      router.push('/login'); // Redirect to login after sign out
    } catch (err) {
      setError(handleAuthError(err as AuthError));
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle, // Expose signInWithGoogle
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
