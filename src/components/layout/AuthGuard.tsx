
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
        <div className="mt-6 max-w-lg p-4 rounded-md border border-amber-500 bg-amber-500/10 text-amber-200">
            <h3 className="font-bold text-amber-300">Still waiting?</h3>
            <p className="text-sm text-left mt-2">If loading is stuck here, it usually means the application can't connect to the server's backend services.</p>
            <p className="text-sm text-left mt-2">This is often caused by a server crash during startup due to a misconfiguration in your <code className="bg-black/20 px-1 rounded-sm">.env.local</code> file.</p>
             <p className="text-sm text-left mt-2">Please check your server's terminal logs for a specific error message, then use the <code className="bg-black/20 px-1 rounded-sm">FIREBASE_SETUP_CHECKLIST.md</code> file to resolve the issue.</p>
        </div>
      )}
    </div>
  );
};


const ErrorScreen = ({ error }: { error: string | null }) => {
  const errorMessage = error || "An unknown error occurred.";
  const isDbConnectionError =
    errorMessage.toLowerCase().includes('unauthenticated') ||
    errorMessage.toLowerCase().includes('permission-denied') ||
    errorMessage.toLowerCase().includes('database has not been created') ||
    errorMessage.toLowerCase().includes('not_found');

  const renderAdvice = () => {
    if (isDbConnectionError) {
      return (
        <div className="mt-4 border-t border-red-400/30 pt-3 text-left font-body">
          <p className="font-bold">This points to a server-to-database connection failure.</p>
          <p>Even with correct keys, this can happen if the Firestore database hasn't been created or if permissions are missing.</p>
          <p className="mt-2 font-semibold">Please run the following diagnostic tool:</p>
          <a
            href="/api/debug/create-admin-user"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 bg-white text-black py-2 px-4 rounded-md hover:bg-gray-200 font-semibold"
          >
            Run Database Connection Test
          </a>
          <p className="text-xs mt-2">This tool will attempt to connect to the database and provide a specific success or failure message. Follow the instructions in `FIREBASE_SETUP_CHECKLIST.md` based on its output.</p>
        </div>
      );
    }
    return (
        <div className="mt-4 border-t border-red-400/30 pt-3 text-left font-body">
            <p className="font-bold">This may be a client-side configuration issue.</p>
            <p className="mt-2">Please ensure your <code className="bg-black/20 px-1 rounded-sm">.env.local</code> file contains the correct <code className="bg-black/20 px-1 rounded-sm">NEXT_PUBLIC_FIREBASE_*</code> variables for your project and that you have restarted the development server.</p>
        </div>
    );
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
