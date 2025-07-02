
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
  
  // This is a direct check for the most likely error.
  const isUnauthenticatedError = errorMessage.toLowerCase().includes('unauthenticated');

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <div className="max-w-2xl w-full border border-destructive bg-destructive/10 text-destructive-foreground p-6 rounded-lg">
        <h1 className="text-xl font-bold font-headline">
          Server Connection Error
        </h1>
        <p className="mt-2 font-body">The application server cannot connect to the database.</p>
        <pre className="mt-4 text-xs bg-black/20 p-3 rounded-md font-mono whitespace-pre-wrap text-left">
          {errorMessage}
        </pre>
        
        {isUnauthenticatedError && (
          <div className="mt-4 border-t border-red-400/30 pt-3 text-left font-body space-y-4">
            <p className="font-bold">This is a server permissions issue. It means the Service Account used by the server is not authorized to access Firestore. Please check the following in your Google Cloud Console for project <code className="bg-black/20 px-1 rounded-sm">kamperhub-s4hc2</code>:</p>
            
            <div>
              <h3 className="font-semibold">1. Verify Service Account Roles</h3>
              <p className="text-sm">The service account needs the <strong className="text-red-300">"Editor"</strong> or <strong className="text-red-300">"Cloud Datastore User"</strong> role.</p>
              <a 
                href="https://console.cloud.google.com/iam-admin/iam?project=kamperhub-s4hc2" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-cyan-400 hover:underline"
              >
                Go to IAM & Admin Page &rarr;
              </a>
              <p className="text-xs mt-1">Find the service account email (it's in your credentials JSON file) and check its "Role" column.</p>
            </div>

            <div>
              <h3 className="font-semibold">2. Verify Firestore API is Enabled</h3>
              <p className="text-sm">The "Cloud Firestore API" must be enabled for the project.</p>
              <a 
                href="https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=kamperhub-s4hc2" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-cyan-400 hover:underline"
              >
                Go to Firestore API Page &rarr;
              </a>
               <p className="text-xs mt-1">Click the "Enable" button if it is not already enabled.</p>
            </div>
             <p className="mt-2 text-sm">After making changes in the Cloud Console, you may need to restart the application server.</p>
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
