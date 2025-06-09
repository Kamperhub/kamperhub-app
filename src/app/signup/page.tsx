
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MOCK_AUTH_USERNAME_KEY, MOCK_AUTH_LOGGED_IN_KEY, MOCK_AUTH_EMAIL_KEY } from '@/types/auth';
import { UserPlus, Mail } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // New state for email
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem(MOCK_AUTH_LOGGED_IN_KEY) === 'true';
        if (isLoggedIn) {
            router.push('/my-account'); // Redirect if already "logged in"
        }
    }
  }, [router]);

  const validateEmail = (email: string) => {
    // Basic email validation regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: 'Validation Error',
        description: 'User Name cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    if (username.trim().length < 3) {
      toast({
        title: 'Validation Error',
        description: 'User Name must be at least 3 characters long.',
        variant: 'destructive',
      });
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim())) {
      toast({
        title: 'Validation Error',
        description: 'User Name can only contain letters, numbers, underscores, hyphens, and periods.',
        variant: 'destructive',
      });
      return;
    }
    if (!email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    if (!validateEmail(email.trim())) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_AUTH_USERNAME_KEY, username.trim());
        localStorage.setItem(MOCK_AUTH_EMAIL_KEY, email.trim()); // Save email
        localStorage.setItem(MOCK_AUTH_LOGGED_IN_KEY, 'true');
      }
      toast({
        title: 'Sign Up Successful!',
        description: `Welcome, ${username.trim()}! Your email ${email.trim()} has been noted.`,
      });
      setIsLoading(false);
      router.push('/my-account');
      window.dispatchEvent(new Event('storage')); 
      router.refresh(); 
    }, 1000);
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
            <UserPlus className="mr-2 h-6 w-6" /> Create Your KamperHub Account
          </CardTitle>
          <CardDescription className="font-body">
            Enter a User Name and Email to get started. The User Name will be public (e.g., on leaderboards).
            Your email will be kept private but may be used for communication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <Label htmlFor="username" className="font-body">User Name</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., CamperPro123"
                disabled={isLoading}
                className="font-body"
              />
              <p className="text-xs text-muted-foreground mt-1 font-body">
                Min 3 characters. Allowed: letters, numbers, underscore, hyphen, period.
              </p>
            </div>
            <div>
              <Label htmlFor="email" className="font-body">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., your.email@example.com"
                  disabled={isLoading}
                  className="font-body pl-10" 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-body">
                We'll use this for account-related communication.
              </p>
            </div>
            <Button type="submit" className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
           <p className="text-xs text-center text-muted-foreground mt-4 font-body">
              This is a conceptual signup. No real accounts are created on a server. Data is stored in your browser.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
