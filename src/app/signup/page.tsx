
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; 
import { createUserWithEmailAndPassword, updateProfile, type User as FirebaseUser, type AuthError } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { UserPlus, Mail, User, KeyRound, MapPin, Building, Globe, Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfile } from '@/types/auth';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel, // Added for a "Maybe Later" or close option
} from "@/components/ui/alert-dialog";

const signupSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  username: z.string()
    .min(3, "User Name must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "User Name can only contain letters, numbers, underscores, hyphens, and periods."),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-z]/, "Must include at least one lowercase letter.")
    .regex(/[A-Z]/, "Must include at least one uppercase letter.")
    .regex(/[0-9]/, "Must include at least one number.")
    .regex(/[\W_]/, "Must include at least one special character (e.g., !@#$%^&*)."),
  confirmPassword: z.string().min(1, "Please confirm your password."),
  city: z.string().min(1, "City is required*"),
  state: z.string().min(1, "State / Region is required*"),
  country: z.string().min(1, "Country is required*"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
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
  const [loadingMessage, setLoadingMessage] = useState('Creating Account...');
  const [showSubscriptionChoiceDialog, setShowSubscriptionChoiceDialog] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string, uid: string } | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
        if (auth.currentUser) { 
            router.push('/'); 
        }
    }
  }, [router]);

  const redirectToStripeCheckout = async (startTrial: boolean) => {
    if (!createdUser || !createdUser.email || !createdUser.uid) {
      toast({ title: "Error", description: "User details not available for subscription setup.", variant: "destructive" });
      setIsLoading(false); // Ensure loading state is reset
      return;
    }
    
    setShowSubscriptionChoiceDialog(false);
    setIsLoading(true);
    setLoadingMessage(startTrial ? 'Redirecting to setup Pro trial...' : 'Redirecting to subscribe...');

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: createdUser.email, 
          userId: createdUser.uid,
          startTrial: startTrial 
        }),
      });

      const session = await response.json();

      if (response.ok && session.url) {
        window.location.href = session.url; // Redirect to Stripe
      } else {
        toast({
          title: "Subscription Setup Failed",
          description: session.error || `Could not initiate ${startTrial ? 'Pro trial' : 'Pro subscription'} setup. Please try again from 'My Account'.`,
          variant: "destructive",
          duration: 7000,
        });
        router.push('/'); 
        router.refresh();
        setIsLoading(false);
      }
    } catch (error: any) {
      toast({
        title: "Network Error",
        description: `Error setting up ${startTrial ? 'Pro trial' : 'Pro subscription'}: ${error.message}. Please try again from 'My Account'.`,
        variant: "destructive",
        duration: 7000,
      });
      router.push('/'); 
      router.refresh();
      setIsLoading(false);
    }
  };

  const handleContinueFree = () => {
    setShowSubscriptionChoiceDialog(false);
    toast({
        title: "Welcome to KamperHub!",
        description: "You're all set with the free plan. Explore and enjoy!",
    });
    router.push('/');
    router.refresh();
  };


  const handleSignup: SubmitHandler<SignupFormData> = async (data) => {
    setIsLoading(true);
    setLoadingMessage('Creating Account...');
    const { email, password, username, firstName, lastName, city, state, country } = data;
    let firebaseUser: FirebaseUser | null = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: username });

      const userProfileData: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email, 
        displayName: username, 
        firstName: firstName,
        lastName: lastName,
        city: city,
        state: state,
        country: country,
        subscriptionTier: 'free', // Default to free, webhook will update if they subscribe
        stripeCustomerId: null,  
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);
      
      toast({
        title: 'Account Created Successfully!',
        description: `Welcome to KamperHub, ${username}! Please choose your next step.`,
      });
      
      setCreatedUser({ email: firebaseUser.email!, uid: firebaseUser.uid });
      setShowSubscriptionChoiceDialog(true); 
      setIsLoading(false); 

    } catch (authError: any) {
      const error = authError as AuthError;
      let toastMessage = 'An unexpected error occurred during sign up. Please try again.'; 
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            toastMessage = 'This email address is already in use by another account.';
            break;
          default:
            toastMessage = error.message || 'An unknown sign-up error occurred.';
            break;
        }
      } else if (error.message) {
        toastMessage = error.message;
      }
      toast({ title: 'Sign Up Failed', description: toastMessage, variant: 'destructive' });
      console.error("Firebase Auth Signup Error:", error); 
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
    <>
    <div className="flex justify-center items-start pt-10 min-h-screen">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UserPlus className="mr-2 h-6 w-6" /> Create Your KamperHub Account
          </CardTitle>
          <CardDescription className="font-body">
            Join KamperHub to start your adventures!
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
                  autoComplete="given-name"
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
                  autoComplete="family-name"
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
                    autoComplete="username"
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
                  autoComplete="email"
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
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="font-body pl-10"
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-body">
                Min. 8 characters. Must include uppercase, lowercase, number, and special character.
              </p>
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
                  autoComplete="new-password" 
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
                  <Input id="city" {...register("city")} placeholder="e.g., Perth" disabled={isLoading} className="font-body pl-10" autoComplete="address-level2" />
                </div>
                {errors.city && <p className="text-xs text-destructive font-body mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <Label htmlFor="state" className="font-body">State / Region*</Label>
                 <div className="relative">
                  <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="state" {...register("state")} placeholder="e.g., WA" disabled={isLoading} className="font-body pl-10" autoComplete="address-level1" />
                </div>
                {errors.state && <p className="text-xs text-destructive font-body mt-1">{errors.state.message}</p>}
              </div>
              <div>
                <Label htmlFor="country" className="font-body">Country*</Label>
                 <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="country" {...register("country")} placeholder="e.g., Australia" disabled={isLoading} className="font-body pl-10" autoComplete="country-name" />
                </div>
                {errors.country && <p className="text-xs text-destructive font-body mt-1">{errors.country.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90 mt-6" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? loadingMessage : 'Create Account'}
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

    <AlertDialog open={showSubscriptionChoiceDialog} onOpenChange={(open) => {
        if (!open && !isLoading) { // Only allow closing if not in a loading state from a Stripe redirect
            setShowSubscriptionChoiceDialog(false);
            // If dialog is closed without choosing Pro, they remain free and can be navigated or stay
            handleContinueFree(); 
        } else if (isLoading) {
            // Prevent closing dialog if loading (e.g. redirecting to stripe)
            setShowSubscriptionChoiceDialog(true);
        } else {
           setShowSubscriptionChoiceDialog(open);
        }
    }}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-xl">Unlock KamperHub Pro!</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
                Your account is created. Choose how to start your Pro experience:
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 py-2">
                 <Button 
                    onClick={() => redirectToStripeCheckout(true)} 
                    disabled={isLoading} 
                    className="font-body w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                    {isLoading && loadingMessage.startsWith("Redirecting to setup Pro trial") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {isLoading && loadingMessage.startsWith("Redirecting to setup Pro trial") ? "Processing..." : "Start 7-Day Free Pro Trial"}
                </Button>
                <p className="text-xs text-muted-foreground text-center font-body">Payment details required, auto-renews unless canceled.</p>
                
                <Button 
                    onClick={() => redirectToStripeCheckout(false)} 
                    disabled={isLoading} 
                    className="font-body w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                     {isLoading && loadingMessage.startsWith("Redirecting to subscribe") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    {isLoading && loadingMessage.startsWith("Redirecting to subscribe") ? "Processing..." : "Subscribe & Pay Now"}
                </Button>
                <p className="text-xs text-muted-foreground text-center font-body">Skip trial, full Pro access immediately.</p>
            </div>
            <AlertDialogFooter>
                 <AlertDialogCancel 
                    onClick={handleContinueFree} 
                    disabled={isLoading}
                    className="font-body mt-2 w-full sm:w-auto"
                >
                    Maybe Later (Continue Free)
                </AlertDialogCancel>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

