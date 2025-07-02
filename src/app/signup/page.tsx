
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; 
import { createUserWithEmailAndPassword, updateProfile, type User as FirebaseUser, type AuthError, deleteUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { UserPlus, Mail, User, KeyRound, MapPin, Building, Globe, Loader2, CheckSquare } from 'lucide-react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfile } from '@/types/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { NavigationContext } from '@/components/layout/AppShell';

const ADMIN_EMAIL = 'info@kamperhub.com';

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
  agreeToTerms: z.boolean().refine(value => value === true, {
    message: "You must agree to the Terms of Service and Privacy Policy to create an account.",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors }, control } = useForm<SignupFormData>({
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
      agreeToTerms: false,
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthLoading } = useAuth();
  const navContext = useContext(NavigationContext);

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push('/');
    }
  }, [user, isAuthLoading, router]);

  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  const handleSignup: SubmitHandler<SignupFormData> = async (data) => {
    setIsLoading(true);
    const { email, password, username, firstName, lastName, city, state, country } = data;
    let newFirebaseUser: FirebaseUser | null = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      newFirebaseUser = userCredential.user;
      
      await updateProfile(newFirebaseUser, { displayName: username });
      
      const isAdmin = newFirebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      const userProfileData: UserProfile = {
        uid: newFirebaseUser.uid,
        email: newFirebaseUser.email, 
        displayName: username, 
        firstName: firstName,
        lastName: lastName,
        city: city,
        state: state,
        country: country,
        subscriptionTier: isAdmin ? 'pro' : 'trialing',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isAdmin: isAdmin,
        trialEndsAt: isAdmin ? null : trialEndDate.toISOString(),
      };

      await setDoc(doc(db, "users", newFirebaseUser.uid), userProfileData);
      
      toast({
        title: isAdmin ? 'Admin Account Created!' : 'Account Created & Trial Started!',
        description: isAdmin ? `Welcome, Admin! Your account is set up with Pro access.` : `Welcome, ${username}! You now have a 7-day free trial of KamperHub Pro features.`,
        duration: 7000,
      });
      
      router.push('/'); 
    } catch (error: any) {
      let toastMessage = 'An unexpected error occurred. Please try again.';
      const authError = error as AuthError;

      if (authError.code) {
        switch (authError.code) {
          case 'auth/email-already-in-use':
            toastMessage = 'This email address is already in use by another account.';
            newFirebaseUser = null; 
            break;
          default:
            toastMessage = `An error occurred during signup: ${authError.message}`;
            break;
        }
      } else {
        toastMessage = `Could not save your profile to the database. This might be due to a network issue or database permissions. Error: ${error.message}`;
      }

      if (newFirebaseUser) {
        await deleteUser(newFirebaseUser).catch(deleteError => {
          console.error("Failed to delete orphaned user during signup rollback:", deleteError);
          toastMessage += " Failed to clean up temporary user. Please contact support if you cannot sign up.";
        });
      }

      toast({
        title: 'Sign Up Failed',
        description: toastMessage,
        variant: 'destructive',
        duration: 9000,
      });

    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || user) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
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
            Join KamperHub to start your adventures! All new accounts get a 7-day free trial of Pro features.
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
            
            <div className="pt-2">
              <div className="flex items-start space-x-2">
                <Controller
                  name="agreeToTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="agreeToTerms"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="mt-0.5 flex-shrink-0" 
                    />
                  )}
                />
                <Label htmlFor="agreeToTerms" className="font-body text-sm leading-normal data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70">
                  I have read and agree to the KamperHub{' '}
                  <Link href="/learn?tab=tos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Terms of Service and Privacy Policy
                  </Link>
                  *. I understand that this app is a guide and should not be solely relied upon.
                </Label>
              </div>
              {errors.agreeToTerms && <p className="text-xs text-destructive font-body mt-1 pl-7">{errors.agreeToTerms.message}</p>}
            </div>


            <Button type="submit" className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90 mt-6" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating Account & Starting Trial...' : 'Create Account & Start Free Trial'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-4 font-body">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline" onClick={handleNavigation}>
              Log In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
