
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser, updateProfile, updateEmail, type AuthError } from 'firebase/auth';
import {
  MOCK_AUTH_SUBSCRIPTION_TIER_KEY,
  MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY,
  MOCK_AUTH_CITY_KEY,
  MOCK_AUTH_STATE_KEY,
  MOCK_AUTH_COUNTRY_KEY,
  // MOCK_AUTH_USER_REGISTRY_KEY, // No longer needed for profile updates here
} from '@/types/auth';
import type { SubscriptionTier } from '@/types/auth'; // Removed MockUserRegistryEntry
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
        try {
            const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
            const storedStripeId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
            setSubscriptionTier(storedTier || 'free');
            setStripeCustomerId(storedStripeId);

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
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      localStorage.removeItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY);
      localStorage.removeItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      localStorage.removeItem(MOCK_AUTH_CITY_KEY);
      localStorage.removeItem(MOCK_AUTH_STATE_KEY);
      localStorage.removeItem(MOCK_AUTH_COUNTRY_KEY);
      router.push('/');
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
    let overallSuccess = false;
    const successMessages: string[] = [];
    const errorMessages: string[] = [];

    // Update Display Name in Firebase Auth
    const newDisplayName = `${data.firstName} ${data.lastName}`.trim();
    if (newDisplayName && newDisplayName !== firebaseUser.displayName) {
      try {
        await updateProfile(firebaseUser, { displayName: newDisplayName });
        // Note: firebaseUser state will update via onAuthStateChanged, may not be immediate here.
        // For immediate reflection, we'd manually update a local copy, but onAuthStateChanged is cleaner.
        successMessages.push("Display Name updated in Firebase.");
        overallSuccess = true;
      } catch (error: any) {
        console.error("Error updating display name:", error);
        errorMessages.push(`Failed to update display name: ${error.message}`);
      }
    }

    // Update Email in Firebase Auth
    if (data.email.toLowerCase() !== firebaseUser.email?.toLowerCase()) {
      try {
        await updateEmail(firebaseUser, data.email);
        successMessages.push("Email updated in Firebase.");
        overallSuccess = true;
      } catch (error: any) {
        const authError = error as AuthError;
        console.error("Error updating email:", authError);
        let specificMessage = `Failed to update email: ${authError.message}`;
        if (authError.code === 'auth/requires-recent-login') {
          specificMessage = "Email update requires re-authentication. Please log out and log back in, then try again.";
        } else if (authError.code === 'auth/email-already-in-use') {
          specificMessage = "This email address is already in use by another account.";
        }
        errorMessages.push(specificMessage);
      }
    }

    // Update localStorage for City, State, Country (mock/local part)
    try {
      localStorage.setItem(MOCK_AUTH_CITY_KEY, data.city);
      localStorage.setItem(MOCK_AUTH_STATE_KEY, data.state);
      localStorage.setItem(MOCK_AUTH_COUNTRY_KEY, data.country);
      setProfileCity(data.city); // Update local state for immediate UI reflection
      setProfileState(data.state);
      setProfileCountry(data.country);
      if (data.city || data.state || data.country) { // Only add message if location details were provided
          successMessages.push("Location details saved locally.");
      }
      overallSuccess = true; // Consider local save a success for UI purposes
    } catch (error) {
        console.error("Error saving location to localStorage:", error);
        errorMessages.push("Failed to save location details locally.");
    }

    if (successMessages.length > 0) {
      toast({ title: "Profile Update", description: successMessages.join(' ') });
    }
    if (errorMessages.length > 0) {
      toast({ title: "Profile Update Issues", description: errorMessages.join(' '), variant: "destructive", duration: 7000 });
    }
    
    if (overallSuccess) { // Close dialog if any part of the update was considered a success
        setIsEditProfileOpen(false);
    }
    setIsSavingProfile(false);
    return overallSuccess; // Return true if at least local save or one Firebase update occurred
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p className="font-body text-muted-foreground">Loading account details...</p>
      </div>
    );
  }

  if (!firebaseUser && !isLoading) {
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

  const nameParts = firebaseUser?.displayName ? firebaseUser.displayName.split(' ') : [];
  const currentFirstName = nameParts[0] || '';
  const currentLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const initialProfileDataForEdit = {
    firstName: currentFirstName,
    lastName: currentLastName,
    email: firebaseUser?.email || '',
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
            <AlertTitle className="font-headline text-yellow-700">Profile Management</AlertTitle>
            <AlertDescription className="font-body">
              Your Display Name and Email are updated with Firebase Authentication.
              Location details (City, State, Country) are saved locally for now and will use Firestore in a future update.
            </AlertDescription>
          </Alert>

          <div className="p-4 border rounded-md bg-muted/30 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-headline text-foreground">Account Details:</h3>
              <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="font-body">
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline">Edit Your Profile</DialogTitle>
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

    