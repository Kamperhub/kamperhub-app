
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
import { UserPlus, Mail, User, KeyRound } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  username: z.string()
    .min(3, "User Name must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "User Name can only contain letters, numbers, underscores, hyphens, and periods."),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // Set error on confirmPassword field
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

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

  const handleSignup: SubmitHandler<SignupFormData> = (data) => {
    setIsLoading(true);

    const trimmedUsername = data.username.trim();
    const trimmedEmail = data.email.trim().toLowerCase();
    const trimmedFirstName = data.firstName.trim();
    const trimmedLastName = data.lastName.trim();
    // For this mock, we'll store the password as is. In a real app, NEVER do this.
    const mockPassword = data.password; 

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
        lastName: trimmedLastName,
        password: mockPassword // Store the mock password
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
        localStorage.setItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY, 'free' as SubscriptionTier);
      }
      toast({
        title: 'Sign Up Successful!',
        description: `Welcome, ${trimmedFirstName}! Your username is ${trimmedUsername}. You are now logged in.`,
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
            All fields are required. You'll start on the 'Free' tier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="font-body">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  {...register("firstName")}
                  placeholder="e.g., Jane"
                  disabled={isLoading}
                  className="font-body"
                />
                {errors.firstName && <p className="text-xs text-destructive font-body mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="lastName" className="font-body">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  {...register("lastName")}
                  placeholder="e.g., Doe"
                  disabled={isLoading}
                  className="font-body"
                />
                {errors.lastName && <p className="text-xs text-destructive font-body mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="username" className="font-body">User Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="username"
                    type="text"
                    {...register("username")}
                    placeholder="e.g., CamperPro123"
                    disabled={isLoading}
                    className="font-body pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-body">
                Min 3 characters. Allowed: letters, numbers, underscore, hyphen, period.
              </p>
              {errors.username && <p className="text-xs text-destructive font-body mt-1">{errors.username.message}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="font-body">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="e.g., your.email@example.com"
                  disabled={isLoading}
                  className="font-body pl-10" 
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-body">
                We'll use this for account-related communication.
              </p>
              {errors.email && <p className="text-xs text-destructive font-body mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="font-body">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Min. 6 characters"
                  disabled={isLoading}
                  className="font-body pl-10"
                />
              </div>
              {errors.password && <p className="text-xs text-destructive font-body mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="font-body">Confirm Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Re-enter your password"
                  disabled={isLoading}
                  className="font-body pl-10"
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive font-body mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4 font-body">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log In
            </Link>
          </p>
           <p className="text-xs text-center text-muted-foreground mt-3 font-body">
              This is a conceptual signup. No real accounts are created on a server. Data is stored in your browser.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
