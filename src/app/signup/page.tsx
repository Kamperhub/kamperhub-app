
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
import { createUserWithEmailAndPassword, updateProfile, type AuthError } from 'firebase/auth';
import { UserPlus, Mail, User, KeyRound, MapPin, Building, Globe } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MOCK_AUTH_LOGGED_IN_KEY } from '@/types/auth'; // Still used for quick redirect check

const signupSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  username: z.string()
    .min(3, "User Name must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "User Name can only contain letters, numbers, underscores, hyphens, and periods."),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  city: z.string().min(1, "City is required*"),
  state: z.string().min(1, "State / Region is required*"),
  country: z.string().min(1, "Country is required*"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
      city: '',
      state: '',
      country: '',
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // This initial redirect check can remain as it uses a simple flag
    // Firebase's onAuthStateChanged will handle more robust session management elsewhere.
    if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem(MOCK_AUTH_LOGGED_IN_KEY) === 'true';
        if (isLoggedIn && auth.currentUser) { // Check Firebase auth state too
            router.push('/my-account');
        }
    }
  }, [router]);

  const handleSignup: SubmitHandler<SignupFormData> = async (data) => {
    setIsLoading(true);

    const { email, password, username, firstName, lastName, city, state, country } = data;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Set the displayName (profile update)
      // For now, let's use the username as displayName. We can refine this later.
      // Or concatenate first and last name: `${firstName} ${lastName}`
      await updateProfile(firebaseUser, {
        displayName: username, // Using username from form as displayName
      });

      // Note: City, State, Country are not stored in Firebase Auth user profile directly.
      // This data will need to be saved to Firestore in a later step, associated with firebaseUser.uid.
      // For now, this signup focuses on creating the Firebase Auth user.

      toast({
        title: 'Sign Up Successful!',
        description: `Welcome, ${firstName}! Your account for ${email} has been created. You are now logged in.`,
      });

      // Firebase handles its own session, so we don't need to set MOCK_AUTH_LOGGED_IN_KEY here for Firebase.
      // However, to prevent the immediate redirect flicker if Header/MyAccount haven't updated yet,
      // we can set it. This will be superseded by onAuthStateChanged.
      if (typeof window !== 'undefined') localStorage.setItem(MOCK_AUTH_LOGGED_IN_KEY, 'true');


      router.push('/my-account'); // Redirect to account page
      router.refresh(); // Force refresh to update header/layout based on new auth state

    } catch (error: any) {
      const authError = error as AuthError;
      let toastMessage = 'An unexpected error occurred during sign up. Please try again.'; // Default

      if (authError.code) {
        switch (authError.code) {
          case 'auth/email-already-in-use':
            toastMessage = 'This email address is already in use by another account.';
            break;
          case 'auth/invalid-email':
            toastMessage = 'The email address is not valid.';
            break;
          case 'auth/operation-not-allowed':
            toastMessage = 'Email/password accounts are not enabled.';
            break;
          case 'auth/weak-password':
            toastMessage = 'The password is too weak.';
            break;
          default:
            toastMessage = authError.message || 'An unknown sign-up error occurred.';
            break;
        }
      } else if (authError.message) {
        toastMessage = authError.message;
      }
      toast({ title: 'Sign Up Failed', description: toastMessage, variant: 'destructive' });
      console.error("Firebase Signup Error:", error); // Log the original error object
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
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UserPlus className="mr-2 h-6 w-6" /> Create Your KamperHub Account
          </CardTitle>
          <CardDescription className="font-body">
            All fields marked * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="font-body">First Name*</Label>
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
                <Label htmlFor="lastName" className="font-body">Last Name*</Label>
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
              <Label htmlFor="username" className="font-body">User Name* (for display)</Label>
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
              <Label htmlFor="email" className="font-body">Email Address* (for login)</Label>
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
              {errors.email && <p className="text-xs text-destructive font-body mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password" className="font-body">Password*</Label>
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
              <Label htmlFor="confirmPassword" className="font-body">Confirm Password*</Label>
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

            <h3 className="font-headline text-lg text-primary pt-2">Location Details*</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city" className="font-body">City*</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="city" {...register("city")} placeholder="e.g., Perth" disabled={isLoading} className="font-body pl-10" />
                </div>
                {errors.city && <p className="text-xs text-destructive font-body mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <Label htmlFor="state" className="font-body">State / Region*</Label>
                 <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="state" {...register("state")} placeholder="e.g., WA" disabled={isLoading} className="font-body pl-10" />
                </div>
                {errors.state && <p className="text-xs text-destructive font-body mt-1">{errors.state.message}</p>}
              </div>
              <div>
                <Label htmlFor="country" className="font-body">Country*</Label>
                 <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="country" {...register("country")} placeholder="e.g., Australia" disabled={isLoading} className="font-body pl-10" />
                </div>
                {errors.country && <p className="text-xs text-destructive font-body mt-1">{errors.country.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90 mt-6" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up with Firebase'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4 font-body">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
