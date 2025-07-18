
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, type AuthError } from 'firebase/auth';
import { LogInIcon, Mail, KeyRound, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
import { NavigationContext } from '@/components/layout/AppShell';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthLoading } = useAuth();
  const navContext = useContext(NavigationContext);

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isAuthLoading, router]);

  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({ title: 'Validation Error', description: 'Email cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!password) {
      toast({ title: 'Validation Error', description: 'Password cannot be empty.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      router.push('/dashboard');
    } catch (error: any) {
      const authError = error as AuthError;
      let errorMessage = 'An unexpected error occurred during login. Please try again.';

      if (authError.code) {
        switch (authError.code) {
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'This user account has been disabled.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please check your credentials.';
            break;
          case 'auth/api-key-expired':
          case 'auth/invalid-api-key':
            setLoginError('Your Firebase API Key is invalid or expired. Please check your .env.local file and follow Step 3.1 of the FIREBASE_SETUP_CHECKLIST.md guide carefully.');
            errorMessage = 'Invalid Firebase API Key configuration.';
            break;
          default:
            errorMessage = authError.message || 'An unknown login error occurred.';
            break;
        }
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      if(authError.code !== 'auth/invalid-api-key' && authError.code !== 'auth/api-key-expired') {
        toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
      }
      console.error("Firebase Login Error:", error);
    } finally {
      setIsSubmitting(false);
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
      }
      toast({ title: 'Password Reset Error', description: toastMessage, variant: 'destructive' });
      console.error("Firebase Password Reset Error:", error);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (isAuthLoading && !user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <p className="font-body text-muted-foreground">Loading...</p>
        </div>
    );
  }

  // If user is logged in, useEffect will redirect. Return loader in the meantime.
  if (user) {
     return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <p className="font-body text-muted-foreground">Redirecting to dashboard...</p>
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
          {loginError && (
              <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-headline">Configuration Error</AlertTitle>
                  <AlertDescription className="font-body">
                      {loginError}
                  </AlertDescription>
              </Alert>
          )}
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
                  disabled={isSubmitting}
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
                        {isResettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  disabled={isSubmitting}
                  className="font-body pl-10 pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? 'Logging In...' : 'Log In'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-6 font-body">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline" onClick={handleNavigation}>
              Sign Up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
