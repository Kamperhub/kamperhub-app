
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthStatus } from '@/hooks/useAuth';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const LoadingScreen = ({ status }: { status: AuthStatus }) => {
  const [showSlowLoadMessage, setShowSlowLoadMessage] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    const timeoutDuration = status === 'AWAITING_PROFILE' ? 3000 : 5000;
    
    timer = setTimeout(() => {
        setShowSlowLoadMessage(true);
    }, timeoutDuration);
    
    return () => clearTimeout(timer);
  }, [status]);


  const message = {
    'LOADING': 'Initializing session...',
    'AWAITING_PROFILE': 'Verifying access...',
  }[status] || 'Loading...';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-primary font-body">{message}</p>
      
      {showSlowLoadMessage && (
        <Alert variant="destructive" className="mt-6 max-w-2xl text-left">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-headline">Stuck on Initializing?</AlertTitle>
          <AlertDescription className="font-body space-y-2 mt-2">
            <p>If loading is taking a while, it usually points to a client-side configuration issue preventing the app from talking to the database. Please check the following:</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong>Firestore Security Rules Not Deployed:</strong> This is the most common cause. You must deploy the security rules to allow the app to read your user profile.
                  <ul className="list-disc list-inside pl-4 mt-1 text-xs">
                     <li>Open the `firestore.rules` file and copy its contents.</li>
                     <li>In the Firebase Console, go to your <strong>kamperhubv2</strong> database, click the "Rules" tab, paste the content, and click **Publish**.</li>
                     <li>Ensure you've selected the correct database (`kamperhubv2`) from the dropdown before publishing.</li>
                  </ul>
                </li>
                <li>
                    <strong>App Check Not Configured:</strong> If you've enabled App Check, ensure your local development domain (`localhost`) is added to the list of allowed domains in the App Check settings in Firebase.
                </li>
                <li>
                  <strong>Incorrect Environment Variables:</strong> Verify that all `NEXT_PUBLIC_FIREBASE_*` variables in your `.env.local` file are correct and that you have restarted the development server since last editing the file.
                </li>
            </ol>
             <Button variant="outline" onClick={() => window.location.reload()} className="w-full mt-4">
              Refresh Page
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

const ErrorScreen = ({ error }: { error: string | null }) => {
  const errorMessage = error || "An unknown error occurred.";
  const isUnauthenticatedError = errorMessage.toLowerCase().includes('unauthenticated');
  
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
            {isUnauthenticatedError && (
              <div className="mt-4 border-t border-destructive/30 pt-3 text-left font-body space-y-4">
                <p className="font-bold">This is a permissions issue. It means the application is being blocked by Firestore's Security Rules. Please follow these steps:</p>
                <div>
                  <h3 className="font-semibold">1. Copy the Security Rules</h3>
                  <p className="text-sm">Open the file <code className="bg-background/20 px-1 rounded-sm">firestore.rules</code> from the file explorer on the left and copy its entire contents.</p>
                </div>
                <div>
                  <h3 className="font-semibold">2. Deploy the Rules in Firebase</h3>
                  <p className="text-sm">Go to the Firebase Console, select your project, go to the "Firestore Database" section, and click the "Rules" tab. Paste the copied rules into the editor, replacing anything that's currently there, and click "Publish".</p>
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
  const { authStatus, profileError } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (authStatus === 'UNAUTHENTICATED') {
      router.push('/login');
    }
  }, [authStatus, router]);

  if (authStatus === 'LOADING' || authStatus === 'AWAITING_PROFILE') {
    return <LoadingScreen status={authStatus} />;
  }

  if (authStatus === 'ERROR') {
    return <ErrorScreen error={profileError} />;
  }

  if (authStatus === 'READY') {
    return <>{children}</>;
  }

  // Fallback loading screen
  return <LoadingScreen status="LOADING" />;
};
