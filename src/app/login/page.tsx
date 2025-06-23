
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail, type AuthError } from 'firebase/auth';
import { LogInIcon, Mail, KeyRound, Send } from 'lucide-react'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Redirect if user is already logged in
    if (auth.currentUser) {
      router.push('/');
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

  const handlePasswordResetRequest = async () => {
    if (!resetEmail.trim()) {
      toast({ title: 'Email Required', description: 'Please enter your email address.', variant: 'destructive' });
      return;
    }
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists for this email, a password reset link has been sent. Please check your inbox (and spam folder).',
        duration: 7000,
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      const authError = error as AuthError;
      let toastMessage = 'Failed to send password reset email. Please try again.';
      if (authError.code === 'auth/invalid-email') {
        toastMessage = 'The email address is not valid.';
      } else if (authError.code === 'auth/user-not-found') {
        // We typically don't reveal if a user exists for security. The generic message above is better.
        // But for debugging or if you choose to be more specific:
        // toastMessage = 'No user found with this email address.';
      }
      toast({ title: 'Password Reset Error', description: toastMessage, variant: 'destructive' });
      console.error("Firebase Password Reset Error:", error);
    } finally {
      setIsResettingPassword(false);
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
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="font-body">Password</Label>
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" type="button" className="p-0 h-auto text-xs font-body text-primary hover:underline">
                      Forgot Password?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-headline">Reset Password</DialogTitle>
                      <DialogDescription className="font-body">
                        Enter your email address below and we'll send you a link to reset your password.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reset-email" className="text-right font-body col-span-1">
                          Email
                        </Label>
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="col-span-3 font-body"
                          disabled={isResettingPassword}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline" className="font-body">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="button" onClick={handlePasswordResetRequest} disabled={isResettingPassword} className="font-body bg-primary text-primary-foreground hover:bg-primary/90">
                        {isResettingPassword && <LogInIcon className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  disabled={isLoading}
                  className="font-body pl-10"
                  autoComplete="current-password"
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
