
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  MOCK_AUTH_USERNAME_KEY, 
  MOCK_AUTH_LOGGED_IN_KEY, 
  MOCK_AUTH_EMAIL_KEY, 
  MOCK_AUTH_FIRST_NAME_KEY,
  MOCK_AUTH_LAST_NAME_KEY,
  MOCK_AUTH_SUBSCRIPTION_TIER_KEY, 
  MOCK_AUTH_USER_REGISTRY_KEY,
  type SubscriptionTier,
  type MockUserRegistryEntry
} from '@/types/auth';
import { LogInIcon, User } from 'lucide-react'; // Changed UserPlus to LogInIcon

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem(MOCK_AUTH_LOGGED_IN_KEY) === 'true';
        if (isLoggedIn) {
            router.push('/my-account'); 
        }
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      toast({ title: 'Validation Error', description: 'User Name cannot be empty.', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const storedRegistryJson = localStorage.getItem(MOCK_AUTH_USER_REGISTRY_KEY);
        const userRegistry: MockUserRegistryEntry[] = storedRegistryJson ? JSON.parse(storedRegistryJson) : [];
        
        const foundUser = userRegistry.find(user => user.username.toLowerCase() === trimmedUsername.toLowerCase());

        if (foundUser) {
          localStorage.setItem(MOCK_AUTH_USERNAME_KEY, foundUser.username);
          localStorage.setItem(MOCK_AUTH_EMAIL_KEY, foundUser.email);
          localStorage.setItem(MOCK_AUTH_FIRST_NAME_KEY, foundUser.firstName);
          localStorage.setItem(MOCK_AUTH_LAST_NAME_KEY, foundUser.lastName);
          localStorage.setItem(MOCK_AUTH_LOGGED_IN_KEY, 'true');
          // For mock login, retrieve subscription tier or default. Let's default to 'free' for simplicity.
          // In a real app, this would come from the user's record.
          const userTier = localStorage.getItem(`${MOCK_AUTH_SUBSCRIPTION_TIER_KEY}_${foundUser.username}`) as SubscriptionTier | null;
          localStorage.setItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY, userTier || 'free' as SubscriptionTier);


          toast({
            title: 'Login Successful!',
            description: `Welcome back, ${foundUser.firstName}!`,
          });
          window.dispatchEvent(new Event('storage')); 
          router.push('/my-account');
          router.refresh();
        } else {
          toast({ title: 'Login Failed', description: 'User Name not found. Please check your username or sign up.', variant: 'destructive' });
        }
      }
      setIsLoading(false);
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
            <LogInIcon className="mr-2 h-6 w-6" /> Log In to KamperHub
          </CardTitle>
          <CardDescription className="font-body">
            Enter your username to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label htmlFor="username" className="font-body">User Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your registered username"
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
           <p className="text-xs text-center text-muted-foreground mt-4 font-body">
              This is a conceptual login. No real accounts are stored on a server. Data is checked against your browser's storage.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
