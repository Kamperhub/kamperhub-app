
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase'; // Import Firebase auth
import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
import { MOCK_AUTH_LOGGED_IN_KEY } from '@/types/auth'; 
import { LogInIcon, Mail, KeyRound } from 'lucide-react'; 

export default function LoginPage() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
        // This check helps redirect users away from login if they are already authenticated.
        const isLoggedInViaMock = localStorage.getItem(MOCK_AUTH_LOGGED_IN_KEY) === 'true';
        if ((isLoggedInViaMock || auth.currentUser) && auth.currentUser) { 
            router.push('/'); 
        }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({ title: 'Validation Error', description: 'Email cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!password) {
      toast({ title: 'Validation Error', description: 'Password cannot be empty.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const firebaseUser = userCredential.user;

      toast({
        title: 'Login Successful!',
        description: `Welcome back, ${firebaseUser.displayName || firebaseUser.email}!`,
      });

      // No longer setting MOCK_AUTH_LOGGED_IN_KEY here. Firebase Auth is the source of truth.

      router.push('/'); 
      router.refresh(); 
    } catch (error: any) {
      const authError = error as AuthError;
      let toastMessage = 'An unexpected error occurred during login. Please try again.'; 

      if (authError.code) {
        switch (authError.code) {
          case 'auth/invalid-email':
            toastMessage = 'The email address is not valid.';
            break;
          case 'auth/user-disabled':
            toastMessage = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            toastMessage = 'Invalid email or password. Please check your credentials.';
            break;
          default:
            toastMessage = authError.message || 'An unknown login error occurred.';
            break;
        }
      } else if (authError.message) {
        toastMessage = authError.message;
      }
      
      toast({ title: 'Login Failed', description: toastMessage, variant: 'destructive' });
      console.error("Firebase Login Error:", error); 
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasMounted) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <p className="font-body text-muted-foreground">Loading...</p>
        </div>
    );
  }

  return (
    <div className="flex justify-center items-start pt-10 min-h-screen">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <LogInIcon className="mr-2 h-6 w-6" /> Log In to KamperHub
          </CardTitle>
          <CardDescription className="font-body">
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="email" className="font-body">Email Address</Label> 
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> 
                <Input
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com" 
                  disabled={isLoading}
                  className="font-body pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password" className="font-body">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  disabled={isLoading}
                  className="font-body pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-6 font-body">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
