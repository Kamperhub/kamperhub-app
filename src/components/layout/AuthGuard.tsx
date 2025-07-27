
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthStatus, type ProfileStatus } from '@/hooks/useAuth';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const LoadingScreen = ({ message }: { message: string }) => {
  const [showSlowLoadMessage, setShowSlowLoadMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        setShowSlowLoadMessage(true);
    }, 8000); // 8 seconds to show help text
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm text-foreground p-4">
      <div className="flex flex-col items-center justify-center text-center">
        {!showSlowLoadMessage ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-semibold text-primary font-body">{message}</p>
          </>
        ) : (
          <Alert variant="destructive" className="mt-6 max-w-2xl text-left shadow-lg">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-headline">Stuck on Initializing?</AlertTitle>
            <AlertDescription className="font-body space-y-2 mt-2">
              <p>Loading is taking longer than expected. This usually means there's a problem connecting to the Firestore database to read your user profile.</p>
              <p>
                <strong>Action 1: Check the Browser Console.</strong> Press F12 to open Developer Tools, go to the "Console" tab, and look for error messages from "AuthProvider" or "Firebase Client". These logs will tell us exactly where it's failing.
              </p>
              <p>
                <strong>Action 2: Verify Setup.</strong> Please open the file named <code className="bg-destructive/20 px-1 rounded-sm">FIREBASE_SETUP_CHECKLIST.md</code> and carefully verify steps 5, 6, and 7.
              </p>
               <Button variant="outline" onClick={() => window.location.reload()} className="w-full mt-4 text-destructive-foreground border-destructive-foreground/50 hover:bg-destructive-foreground/10 hover:text-destructive-foreground">
                I've verified the setup, Refresh Page
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

const ErrorScreen = ({ error }: { error: string | null }) => {
  const errorMessage = error || "An unknown error occurred.";
  const isPermissionError = errorMessage.toLowerCase().includes('permission_denied') || errorMessage.toLowerCase().includes('unauthenticated');
  const isTimeoutError = errorMessage.toLowerCase().includes('timed out');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center p-4">
      <Alert variant="destructive" className="max-w-2xl w-full">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-headline text-xl">Application Error</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
            <p className="font-body">There was a problem loading your user data.</p>
            <pre className="text-xs bg-background/20 p-3 rounded-md font-mono whitespace-pre-wrap text-left">
              {errorMessage}
            </pre>
            {isTimeoutError && (
               <div className="mt-4 border-t border-destructive/30 pt-3 text-left font-body space-y-4">
                <p className="font-bold">This is a timeout error. It almost always means the app cannot connect to the Firestore database named `kamperhubv2`.</p>
                <p>This is the most common and critical setup issue. Please follow these steps exactly:</p>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Open the file <code className="bg-background/20 px-1 rounded-sm">FIREBASE_SETUP_CHECKLIST.md</code>.</li>
                  <li>Carefully follow the instructions in <strong>Step 5: CRITICAL - Verify Firestore Database Exists (with ID `kamperhubv2`)</strong>.</li>
                  <li>Your database ID <strong>must be `kamperhubv2`</strong>, not `(default)`. If it is `(default)`, you must delete it and create a new one with the correct ID.</li>
                </ul>
              </div>
            )}
            {isPermissionError && !isTimeoutError && (
              <div className="mt-4 border-t border-destructive/30 pt-3 text-left font-body space-y-4">
                <p className="font-bold">This is a permissions issue. It means your app is being blocked by Firestore's Security Rules. Please follow these steps:</p>
                <div>
                  <h3 className="font-semibold">1. Copy the Security Rules</h3>
                  <p className="text-sm">Open the file <code className="bg-background/20 px-1 rounded-sm">firestore.rules</code> from the file explorer on the left and copy its entire contents.</p>
                </div>
                <div>
                  <h3 className="font-semibold">2. Deploy the Rules in Firebase</h3>
                  <p className="text-sm">Go to the Firebase Console, select your project (`kamperhub-s4hc2`), go to the "Firestore Database" section, select the `kamperhubv2` database, and click the "Rules" tab. Paste the copied rules into the editor, replacing anything that's currently there, and click "Publish".</p>
                </div>
                 <p className="mt-2 text-sm">After publishing the rules, refresh this page.</p>
              </div>
            )}
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full mt-4 text-destructive-foreground border-destructive-foreground/50 hover:bg-destructive-foreground/10 hover:text-destructive-foreground">
              Refresh Page
            </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};


export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authStatus, profileStatus, profileError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'UNAUTHENTICATED') {
      router.push('/login');
    }
  }, [authStatus, router]);

  // Combined loading check: show loading screen if auth is loading OR if user is authed but profile isn't ready.
  if (authStatus === 'LOADING' || (authStatus === 'AUTHENTICATED' && profileStatus === 'LOADING')) {
    return <LoadingScreen message={authStatus === 'LOADING' ? 'Initializing Session...' : 'Loading Your Profile...'} />;
  }
  
  if (profileStatus === 'ERROR') {
    return <ErrorScreen error={profileError} />;
  }
  
  if (authStatus === 'AUTHENTICATED' && profileStatus === 'SUCCESS') {
    return <>{children}</>;
  }
  
  // This will catch the UNAUTHENTICATED state while the useEffect redirect is firing,
  // preventing the children from rendering for a split second.
  return <LoadingScreen message="Redirecting..." />;
};
