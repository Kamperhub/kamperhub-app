
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthStatus } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const LoadingScreen = ({ status }: { status: AuthStatus }) => {
  const message = {
    'LOADING': 'Initializing...',
    'AWAITING_PROFILE': 'Verifying access...',
  }[status] || 'Loading...';

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-primary font-body">{message}</p>
    </div>
  );
};

// This is a "bulletproof" error component. It uses no custom components or icons,
// only basic JSX and Tailwind classes to ensure it can always render, even during a critical failure.
const ErrorScreen = ({ error }: { error: string | null }) => {
  const errorMessage = error || "An unknown error occurred.";
  const isAdminError = errorMessage.toLowerCase().includes('admin');
  const isConfigError = errorMessage.toLowerCase().includes('firebase client error');
  const isTimeoutError = errorMessage.toLowerCase().includes('authentication timed out');

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


export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
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

  return <LoadingScreen status="LOADING" />;
};
