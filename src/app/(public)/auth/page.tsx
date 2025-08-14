// src/app/(public)/auth/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID,
    EmailAuthProvider.PROVIDER_ID,
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false,
  },
};

export default function AuthPage() {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [renderUi, setRenderUi] = useState(false);

  useEffect(() => {
    // FirebaseUI depends on window. So we only render it on the client.
    setRenderUi(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && user) {
      const redirectedFrom = searchParams.get('redirectedFrom');
      router.push(redirectedFrom || '/dashboard');
    }
  }, [user, isAuthLoading, router, searchParams]);

  if (isAuthLoading || user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 font-body">Loading your session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-3xl font-headline text-primary mb-2">Welcome to KamperHub</h1>
      <p className="text-muted-foreground font-body mb-8">Sign in or create an account to continue</p>
      {renderUi && <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />}
    </div>
  );
}
