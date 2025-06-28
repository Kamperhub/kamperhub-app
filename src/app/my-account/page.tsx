
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { format, parseISO, isFuture } from 'date-fns';
import { fetchUserPreferences } from '@/lib/api-client';

import type { UserProfile } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { UserCircle, LogOut, Mail, Star, ExternalLink, MapPin, Building, Globe, Edit3, User, Loader2, CreditCard, Info, CalendarClock, UserCog, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditProfileForm, type EditProfileFormData } from '@/components/features/account/EditProfileForm';

const ADMIN_EMAIL = 'info@kamperhub.com';

export default function MyAccountPage() {
  const { user, isAuthLoading } = useAuth();
  const { setSubscriptionDetails, hasProAccess, subscriptionTier, stripeCustomerId, trialEndsAt } = useSubscription();

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);
  const [isRedirectingToPortal, setIsRedirectingToPortal] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const { data: userProfile, error: profileError, isLoading: isLoadingPrefs } = useQuery<Partial<UserProfile>>({
    queryKey: ['userPreferences', user?.uid],
    queryFn: fetchUserPreferences,
    enabled: !!user && !isAuthLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (userProfile) {
      setSubscriptionDetails(
        userProfile.subscriptionTier || 'free', 
        userProfile.stripeCustomerId || null,
        userProfile.trialEndsAt || null
      );
    }
  }, [userProfile, setSubscriptionDetails]);

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
    if (!user) {
      toast({ title: "Error", description: "No active user found.", variant: "destructive" });
      return;
    }

    setIsSavingProfile(true);

    try {
      const authPromises = [];
      if (data.displayName !== user.displayName) {
        authPromises.push(updateProfile(user, { displayName: data.displayName }));
      }
      if (data.email.toLowerCase() !== (user.email?.toLowerCase() || '')) {
        authPromises.push(updateEmail(user, data.email));
      }
      if (authPromises.length > 0) {
        await Promise.all(authPromises);
      }
      
      const userDocRef = doc(db, "users", user.uid);
      const firestoreProfileData: Partial<UserProfile> = {
        displayName: data.displayName,
        email: data.email,
        city: data.city,
        state: data.state,
        country: data.country,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, firestoreProfileData, { merge: true });

      if (auth.currentUser) await auth.currentUser.reload();
      
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
    if (!user || !user.email) {
      toast({ title: "Error", description: "You must be logged in to subscribe.", variant: "destructive" });
      return;
    }
    setIsRedirectingToCheckout(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          userId: user.uid,
          startTrial: false 
        }),
      });
      const session = await response.json();
      if (response.ok && session.url) {
        window.location.href = session.url;
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
    if (!user) {
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
        body: JSON.stringify({ userId: user.uid }), 
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
  
  const isLoading = isAuthLoading || isLoadingPrefs;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mr-3" />
        <p className="font-body text-muted-foreground text-lg">Loading Account Details...</p>
      </div>
    );
  }

  if (!user || profileError) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Account</AlertTitle>
            <AlertDescription>
                {profileError ? profileError.message : "You must be logged in to view this page."}
            </AlertDescription>
            <Button variant="secondary" onClick={() => router.push('/login')} className="mt-4">Go to Login</Button>
        </Alert>
      </div>
    );
  }

  const initialProfileDataForEdit: EditProfileFormData = {
    displayName: userProfile?.displayName || user?.displayName || '',
    email: userProfile?.email || user?.email || '',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
    country: userProfile?.country || '',
  };
  
  const displayUserName = userProfile?.displayName || user.displayName || 'User';
  const isTrialActive = subscriptionTier === 'trialing' && trialEndsAt && isFuture(parseISO(trialEndsAt));
  const hasTrialExpired = subscriptionTier === 'trial_expired' || (subscriptionTier === 'trialing' && trialEndsAt && !isFuture(parseISO(trialEndsAt)));
  const isAdminUser = user?.email === ADMIN_EMAIL;

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
                <strong>Display Name:</strong>&nbsp;{userProfile?.displayName || user.displayName || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Email:</strong>&nbsp;{userProfile?.email || user.email || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>City:</strong>&nbsp;{userProfile?.city || '[Not Provided]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <Building className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>State / Region:</strong>&nbsp;{userProfile?.state || '[Not Provided]'}
            </p>
             <p className="font-body text-sm flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Country:</strong>&nbsp;{userProfile?.country || '[Not Provided]'}
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
                 <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="font-headline">Stripe Security & Pop-up Blockers</AlertTitle>
                  <AlertDescription className="font-body text-sm">
                    If the Stripe payment page doesn't open or appears blank, please temporarily disable browser extensions (like ad blockers or privacy tools) or security software that might be interfering. Using an Incognito/Private window can also help.
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
