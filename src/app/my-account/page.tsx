
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser, updateProfile, updateEmail, type AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { format, parseISO, isFuture } from 'date-fns';

import type { SubscriptionTier, UserProfile } from '@/types/auth';
import { useSubscription } from '@/hooks/useSubscription';
import { UserCircle, LogOut, Mail, Star, ExternalLink, MapPin, Building, Globe, Edit3, User, Loader2, CreditCard, Info, CalendarClock, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditProfileForm, type EditProfileFormData } from '@/components/features/account/EditProfileForm';

const ADMIN_EMAIL = 'info@kamperhub.com';

export default function MyAccountPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true); // Single loading state
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [isRedirectingToPortal, setIsRedirectingToPortal] = useState(false);
  
  const { subscriptionTier, stripeCustomerId, trialEndsAt, setSubscriptionDetails, hasProAccess } = useSubscription();
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This is the single source of truth for auth state changes.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          const userDocRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            setUserProfile(profileData);
            setSubscriptionDetails(
              profileData.subscriptionTier || 'free', 
              profileData.stripeCustomerId || null,
              profileData.trialEndsAt || null
            );
          } else {
            console.warn("No Firestore profile document found for user:", user.uid);
            setUserProfile({ email: user.email, displayName: user.displayName });
            setSubscriptionDetails('free', null, null); 
          }
        } catch (error: any) {
          console.error("Error fetching user profile from Firestore:", error);
          toast({ 
            title: "Error Loading Profile", 
            description: `Could not load your profile data. Please try refreshing.`,
            variant: "destructive",
          });
        } finally {
          // Only stop loading once auth is checked AND profile is fetched.
          setIsLoading(false); 
        }
      } else {
        // No user is logged in.
        router.push('/login');
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


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

  const handleSaveProfile = async (data: EditProfileFormData) => {
    if (!firebaseUser) {
      toast({ title: "Error", description: "No active user found.", variant: "destructive" });
      return;
    }

    setIsSavingProfile(true);

    try {
      const authPromises = [];
      if (data.displayName !== firebaseUser.displayName) {
        authPromises.push(updateProfile(firebaseUser, { displayName: data.displayName }));
      }
      if (data.email.toLowerCase() !== (firebaseUser.email?.toLowerCase() || '')) {
        authPromises.push(updateEmail(firebaseUser, data.email));
      }
      if (authPromises.length > 0) {
        await Promise.all(authPromises);
      }
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const firestoreProfileData: Partial<UserProfile> = {
        displayName: data.displayName,
        email: data.email,
        city: data.city,
        state: data.state,
        country: data.country,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, firestoreProfileData, { merge: true });

      const updatedUserDoc = await getDoc(userDocRef);
      if(updatedUserDoc.exists()){
          setUserProfile(updatedUserDoc.data());
      }
      setFirebaseUser(auth.currentUser);

      toast({
        title: "Profile Updated",
        description: "Your account details have been successfully saved.",
      });
      setIsEditProfileOpen(false);

    } catch (error: any) {
      let errorMessage = "An unexpected error occurred while saving your profile.";
      if (error.code) {
         switch (error.code) {
          case 'auth/requires-recent-login':
            errorMessage = "This change requires you to have logged in recently. Please log out and log back in to update your email or display name.";
            break;
          case 'auth/email-already-in-use':
            errorMessage = "This email address is already in use by another account.";
            break;
          default:
            errorMessage = error.message;
            break;
        }
      }
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setIsSavingProfile(false);
    }
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
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mr-3" />
        <p className="font-body text-muted-foreground text-lg">Authenticating...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    // This case should ideally not be reached due to the redirect in useEffect,
    // but it's good practice as a fallback.
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  const initialProfileDataForEdit: EditProfileFormData = {
    displayName: firebaseUser?.displayName || userProfile.displayName || '',
    email: userProfile.email || firebaseUser?.email || '',
    city: userProfile.city || '',
    state: userProfile.state || '',
    country: userProfile.country || '',
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
                <Mail className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Email:</strong>&nbsp;{firebaseUser?.email || userProfile.email || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>City:</strong>&nbsp;{userProfile.city || '[Not Provided]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <Building className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>State / Region:</strong>&nbsp;{userProfile.state || '[Not Provided]'}
            </p>
             <p className="font-body text-sm flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Country:</strong>&nbsp;{userProfile.country || '[Not Provided]'}
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
            
            {subscriptionTier !== 'pro' && ( 
              <div className="mt-4">
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
