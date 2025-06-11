
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import {
  MOCK_AUTH_SUBSCRIPTION_TIER_KEY, // Kept for subscription
  MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY, // Kept for subscription
  MOCK_AUTH_CITY_KEY, // For profile form initial data if not in Firestore yet
  MOCK_AUTH_STATE_KEY,
  MOCK_AUTH_COUNTRY_KEY,
  MOCK_AUTH_USER_REGISTRY_KEY, // For profile edit, to be replaced by Firestore
} from '@/types/auth';
import type { SubscriptionTier, MockUserRegistryEntry } from '@/types/auth';
import { UserCircle, LogOut, ShieldAlert, Mail, Star, ExternalLink, MapPin, Building, Globe, Edit3, User } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditProfileForm, type EditProfileFormData } from '@/components/features/account/EditProfileForm';

export default function MyAccountPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Subscription and mock profile details still from localStorage for now
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [profileState, setProfileState] = useState<string | null>(null);
  const [profileCountry, setProfileCountry] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        // Load other details for this user if they exist (from localStorage for now)
        // This part will eventually move to Firestore
        try {
            const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
            const storedStripeId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
            setSubscriptionTier(storedTier || 'free');
            setStripeCustomerId(storedStripeId);

            // For profile form - these will be replaced by Firestore later
            setProfileCity(localStorage.getItem(MOCK_AUTH_CITY_KEY));
            setProfileState(localStorage.getItem(MOCK_AUTH_STATE_KEY));
            setProfileCountry(localStorage.getItem(MOCK_AUTH_COUNTRY_KEY));

        } catch (e) {
            console.error("Error loading user-specific details from localStorage", e);
        }

      } else {
        setFirebaseUser(null);
        setSubscriptionTier('free');
        setStripeCustomerId(null);
        setProfileCity(null);
        setProfileState(null);
        setProfileCountry(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);


  const handleLogout = async () => {
    try {
      await auth.signOut();
      // onAuthStateChanged will handle setting firebaseUser to null and isLoading to false
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      // No need to clear MOCK_AUTH_LOGGED_IN_KEY here, Firebase state is king.
      // Clearing subscription tier for demo purposes on explicit logout.
      localStorage.removeItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY);
      localStorage.removeItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      // For now, also clear profile details from localStorage for this demo
      localStorage.removeItem(MOCK_AUTH_CITY_KEY);
      localStorage.removeItem(MOCK_AUTH_STATE_KEY);
      localStorage.removeItem(MOCK_AUTH_COUNTRY_KEY);
      // Note: MOCK_AUTH_USER_REGISTRY_KEY is not cleared on logout, only on signup/edit.

      router.push('/'); // Redirect to home after logout
      // router.refresh(); // Potentially redundant
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: 'Logout Error', description: 'Failed to log out.', variant: 'destructive' });
    }
  };

  const handleSaveProfile = async (data: EditProfileFormData): Promise<boolean> => {
    if (!firebaseUser) {
      toast({ title: "Error", description: "No active user found.", variant: "destructive" });
      return false;
    }
    setIsSavingProfile(true);

    // TODO: Integrate Firebase updateProfile for displayName and email.
    // TODO: Integrate Firestore for city, state, country.
    // For now, this updates the old mock registry for demonstration.
    try {
      const storedRegistryJson = localStorage.getItem(MOCK_AUTH_USER_REGISTRY_KEY);
      let userRegistry: MockUserRegistryEntry[] = storedRegistryJson ? JSON.parse(storedRegistryJson) : [];
      
      let emailChanged = data.email.toLowerCase() !== (firebaseUser.email?.toLowerCase() || '');
      let newEmailIsAvailable = true;

      if (emailChanged) {
        const emailExists = userRegistry.some(
          user => user.email.toLowerCase() === data.email.toLowerCase() && user.username.toLowerCase() !== firebaseUser.displayName!.toLowerCase() // Assuming displayName is username for mock
        );
        if (emailExists) {
          newEmailIsAvailable = false;
          toast({ title: 'Update Failed', description: 'This Email address is already registered by another user.', variant: 'destructive' });
        }
      }
      
      if (!newEmailIsAvailable) {
        setIsSavingProfile(false);
        return false;
      }

      // Mock update logic using displayName as username key
      userRegistry = userRegistry.map(user => {
        if (user.username.toLowerCase() === firebaseUser.displayName?.toLowerCase()) { // Assuming displayName is username
          return {
            ...user,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            city: data.city,
            state: data.state,
            country: data.country,
          };
        }
        return user;
      });
      localStorage.setItem(MOCK_AUTH_USER_REGISTRY_KEY, JSON.stringify(userRegistry));

      // Update localStorage for immediate reflection (will be replaced by Firestore reads)
      localStorage.setItem(MOCK_AUTH_CITY_KEY, data.city);
      localStorage.setItem(MOCK_AUTH_STATE_KEY, data.state);
      localStorage.setItem(MOCK_AUTH_COUNTRY_KEY, data.country);
      
      // Update local state for immediate UI update
      setProfileCity(data.city);
      setProfileState(data.state);
      setProfileCountry(data.country);
      
      // Note: Firebase displayName and email are not updated here yet.
      // Need to call firebaseUser.updateProfile() and firebaseUser.updateEmail()
      // This will be part of a future refactor.
      // For now, display name changes from this form won't reflect in firebaseUser.displayName

      toast({ title: "Profile Updated (Mock)", description: "Your account details have been saved to local storage." });
      setIsEditProfileOpen(false);
      setIsSavingProfile(false);
      return true;

    } catch (error) {
      console.error("Error saving profile (mock):", error);
      toast({ title: "Error", description: "Could not save profile changes.", variant: "destructive" });
      setIsSavingProfile(false);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="font-body text-muted-foreground">Loading account details...</p>
      </div>
    );
  }

  if (!firebaseUser && !isLoading) { // Check !firebaseUser directly
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <UserCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-headline text-primary mb-2">My Account</h1>
          <p className="text-muted-foreground font-body mb-6">
            You are not currently signed in.
          </p>
          <Link href="/login" passHref>
            <Button className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90">
              Log In / Sign Up
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // This part is rendered only if firebaseUser is available
  const nameParts = firebaseUser?.displayName ? firebaseUser.displayName.split(' ') : [];
  const currentFirstName = nameParts[0] || '';
  const currentLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const initialProfileDataForEdit = {
    // Use currentFirstName/LastName for the form, as these reflect what's in Firebase Auth displayName
    // If these are empty, it means displayName wasn't set well, but form can still take input.
    firstName: currentFirstName,
    lastName: currentLastName,
    email: firebaseUser?.email || '',
    // Location details still from localStorage for this mock version
    city: profileCity || '',
    state: profileState || '',
    country: profileCountry || '',
  };


  return (
    <div className="space-y-8">
      <Card className="max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center">
          <UserCircle className="h-20 w-20 text-primary mx-auto mb-3" />
          <CardTitle className="font-headline text-3xl text-primary">
            Welcome, {firebaseUser?.displayName || firebaseUser?.email || 'User'}!
          </CardTitle>
          <CardDescription className="font-body text-lg">
            Manage your account details and subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
            <ShieldAlert className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="font-headline text-yellow-700">Authentication Update</AlertTitle>
            <AlertDescription className="font-body">
              Account management now uses Firebase. Profile editing (Display Name, Email) will soon update Firebase directly. Other details (City, State, Country) will use Firestore.
            </AlertDescription>
          </Alert>

          <div className="p-4 border rounded-md bg-muted/30 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-headline text-foreground">Account Details:</h3>
              <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="font-body">
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Mock)
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">Edit Your Profile (Mock)</DialogTitle>
                  </DialogHeader>
                  <EditProfileForm
                    initialData={initialProfileDataForEdit}
                    onSave={handleSaveProfile}
                    onCancel={() => setIsEditProfileOpen(false)}
                    isLoading={isSavingProfile}
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            {firebaseUser?.displayName && (
              <p className="font-body text-sm flex items-center">
                  <User className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                  <strong>Display Name:</strong>&nbsp;{firebaseUser.displayName}
              </p>
            )}
             {!firebaseUser?.displayName && firebaseUser?.email && (
                <p className="font-body text-sm flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                    <strong>Display Name:</strong>&nbsp;[Not Set]
                </p>
            )}
            {firebaseUser?.email && (
              <p className="font-body text-sm flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                  <strong>Email:</strong>&nbsp;{firebaseUser.email}
              </p>
            )}
            <p className="font-body text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>City:</strong>&nbsp;{profileCity || '[Not Provided]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <Building className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>State / Region:</strong>&nbsp;{profileState || '[Not Provided]'}
            </p>
             <p className="font-body text-sm flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Country:</strong>&nbsp;{profileCountry || '[Not Provided]'}
            </p>
          </div>

          <div className="p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-headline text-foreground mb-2">Subscription Status:</h3>
            <div className="font-body text-sm flex items-center">
              <Star className={`h-4 w-4 mr-2 ${subscriptionTier === 'pro' ? 'text-yellow-500 fill-yellow-400' : 'text-primary/80'}`} />
              <strong>Current Tier:</strong>&nbsp;
              <Badge variant={subscriptionTier === 'pro' ? 'default' : 'secondary'} className={subscriptionTier === 'pro' ? 'bg-yellow-500 text-white' : ''}>
                {subscriptionTier?.toUpperCase() || 'N/A'}
              </Badge>
            </div>
            {stripeCustomerId && (
               <p className="font-body text-xs mt-1 text-muted-foreground">Stripe Customer ID: {stripeCustomerId}</p>
            )}
            <p className="font-body text-sm mt-3 text-muted-foreground">
              Your subscription (including free trial cancellation or managing payment methods) is managed through Stripe.
            </p>
            <Button
                variant="outline"
                className="mt-2 font-body w-full sm:w-auto"
                onClick={() => {
                  toast({title: "Conceptual Action", description: "This would redirect to Stripe Customer Portal."});
                }}
            >
              Manage Subscription in Stripe <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
             <p className="text-xs text-muted-foreground mt-2 font-body">
                Note: If you started with a free trial, it will automatically convert to a paid Pro subscription unless canceled via Stripe before the trial ends.
             </p>
          </div>

          <Button onClick={handleLogout} variant="destructive" className="w-full font-body">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
