
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthStatus } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ status }: { status: AuthStatus }) => {
  const [showSlowLoadMessage, setShowSlowLoadMessage] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (status === 'AWAITING_PROFILE' || status === 'LOADING') {
      timer = setTimeout(() => {
        setShowSlowLoadMessage(true);
      }, 5000); // After 5 seconds, show the helper message
    }
    return () => clearTimeout(timer);
  }, [status]);


  const message = {
    'LOADING': 'Initializing...',
    'AWAITING_PROFILE': 'Verifying access...',
  }[status] || 'Loading...';

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-primary font-body">{message}</p>
      
      {showSlowLoadMessage && (
        <div className="mt-6 max-w-lg p-4 rounded-md border border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <h3 className="font-bold text-amber-800 dark:text-amber-200">Still waiting?</h3>
            <p className="text-sm text-left mt-2">If loading is stuck, it may be due to a network issue or a problem with the application's configuration.</p>
            <p className="text-sm text-left mt-2">Please check your browser's developer console for any specific error messages (e.g., App Check failures). If the issue persists, verify all keys in your <code className="bg-black/20 px-1 rounded-sm">.env.local</code> file are correct and that the server has started without errors.</p>
        </div>
      )}
    </div>
  );
};


const ErrorScreen = ({ error }: { error: string | null }) => {
  const errorMessage = error || "An unknown error occurred.";
  
  // This is a direct check for the most likely error.
  const isUnauthenticatedError = errorMessage.toLowerCase().includes('unauthenticated');
  const isMissingDocError = errorMessage.toLowerCase().includes('profile not found');
  const isAdminError = isMissingDocError && errorMessage.toLowerCase().includes('admin');

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <div className="max-w-2xl w-full border border-destructive bg-destructive/10 text-destructive-foreground p-6 rounded-lg">
        <h1 className="text-xl font-bold font-headline">
            {isAdminError ? "Admin Profile Missing" : "Application Error"}
        </h1>
        <p className="mt-2 font-body">There was a problem loading your user data.</p>
        <pre className="mt-4 text-xs bg-black/20 p-3 rounded-md font-mono whitespace-pre-wrap text-left">
          {errorMessage}
        </pre>
        
        {isUnauthenticatedError && (
          <div className="mt-4 border-t border-red-400/30 pt-3 text-left font-body space-y-4">
            <p className="font-bold">This is a permissions issue. It means the application is being blocked by Firestore's Security Rules. Please follow these steps:</p>
            
            <div>
              <h3 className="font-semibold">1. Copy the Security Rules</h3>
              <p className="text-sm">Open the file <code className="bg-black/20 px-1 rounded-sm">firestore.rules</code> from the file explorer on the left and copy its entire contents.</p>
            </div>

            <div>
              <h3 className="font-semibold">2. Deploy the Rules in Firebase</h3>
              <p className="text-sm">Go to the Firebase Console, select your project, go to the "Firestore Database" section, and click the "Rules" tab. Paste the copied rules into the editor, replacing anything that's currently there, and click "Publish".</p>
            </div>
             <p className="mt-2 text-sm">After publishing the rules, refresh this page.</p>
          </div>
        )}

         {isAdminError && (
          <div className="mt-4 border-t border-red-400/30 pt-3 text-left font-body space-y-4">
            <p className="font-bold">As the administrator, your profile document needs to be created manually once.</p>
             <a 
                href="/api/debug/create-admin-user" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-cyan-400 hover:underline block"
              >
                Click here to run the admin user creation tool &rarr;
              </a>
              <p className="text-xs">After running the tool successfully, refresh this page.</p>
          </div>
        )}
      </div>
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
