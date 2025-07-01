
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthStatus } from '@/hooks/useAuth';
import { Loader2, AlertTriangle, ShieldX } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '../ui/button';

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

const ErrorScreen = ({ error }: { error: string | null }) => {
  const router = useRouter();

  const handleGoToDebug = () => {
    window.open('/api/debug/env', '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <Alert variant="destructive" className="max-w-2xl text-left">
            <ShieldX className="h-4 w-4" />
            <AlertTitle className="font-headline">Access Denied or Application Error</AlertTitle>
            <AlertDescription className="font-body mt-2 space-y-3">
                <p>The application failed to initialize correctly. This is often due to a configuration issue.</p>
                <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-mono whitespace-pre-wrap">
                      {error || "An unknown error occurred."}
                </pre>
                 <div className="mt-4 border-t border-destructive/20 pt-3">
                    <p className="font-bold">Next Steps:</p>
                    <ul className="list-disc pl-5 mt-1 text-sm">
                        <li>Ensure you have followed the <code className="font-mono text-xs bg-background/20 px-1 rounded">FIREBASE_SETUP_CHECKLIST.md</code> guide.</li>
                        <li>
                          Use the diagnostic tool to check your server's environment variables.
                          <Button variant="link" className="p-1 h-auto text-destructive-foreground" onClick={handleGoToDebug}>
                            Open Debug Tool
                          </Button>
                        </li>
                         <li>If the issue persists, check your browser console and server logs for more details.</li>
                    </ul>
                </div>
            </AlertDescription>
        </Alert>
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

    