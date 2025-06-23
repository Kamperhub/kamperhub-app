
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser, updateProfile, updateEmail, type AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { format, parseISO, isFuture } from 'date-fns';

import {
  MOCK_AUTH_CITY_KEY,
  MOCK_AUTH_STATE_KEY,
  MOCK_AUTH_COUNTRY_KEY,
} from '@/types/auth';
import type { SubscriptionTier, UserProfile } from '@/types/auth';
import { useSubscription } from '@/hooks/useSubscription';
import { UserCircle, LogOut, ShieldAlert, Mail, Star, ExternalLink, MapPin, Building, Globe, Edit3, User, Loader2, CreditCard, Info, CalendarClock, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditProfileForm, type EditProfileFormData } from '@/components/features/account/EditProfileForm';

const ADMIN_EMAIL = 'info@kamperhub.com'; // Define admin email

export default function MyAccountPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [isRedirectingToPortal, setIsRedirectingToPortal] = useState(false);
  
  const { subscriptionTier, stripeCustomerId, trialEndsAt, setSubscriptionDetails, hasProAccess } = useSubscription();
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
        setSubscriptionDetails(
          profileData.subscriptionTier || 'free', 
          profileData.stripeCustomerId || null,
          profileData.trialEndsAt || null
        );

        if (profileData.city) localStorage.setItem(MOCK_AUTH_CITY_KEY, profileData.city); else localStorage.removeItem(MOCK_AUTH_CITY_KEY);
        if (profileData.state) localStorage.setItem(MOCK_AUTH_STATE_KEY, profileData.state); else localStorage.removeItem(MOCK_AUTH_STATE_KEY);
        if (profileData.country) localStorage.setItem(MOCK_AUTH_COUNTRY_KEY, profileData.country); else localStorage.removeItem(MOCK_AUTH_COUNTRY_KEY);
      } else {
        console.log("No Firestore profile document found for user:", user.uid, ". It will be created on first save or if a trial was just initiated.");
        setUserProfile({ email: user.email, displayName: user.displayName });
      }
    } catch (error: any) {
      console.error("Error fetching user profile from Firestore:", error);
      const errorMessage = error.code ? `${error.code}: ${error.message}` : error.message;
      toast({ 
        title: "Error Loading Profile", 
        description: `Details: ${errorMessage}`,
        variant: "destructive",
        duration: 9000
      });
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
        setSubscriptionDetails('free', null, null); 
        localStorage.removeItem(MOCK_AUTH_CITY_KEY);
        localStorage.removeItem(MOCK_AUTH_STATE_KEY);
        localStorage.removeItem(MOCK_AUTH_COUNTRY_KEY);
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

  const handleSubscribeToPro = async () => {
    if (!firebaseUser || !firebaseUser.email) {
      toast({ title: "Error", description: "You must be logged in to subscribe.", variant: "destructive" });
      return;
    }
    setIsRedirectingToCheckout(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: firebaseUser.email, 
          userId: firebaseUser.uid,
          startTrial: false 
        }),
      });
      const session = await response.json();
      if (response.ok && session.url) {
        const newWindow = window.open(session.url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
           toast({ 
            title: "Stripe Page Ready", 
            description: "Attempting to open Stripe Checkout. If it doesn't appear automatically, please check if your browser blocked a popup or look for a new tab/window.", 
            variant: "default", 
            duration: 10000 
          });
        }
      } else {
        toast({ title: "Subscription Error", description: session.error || "Could not initiate subscription. Please try again.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Subscription Error", description: `An unexpected error occurred: ${error.message}. Please try again.`, variant: "destructive" });
    } finally {
      setIsRedirectingToCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!firebaseUser) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!stripeCustomerId) {
        toast({ title: "No Subscription Found", description: "No active Stripe subscription to manage for this account.", variant: "destructive"});
        return;
    }
    setIsRedirectingToPortal(true);
    try {
      const response = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: firebaseUser.uid }), 
      });
      const sessionData = await response.json();
      if (response.ok && sessionData.url) {
        window.location.href = sessionData.url;
      } else {
        toast({ title: "Error", description: sessionData.error || "Could not open customer portal.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: `An unexpected error occurred: ${error.message}`, variant: "destructive" });
    } finally {
      setIsRedirectingToPortal(false);
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

  const initialProfileDataForEdit: EditProfileFormData = {
    firstName: userProfile.firstName || (firebaseUser?.displayName?.split(' ')[0] || ''),
    lastName: userProfile.lastName || (firebaseUser?.displayName?.split(' ').slice(1).join(' ') || ''),
    email: userProfile.email || firebaseUser?.email || '',
    city: profileCity || userProfile.city || '',
    state: profileState || userProfile.state || '',
    country: profileCountry || userProfile.country || '',
  };
  
  const displayUserName = firebaseUser?.displayName || userProfile.displayName || 'User';
  const isTrialActive = subscriptionTier === 'trialing' && trialEndsAt && isFuture(parseISO(trialEndsAt));
  const hasTrialExpired = subscriptionTier === 'trialing' && trialEndsAt && !isFuture(parseISO(trialEndsAt));
  const isAdminUser = firebaseUser?.email === ADMIN_EMAIL;

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
                <strong>Display Name:</strong>&nbsp;{firebaseUser?.displayName || userProfile.displayName || '[Not Set]'}
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
            <div className="font-body text-sm flex items-center mb-2">
              <Star className={`h-4 w-4 mr-2 ${hasProAccess ? 'text-yellow-500 fill-yellow-400' : 'text-primary/80'}`} />
              <strong>Current Access:</strong>&nbsp;
              <Badge variant={hasProAccess ? 'default' : 'secondary'} className={hasProAccess ? 'bg-yellow-500 text-white' : ''}>
                {hasProAccess ? 'PRO ACCESS' : 'FREE TIER'}
              </Badge>
            </div>

            {isTrialActive && trialEndsAt && (
              <Alert variant="default" className="mb-3 bg-blue-50 border-blue-300">
                <CalendarClock className="h-4 w-4 text-blue-600" />
                <AlertTitle className="font-headline text-blue-700">Pro Trial Active!</AlertTitle>
                <AlertDescription className="font-body text-blue-600">
                  Your 7-day Pro trial ends on: {format(parseISO(trialEndsAt), "PPP")}.
                  Subscribe now to keep Pro features after your trial.
                </AlertDescription>
              </Alert>
            )}

            {hasTrialExpired && subscriptionTier !== 'pro' && (
              <Alert variant="destructive" className="mb-3">
                <CalendarClock className="h-4 w-4" />
                <AlertTitle className="font-headline">Pro Trial Expired</AlertTitle>
                <AlertDescription className="font-body">
                  Your Pro trial has ended. Subscribe to regain access to Pro features.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Manage Subscription Button - visible if stripeCustomerId exists */}
            {stripeCustomerId && (
              <div className="mt-3">
                <p className="font-body text-sm text-muted-foreground">
                  Manage your payment methods, view invoices, or update/cancel your subscription.
                </p>
                <Button
                    variant="outline"
                    className="mt-2 font-body w-full sm:w-auto"
                    onClick={handleManageSubscription}
                    disabled={isRedirectingToPortal}
                >
                  {isRedirectingToPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Manage Subscription in Stripe
                </Button>
              </div>
            )}
            
            {/* Subscribe to Pro Button - show if not currently 'pro' */}
            {subscriptionTier !== 'pro' && ( 
              <div className="mt-4"> {/* Added mt-4 for spacing if both buttons show */}
                <Alert variant="default" className="mb-3">
                  <Info className="h-4 w-4" />
                  <AlertTitle className="font-headline">Stripe Checkout & Security Tip</AlertTitle>
                  <AlertDescription className="font-body text-sm">
                    If the Stripe payment page doesn't open correctly (e.g., blank screen), if CAPTCHA challenges (like hCaptcha) are not working, or if you encounter unexpected errors submitting payment:
                    <ul className="list-disc pl-5 mt-1 space-y-0.5">
                      <li>Aggressive security software (e.g., Kaspersky Safe Money, other antivirus web protection features) or browser extensions (ad blockers, privacy tools) might be interfering.</li>
                      <li>Consider adding an exception for <code>checkout.stripe.com</code> and <code>js.stripe.com</code> in your security software/extensions.</li>
                      <li>Alternatively, temporarily disabling such tools for the payment process can help diagnose the issue.</li>
                      <li>Using an Incognito/Private browser window (which often disables extensions) is a good troubleshooting step.</li>
                      <li>Ensure your browser allows pop-ups from Stripe for any authentication steps.</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleSubscribeToPro}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-body"
                  disabled={isRedirectingToCheckout}
                >
                  {isRedirectingToCheckout ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {isRedirectingToCheckout ? 'Processing...' : (isTrialActive ? 'Subscribe to Pro Now' : 'Upgrade to KamperHub Pro')}
                </Button>
                 <p className="text-xs text-muted-foreground mt-2 font-body">
                    {isTrialActive ? 'This will end your trial and start your paid Pro subscription immediately.' : 'This will start your paid Pro subscription.'}
                 </p>
              </div>
            )}
            
            {stripeCustomerId && subscriptionTier === 'pro' && (
               <p className="font-body text-xs mt-1 text-muted-foreground">Stripe Customer ID: {stripeCustomerId}</p>
            )}
          </div>

          {isAdminUser && (
            <Link href="/admin" passHref>
              <Button variant="secondary" className="w-full font-body mt-2 mb-2">
                <UserCog className="mr-2 h-4 w-4" /> Admin Only - Manage Users
              </Button>
            </Link>
          )}

          <Button onClick={handleLogout} variant="destructive" className="w-full font-body">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
