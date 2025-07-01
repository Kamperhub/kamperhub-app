
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthStatus } from '@/hooks/useAuth';
import { Loader2, ShieldX } from 'lucide-react';

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

// This component is intentionally simple to guarantee it can render even when the app is in a broken state.
// It avoids complex components and hooks like useRouter or Button which might fail.
const ErrorScreen = ({ error }: { error: string | null }) => {
  const errorMessage = error || "An unknown error occurred.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <div className="max-w-2xl w-full border border-destructive bg-destructive/10 text-destructive-foreground p-6 rounded-lg">
        <h1 className="text-xl font-bold font-headline flex items-center justify-center">
          <ShieldX className="h-6 w-6 mr-3" />
          Access Denied or Application Error
        </h1>
        <p className="mt-2 font-body">The application failed to initialize correctly. This is often due to a configuration issue.</p>
        <pre className="mt-4 text-xs bg-black/20 p-3 rounded-md font-mono whitespace-pre-wrap text-left">
          {errorMessage}
        </pre>
        {errorMessage.includes('profile not found') && errorMessage.includes('admin') && (
           <div className="mt-4 border-t border-destructive/20 pt-3 text-left font-body">
             <p className="font-bold">Action Required:</p>
             <p>As the admin, your profile doesn't exist in the database yet. Please use the one-time tool to create it.</p>
             <a 
               href="/api/debug/create-admin-user" 
               target="_blank" 
               rel="noopener noreferrer" 
               className="inline-block mt-2 bg-background text-foreground py-2 px-4 rounded-md hover:bg-background/80 font-semibold"
             >
               Create Admin Profile
             </a>
           </div>
        )}
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
  
  // This will catch the 'UNAUTHENTICATED' case while redirect is happening,
  // or any other unexpected state, showing a loading screen to prevent flicker.
  return <LoadingScreen status="LOADING" />;
};
