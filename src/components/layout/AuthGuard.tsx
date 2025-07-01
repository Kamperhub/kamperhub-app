
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthStatus } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ status }: { status: AuthStatus }) => {
  const [showSlowLoadMessage, setShowSlowLoadMessage] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (status === 'AWAITING_PROFILE') {
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
        <div className="mt-6 max-w-lg p-4 rounded-md border border-amber-500 bg-amber-500/10 text-amber-200">
            <h3 className="font-bold text-amber-300">Still waiting?</h3>
            <p className="text-sm text-left mt-2">If you are the site administrator and this is your first time logging in, your user profile might not exist in the database yet.</p>
            <p className="text-sm text-left mt-2">You can use this one-time tool to create it. After a success message appears in the new tab, please refresh this page.</p>
            <a 
                href="/api/debug/create-admin-user" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-block mt-3 bg-amber-500 text-black py-2 px-4 rounded-md hover:bg-amber-600 font-semibold"
            >
                Create Admin Profile
            </a>
        </div>
      )}
    </div>
  );
};


const ErrorScreen = ({ error }: { error: string | null }) => {
  const errorMessage = error || "An unknown error occurred.";
  const isAdminError = errorMessage.toLowerCase().includes('admin');
  const isConfigError = errorMessage.toLowerCase().includes('firebase client error');
  const isTimeoutError = errorMessage.toLowerCase().includes('authentication timed out');
  const isDbNotFoundError = errorMessage.toLowerCase().includes('database has not been created');


  const renderAdvice = () => {
    if (isAdminError) {
      return (
        <div className="mt-4 border-t border-red-400/30 pt-3 text-left font-body">
          <p className="font-bold">Action Required for Admin:</p>
          <p>Your admin profile was not found in the database. Please use the one-time tool to create it.</p>
          <a
            href="/api/debug/create-admin-user"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 font-semibold"
          >
            Create Admin Profile
          </a>
           <p className="text-xs mt-2">After creating the profile, please refresh this page.</p>
        </div>
      );
    }
     if (isDbNotFoundError) {
        return (
            <div className="mt-4 border-t border-red-400/30 pt-3 text-left font-body">
                <p className="font-bold">This is an environment setup issue, not a code problem.</p>
                <p>Please follow the updated instructions in <code className="bg-black/20 px-1 rounded-sm">FIREBASE_SETUP_CHECKLIST.md</code>, especially <strong>Step 6</strong>, which guides you to create the Firestore database in the Firebase Console.</p>
            </div>
        );
    }
    if (isConfigError || isTimeoutError) {
        return (
             <div className="mt-4 border-t border-red-400/30 pt-3 text-left font-body">
                <p className="font-bold">This is likely a configuration issue.</p>
                <p className="mt-2">
                    Please use the built-in diagnostic tool at <a href="/api/debug/env" target="_blank" rel="noopener noreferrer" className="underline font-bold">/api/debug/env</a> to see the exact server-side error, then follow the instructions in the <code className="bg-black/20 px-1 rounded-sm">FIREBASE_SETUP_CHECKLIST.md</code> file to fix your <code className="bg-black/20 px-1 rounded-sm">.env.local</code> file.
                </p>
                 <p className="text-xs mt-2">Remember to restart your development server after any changes to <code className="bg-black/20 px-1 rounded-sm">.env.local</code>.</p>
            </div>
        )
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <div className="max-w-2xl w-full border border-destructive bg-destructive/10 text-destructive-foreground p-6 rounded-lg">
        <h1 className="text-xl font-bold font-headline">
          Application Error
        </h1>
        <p className="mt-2 font-body">The application failed to initialize correctly.</p>
        <pre className="mt-4 text-xs bg-black/20 p-3 rounded-md font-mono whitespace-pre-wrap text-left">
          {errorMessage}
        </pre>
        {renderAdvice()}
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
