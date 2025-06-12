
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser, updateProfile, updateEmail, type AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import {
  MOCK_AUTH_SUBSCRIPTION_TIER_KEY,
  MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY,
  MOCK_AUTH_CITY_KEY,
  MOCK_AUTH_STATE_KEY,
  MOCK_AUTH_COUNTRY_KEY,
} from '@/types/auth';
import type { SubscriptionTier, UserProfile } from '@/types/auth';
import { useSubscription } from '@/hooks/useSubscription';
import { UserCircle, LogOut, ShieldAlert, Mail, Star, ExternalLink, MapPin, Building, Globe, Edit3, User, Loader2, CreditCard, Info } from 'lucide-react'; // Added Info
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditProfileForm, type EditProfileFormData } from '@/components/features/account/EditProfileForm';

export default function MyAccountPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  
  const { subscriptionTier, stripeCustomerId, setSubscriptionDetails } = useSubscription();
  const [profileCity, setProfileCity] = useState<string | null>(null);
  const [profileState, setProfileState] = useState<string | null>(null);
  const [profileCountry, setProfileCountry] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (user: FirebaseUser) => {
    setIsProfileLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setUserProfile(profileData);
        setProfileCity(profileData.city || null);
        setProfileState(profileData.state || null);
        setProfileCountry(profileData.country || null);
        setSubscriptionDetails(profileData.subscriptionTier || 'free', profileData.stripeCustomerId || null);

        if (profileData.city) localStorage.setItem(MOCK_AUTH_CITY_KEY, profileData.city); else localStorage.removeItem(MOCK_AUTH_CITY_KEY);
        if (profileData.state) localStorage.setItem(MOCK_AUTH_STATE_KEY, profileData.state); else localStorage.removeItem(MOCK_AUTH_STATE_KEY);
        if (profileData.country) localStorage.setItem(MOCK_AUTH_COUNTRY_KEY, profileData.country); else localStorage.removeItem(MOCK_AUTH_COUNTRY_KEY);
      } else {
        console.log("No Firestore profile document found for user:", user.uid, ". It will be created on first save.");
        const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
        const storedStripeId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
        setSubscriptionDetails(storedTier || 'free', storedStripeId);
        
        setProfileCity(localStorage.getItem(MOCK_AUTH_CITY_KEY));
        setProfileState(localStorage.getItem(MOCK_AUTH_STATE_KEY));
        setProfileCountry(localStorage.getItem(MOCK_AUTH_COUNTRY_KEY));
        setUserProfile({ email: user.email, displayName: user.displayName });
      }
    } catch (error) {
      console.error("Error fetching user profile from Firestore:", error);
      toast({ title: "Error", description: "Could not load your profile details from the server.", variant: "destructive" });
      const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
      const storedStripeId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      setSubscriptionDetails(storedTier || 'free', storedStripeId);
      setProfileCity(localStorage.getItem(MOCK_AUTH_CITY_KEY));
      setProfileState(localStorage.getItem(MOCK_AUTH_STATE_KEY));
      setProfileCountry(localStorage.getItem(MOCK_AUTH_COUNTRY_KEY));
    } finally {
      setIsProfileLoading(false);
    }
  }, [toast, setSubscriptionDetails]);

  useEffect(() => {
    setIsAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        fetchUserProfile(user);
      } else {
        setFirebaseUser(null);
        setUserProfile({});
        setProfileCity(null);
        setProfileState(null);
        setProfileCountry(null);
        setSubscriptionDetails('free', null);
        localStorage.removeItem(MOCK_AUTH_CITY_KEY);
        localStorage.removeItem(MOCK_AUTH_STATE_KEY);
        localStorage.removeItem(MOCK_AUTH_COUNTRY_KEY);
        localStorage.removeItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY);
        localStorage.removeItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserProfile, setSubscriptionDetails]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
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
    const successMessages: string[] = [];
    const errorMessages: string[] = [];
    let authUpdatesSuccessful = false;
    let firestoreUpdateSuccessful = false;

    const newDisplayName = `${data.firstName} ${data.lastName}`.trim();
    if (newDisplayName && newDisplayName !== firebaseUser.displayName) {
      try {
        await updateProfile(firebaseUser, { displayName: newDisplayName });
        setFirebaseUser(auth.currentUser);
        successMessages.push("Display Name updated.");
        authUpdatesSuccessful = true;
      } catch (error: any) {
        errorMessages.push(`Failed to update display name: ${error.message}`);
      }
    }

    if (data.email.toLowerCase() !== (firebaseUser.email?.toLowerCase() || '')) {
      try {
        await updateEmail(firebaseUser, data.email);
        setFirebaseUser(auth.currentUser);
        successMessages.push("Email updated. You may need to re-verify if changed.");
        authUpdatesSuccessful = true;
      } catch (error: any) {
        const authError = error as AuthError;
        let specificMessage = `Failed to update email: ${authError.message}`;
        if (authError.code === 'auth/requires-recent-login') {
          specificMessage = "Email update requires re-authentication. Please log out, log back in, then try again.";
        } else if (authError.code === 'auth/email-already-in-use') {
          specificMessage = "This email address is already in use by another account.";
        }
        errorMessages.push(specificMessage);
      }
    }

    const userDocRef = doc(db, "users", firebaseUser.uid);
    const firestoreProfileData: Partial<UserProfile> = {
      firstName: data.firstName,
      lastName: data.lastName,
      city: data.city,
      state: data.state,
      country: data.country,
      email: data.email,
      displayName: newDisplayName,
      updatedAt: new Date().toISOString(),
    };

    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      firestoreProfileData.createdAt = new Date().toISOString();
      firestoreProfileData.subscriptionTier = 'free';
      firestoreProfileData.stripeCustomerId = null;
    }

    try {
      await setDoc(userDocRef, firestoreProfileData, { merge: true });
      firestoreUpdateSuccessful = true;
      successMessages.push("Profile details saved to server.");
      
      setUserProfile(prev => ({...prev, ...firestoreProfileData}));
      setProfileCity(data.city);
      setProfileState(data.state);
      setProfileCountry(data.country);
      localStorage.setItem(MOCK_AUTH_CITY_KEY, data.city);
      localStorage.setItem(MOCK_AUTH_STATE_KEY, data.state);
      localStorage.setItem(MOCK_AUTH_COUNTRY_KEY, data.country);

    } catch (error: any) {
      errorMessages.push(`Failed to save profile details to server: ${error.message}`);
    }

    if (successMessages.length > 0) {
      toast({ title: "Profile Update Successful", description: successMessages.join(' ') });
    }
    if (errorMessages.length > 0) {
      toast({ title: "Profile Update Issues", description: errorMessages.join(' '), variant: "destructive", duration: 7000 });
    }
    
    const overallSuccess = authUpdatesSuccessful || firestoreUpdateSuccessful;
    if (overallSuccess && errorMessages.length === 0) { 
        setIsEditProfileOpen(false);
    }
    setIsSavingProfile(false);
    return overallSuccess && errorMessages.length === 0;
  };

  const handleUpgradeToPro = async () => {
    console.log("MyAccountPage: handleUpgradeToPro initiated.");
    if (!firebaseUser || !firebaseUser.email) {
      toast({ title: "Error", description: "You must be logged in to upgrade.", variant: "destructive" });
      console.error("MyAccountPage: Upgrade attempt failed - no Firebase user or email.");
      return;
    }
    setIsRedirectingToCheckout(true);
    console.log("MyAccountPage: Calling /api/create-checkout-session with email:", firebaseUser.email, "userId:", firebaseUser.uid);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: firebaseUser.email, userId: firebaseUser.uid }),
      });
      console.log("MyAccountPage: Response status from /api/create-checkout-session:", response.status);

      const session = await response.json();
      console.log("MyAccountPage: Session data received from backend:", session);

      if (response.ok && session.url) {
        console.log("MyAccountPage: Successfully received session URL:", session.url);
        console.log("MyAccountPage: Attempting to redirect to Stripe via window.top.location.href...");
        try {
          window.top.location.href = session.url; // Use window.top.location.href
          console.log("MyAccountPage: Redirect initiated."); 
        } catch (redirectError: any) {
          console.error("MyAccountPage: Error during window.top.location.href assignment:", redirectError.message, redirectError.stack);
          toast({ title: "Redirect Error", description: `Could not navigate to Stripe: ${redirectError.message}. Please try again or check your browser settings.`, variant: "destructive", duration: 10000 });
          setIsRedirectingToCheckout(false); 
        }
      } else {
        console.error("MyAccountPage: Failed to create Stripe session or URL missing. Backend error:", session.error);
        toast({ title: "Upgrade Error", description: session.error || "Could not initiate upgrade. Please try again.", variant: "destructive" });
        setIsRedirectingToCheckout(false);
      }
    } catch (error: any) {
      console.error("MyAccountPage: Error calling /api/create-checkout-session or processing response:", error.message, error.stack);
      toast({ title: "Upgrade Error", description: `An unexpected error occurred: ${error.message}. Please try again.`, variant: "destructive" });
      setIsRedirectingToCheckout(false);
    }
  };


  if (isAuthLoading || (!firebaseUser && !isAuthLoading)) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg font-semibold text-primary font-body">
          {isAuthLoading ? "Authenticating..." : "Please log in."}
        </p>
         {!isAuthLoading && !firebaseUser && (
            <Link href="/login" passHref className="mt-4">
                <Button>Go to Login</Button>
            </Link>
         )}
      </div>
    );
  }
  
  if (isProfileLoading) {
     return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mr-3" />
        <p className="font-body text-muted-foreground text-lg">Loading account details...</p>
      </div>
    );
  }

  const currentFirstName = userProfile.firstName || (firebaseUser?.displayName?.split(' ')[0] || '');
  const currentLastName = userProfile.lastName || (firebaseUser?.displayName?.split(' ').slice(1).join(' ') || '');
  const currentEmail = userProfile.email || firebaseUser?.email || '';

  const initialProfileDataForEdit: EditProfileFormData = {
    firstName: currentFirstName,
    lastName: currentLastName,
    email: currentEmail,
    city: profileCity || userProfile.city || '',
    state: profileState || userProfile.state || '',
    country: profileCountry || userProfile.country || '',
  };
  
  const displayUserName = firebaseUser?.displayName || userProfile.displayName || 'User';

  return (
    <div className="space-y-8">
      <Card className="max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center">
          <UserCircle className="h-20 w-20 text-primary mx-auto mb-3" />
          <CardTitle className="font-headline text-3xl text-primary">
            Welcome, {displayUserName}!
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
              Your First Name, Last Name, and Location details are now stored securely on our servers.
              Email and Display Name are managed by Firebase Authentication.
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
            
            <p className="font-body text-sm flex items-center">
                <User className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Display Name:</strong>&nbsp;{firebaseUser?.displayName || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <User className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>First Name:</strong>&nbsp;{userProfile.firstName || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <User className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Last Name:</strong>&nbsp;{userProfile.lastName || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Email:</strong>&nbsp;{firebaseUser?.email || userProfile.email || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>City:</strong>&nbsp;{profileCity || userProfile.city || '[Not Provided]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <Building className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>State / Region:</strong>&nbsp;{profileState || userProfile.state || '[Not Provided]'}
            </p>
             <p className="font-body text-sm flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Country:</strong>&nbsp;{profileCountry || userProfile.country || '[Not Provided]'}
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
            
            {subscriptionTier === 'free' && (
              <>
                <Alert variant="default" className="mt-4 mb-3">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="font-headline">Stripe Checkout Tip</AlertTitle>
                  <AlertDescription className="font-body">
                    If the payment page doesn't open correctly (e.g., blank screen),
                    your security software (like Kaspersky Safe Money, some ad blockers)
                    or browser extensions might be interfering.
                    Consider temporarily disabling them or adding an exception for this site and checkout.stripe.com.
                    Using an Incognito/Private browser window can also help diagnose this.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleUpgradeToPro}
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-body"
                  disabled={isRedirectingToCheckout}
                >
                  {isRedirectingToCheckout ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {isRedirectingToCheckout ? 'Redirecting...' : 'Upgrade to KamperHub Pro'}
                </Button>
              </>
            )}

            <p className="font-body text-sm mt-3 text-muted-foreground">
              Your subscription (including free trial cancellation or managing payment methods) is managed through Stripe.
            </p>
            <Button
                variant="outline"
                className="mt-2 font-body w-full sm:w-auto"
                onClick={() => {
                  if (stripeCustomerId) {
                    toast({title: "Conceptual Action", description: "This would redirect to Stripe Customer Portal. Backend logic for portal session needed."});
                  } else {
                    toast({title: "No Subscription Found", description: "No active Stripe subscription to manage for this account.", variant: "destructive"});
                  }
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
    

    



    