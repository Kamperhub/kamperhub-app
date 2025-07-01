
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
  const errorMessage = error || "An unknown error occurred.";

  const handleGoToDebug = () => {
    window.open('/api/debug/env', '_blank');
  };
  
  const handleCreateAdmin = () => {
    window.open('/api/debug/create-admin-user', '_blank');
  };

  const renderErrorDetails = () => {
    if (errorMessage.includes("profile not found")) {
      return (
        <div className="mt-4 border-t border-destructive/20 pt-3">
          <p className="font-bold">This is a common setup issue for new projects or users.</p>
          <ul className="list-disc pl-5 mt-1 text-sm space-y-2">
            <li>It means you're successfully authenticated with Firebase, but your user-specific data document doesn't exist in the Firestore database.</li>
            {errorMessage.includes("admin") && (
              <li>
                Since you're the admin, you can fix this instantly. Click the button below to create your profile document.
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleCreateAdmin}>Create Admin User Profile</Button>
              </li>
            )}
            <li>If you are not the admin, this indicates the signup process may have been interrupted. Please contact support.</li>
          </ul>
        </div>
      );
    }
    if (errorMessage.includes("permission issue") || errorMessage.includes("permission denied") || errorMessage.includes("timed out")) {
        return (
             <div className="mt-4 border-t border-destructive/20 pt-3">
                <p className="font-bold">This is likely a server configuration or permission issue.</p>
                <ul className="list-disc pl-5 mt-1 text-sm space-y-2">
                    <li>A timeout or permission error usually means the server is running but cannot access the database.</li>
                    <li>
                      Use the diagnostic tool to check your server's environment variables and ensure the Project IDs match.
                      <Button variant="link" className="p-1 h-auto text-destructive-foreground" onClick={handleGoToDebug}>
                        Open Debug Tool
                      </Button>
                    </li>
                    <li>Check the <code className="font-mono text-xs bg-background/20 px-1 rounded">IAM & Admin</code> section of your Google Cloud Console and ensure the service account has the `Cloud Datastore User` or `Firebase Admin` role.</li>
                    <li>Verify your `firestore.rules` are deployed and allow read access for authenticated users.</li>
                </ul>
            </div>
        )
    }
    return (
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
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <Alert variant="destructive" className="max-w-2xl text-left">
            <ShieldX className="h-4 w-4" />
            <AlertTitle className="font-headline">Access Denied or Application Error</AlertTitle>
            <AlertDescription className="font-body mt-2 space-y-3">
                <p>The application failed to initialize correctly. This is often due to a configuration issue.</p>
                <pre className="mt-2 text-xs bg-destructive-foreground/10 p-2 rounded-md font-mono whitespace-pre-wrap">
                      {errorMessage}
                </pre>
                {renderErrorDetails()}
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
