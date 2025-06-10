
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Import Link
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
import { UserPlus, Mail } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase(); 
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName) {
      toast({ title: 'Validation Error', description: 'First Name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!trimmedLastName) {
      toast({ title: 'Validation Error', description: 'Last Name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!trimmedUsername) {
      toast({ title: 'Validation Error', description: 'User Name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (trimmedUsername.length < 3) {
      toast({ title: 'Validation Error', description: 'User Name must be at least 3 characters long.', variant: 'destructive' });
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      toast({ title: 'Validation Error', description: 'User Name can only contain letters, numbers, underscores, hyphens, and periods.', variant: 'destructive' });
      return;
    }
    if (!trimmedEmail) {
      toast({ title: 'Validation Error', description: 'Email cannot be empty.', variant: 'destructive' });
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      toast({ title: 'Validation Error', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    if (typeof window !== 'undefined') {
      const storedRegistryJson = localStorage.getItem(MOCK_AUTH_USER_REGISTRY_KEY);
      const userRegistry: MockUserRegistryEntry[] = storedRegistryJson ? JSON.parse(storedRegistryJson) : [];

      const usernameExists = userRegistry.some(user => user.username.toLowerCase() === trimmedUsername.toLowerCase());
      if (usernameExists) {
        toast({ title: 'Signup Failed', description: 'This User Name is already taken. Please choose another.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const emailExists = userRegistry.some(user => user.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (emailExists) {
        toast({ title: 'Signup Failed', description: 'This Email address is already registered. Please use a different email.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const newUserEntry: MockUserRegistryEntry = { 
        username: trimmedUsername, 
        email: trimmedEmail, 
        firstName: trimmedFirstName, 
        lastName: trimmedLastName 
      };
      const updatedRegistry = [...userRegistry, newUserEntry];
      localStorage.setItem(MOCK_AUTH_USER_REGISTRY_KEY, JSON.stringify(updatedRegistry));
    }

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_AUTH_USERNAME_KEY, trimmedUsername);
        localStorage.setItem(MOCK_AUTH_EMAIL_KEY, trimmedEmail);
        localStorage.setItem(MOCK_AUTH_FIRST_NAME_KEY, trimmedFirstName);
        localStorage.setItem(MOCK_AUTH_LAST_NAME_KEY, trimmedLastName);
        localStorage.setItem(MOCK_AUTH_LOGGED_IN_KEY, 'true');
        localStorage.setItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY, 'free' as SubscriptionTier); // Default to free on signup
      }
      toast({
        title: 'Sign Up Successful!',
        description: `Welcome, ${trimmedFirstName} ${trimmedLastName}! Your username is ${trimmedUsername}. You are now logged in.`,
      });
      setIsLoading(false);
      window.dispatchEvent(new Event('storage')); 
      router.push('/my-account');
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
            Enter your details to get started. You'll start on the 'Free' tier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="font-body">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g., Jane"
                  disabled={isLoading}
                  className="font-body"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="font-body">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g., Doe"
                  disabled={isLoading}
                  className="font-body"
                />
              </div>
            </div>
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
          <p className="text-sm text-center text-muted-foreground mt-6 font-body">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log In
            </Link>
          </p>
           <p className="text-xs text-center text-muted-foreground mt-4 font-body">
              This is a conceptual signup. No real accounts are created on a server. Data is stored in your browser.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
