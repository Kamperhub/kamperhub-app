
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { updateProfile, updateEmail } from 'firebase/auth';
import { updateUserPreferences, generateGoogleAuthUrl, disconnectGoogleAccount } from '@/lib/api-client';
import { format, isAfter, parseISO } from 'date-fns';

import type { UserProfile } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { UserCircle, LogOut, Mail, Star, ExternalLink, MapPin, Building, Globe, Edit3, User, Loader2, CreditCard, Info, UserCog, AlertTriangle, RotateCw, Clock, Sparkles, Link as LinkIcon, Check, Trash2, Home } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditProfileForm, type EditProfileFormData } from '@/components/features/account/EditProfileForm';
import { NavigationContext } from '@/components/layout/AppShell';

const ADMIN_EMAIL = 'info@kamperhub.com';

export default function MyAccountPage() {
  const { user, userProfile } = useAuth();
  const { hasProAccess, subscriptionTier, stripeCustomerId, isTrialActive, trialEndsAt } = useSubscription();
  const queryClient = useQueryClient();
  const navContext = useContext(NavigationContext);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRedirectingToPortal, setIsRedirectingToPortal] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

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
  
  const disconnectGoogleMutation = useMutation({
    mutationFn: disconnectGoogleAccount,
    onSuccess: (data) => {
      toast({
        title: "Google Account Disconnected",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDisconnectingGoogle(false);
    }
  });
  
  const handleDisconnectGoogle = async () => {
    if (!user) return;
    if (window.confirm("Are you sure you want to disconnect your Google Account? KamperHub will no longer be able to access your Google Tasks.")) {
        setIsDisconnectingGoogle(true);
        disconnectGoogleMutation.mutate();
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
      
      await Promise.all(authPromises);
      
      await updateUserPreferences({
        displayName: data.displayName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        city: data.city,
        state: data.state,
        country: data.country,
        homeAddress: data.homeAddress,
      });

      if (auth.currentUser) await auth.currentUser.reload();
      
      toast({
        title: "Profile Updated",
        description: "Your account details have been successfully saved.",
      });
      setIsEditProfileOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });

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
  
  const handleSubscribeToPro = () => {
    if (!user) {
      toast({ title: "Not logged in", description: "You must be logged in to subscribe.", variant: "destructive" });
      return;
    }
    
    const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
    if (!paymentLink || !paymentLink.startsWith('https://buy.stripe.com/')) {
      toast({
        title: 'Configuration Missing or Invalid',
        description: 'The Stripe Payment Link is not correctly configured in .env.local. It must be a full URL starting with "https://buy.stripe.com/...".',
        variant: 'destructive',
        duration: 8000,
      });
      return;
    }

    // Append the user's ID as client_reference_id to link the Stripe session to the Firebase user
    const finalPaymentLink = `${paymentLink}?client_reference_id=${user.uid}`;

    const stripeWindow = window.open(finalPaymentLink, '_blank');
    
    if (!stripeWindow) {
      toast({
        title: 'Pop-up Blocker Active?',
        description: "The Stripe checkout page may have been blocked. Please check your browser's pop-up blocker settings and try again.",
        variant: 'destructive',
        duration: 9000,
      });
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
      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` 
        },
        body: JSON.stringify({}),
      });
      const sessionData = await response.json();
      if (response.ok && sessionData.url) {
        window.top.location.href = sessionData.url;
      } else {
        toast({ title: "Error", description: sessionData.error || "Could not open customer portal.", variant: "destructive" });
        setIsRedirectingToPortal(false);
      }
    } catch (error: any) {
      toast({ title: "Error", description: `An unexpected error occurred: ${error.message}`, variant: "destructive" });
      setIsRedirectingToPortal(false);
    }
  };

  const handleConnectGoogleTasks = async () => {
    if (!user) return;
    setIsConnectingGoogle(true);
    try {
      const { url } = await generateGoogleAuthUrl();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("The server did not return a valid authentication URL.");
      }
    } catch (error: any) {
        toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
        setIsConnectingGoogle(false);
    }
  };
  
  const isAdminUser = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!user || !userProfile) {
    return null;
  }
  
  const initialProfileDataForEdit: EditProfileFormData = {
    displayName: userProfile.displayName || user.displayName || '',
    firstName: userProfile.firstName || '',
    lastName: userProfile.lastName || '',
    email: userProfile.email || user.email || '',
    city: userProfile.city || '',
    state: userProfile.state || '',
    country: userProfile.country || '',
    homeAddress: userProfile.homeAddress || '',
  };
  
  const fullName = [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ');
  const welcomeName = fullName || userProfile.displayName || user.displayName || 'User';
  const isGoogleTasksConnected = !!userProfile.googleAuth?.refreshToken;

  return (
    <div className="space-y-8">
      <Card className="max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center">
          <UserCircle className="h-20 w-20 text-primary mx-auto mb-3" />
          <CardTitle className="font-headline text-3xl text-primary">
            Welcome, {welcomeName}!
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
                <strong>First Name:</strong>&nbsp;{userProfile.firstName || '[Not Set]'}
            </p>
             <p className="font-body text-sm flex items-center">
                <User className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Last Name:</strong>&nbsp;{userProfile.lastName || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <UserCircle className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Username:</strong>&nbsp;{userProfile.displayName || '[Not Set]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Email:</strong>&nbsp;{userProfile.email || user.email || '[Not Set]'}
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
            <p className="font-body text-sm flex items-center">
                <Home className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Home Address:</strong>&nbsp;{userProfile.homeAddress || '[Not Set]'}
            </p>
          </div>

          <div className="p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-headline text-foreground mb-2">Integrations</h3>
              {isGoogleTasksConnected ? (
                 <Alert variant="default" className="bg-green-100 border-green-300">
                    <Check className="h-4 w-4 text-green-700"/>
                    <AlertTitle className="font-headline text-green-800">Google Tasks Connected</AlertTitle>
                    <AlertDescription className="text-green-700 space-y-2">
                       <p>KamperHub is authorized to create packing lists in your Google Tasks.</p>
                       <Button onClick={handleDisconnectGoogle} variant="destructive" size="sm" disabled={isDisconnectingGoogle}>
                         {isDisconnectingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                         {isDisconnectingGoogle ? 'Disconnecting...' : 'Disconnect Account'}
                       </Button>
                    </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-body">Connect KamperHub to other services to enhance your experience.</p>
                  <Button onClick={handleConnectGoogleTasks} className="w-full sm:w-auto" variant="outline" disabled={isConnectingGoogle}>
                      {isConnectingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LinkIcon className="mr-2 h-4 w-4"/>}
                      {isConnectingGoogle ? 'Connecting...' : 'Connect Google Tasks'}
                  </Button>
                   <p className="text-xs text-muted-foreground font-body">This will allow KamperHub to create packing lists as tasks in your Google account.</p>
                </div>
              )}
          </div>

          <div className="p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-headline text-foreground mb-2">Subscription Status:</h3>
            <div className="font-body text-sm flex items-center mb-2">
              <Star className={`h-4 w-4 mr-2 ${hasProAccess ? 'text-yellow-500 fill-yellow-400' : 'text-primary/80'}`} />
              <strong>Current Access:</strong>&nbsp;
              <Badge variant={hasProAccess ? 'default' : 'secondary'} className={hasProAccess ? 'bg-yellow-500 text-white' : ''}>
                {subscriptionTier.toUpperCase()}
              </Badge>
            </div>

            {isTrialActive && trialEndsAt && (
              <Alert variant="default" className="mb-3 bg-blue-50 border-blue-300">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertTitle className="font-headline text-blue-700">Pro Trial Active!</AlertTitle>
                <AlertDescription className="font-body text-blue-600">
                  Your Pro trial ends on {format(parseISO(trialEndsAt), "PP")}. Subscribe now to keep your Pro features after the trial.
                </AlertDescription>
              </Alert>
            )}

            {subscriptionTier !== 'pro' && (
              <div className="mt-4 space-y-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-primary font-headline flex items-center"><Sparkles className="h-5 w-5 mr-2 text-yellow-500"/> Unlock Pro Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm font-body text-foreground/90">
                            <li>Add **unlimited** tow vehicles and caravans.</li>
                            <li>Access detailed trip statistics and records.</li>
                            <li>Use the AI-powered Packing Assistant.</li>
                            <li>Support the ongoing development of KamperHub!</li>
                        </ul>
                    </CardContent>
                </Card>

                <Button
                  onClick={handleSubscribeToPro}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-body animate-pulse"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Go Pro with Stripe
                </Button>
              </div>
            )}
            
            {stripeCustomerId && subscriptionTier === 'pro' && (
              <div className="mt-3">
                <p className="font-body text-sm text-muted-foreground">
                  Manage your payment methods, view invoices, or update/cancel your subscription.
                </p>
                <Button
                    onClick={handleManageSubscription}
                    disabled={isRedirectingToPortal}
                    className="mt-2 w-full font-body bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {isRedirectingToPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Manage Subscription in Stripe
                </Button>
              </div>
            )}
            
            {stripeCustomerId && subscriptionTier === 'pro' && (
               <p className="font-body text-xs mt-1 text-muted-foreground">Stripe Customer ID: {stripeCustomerId}</p>
            )}
          </div>

          {isAdminUser && (
            <Link href="/admin" passHref onClick={handleNavigation}>
              <Button variant="secondary" className="w-full font-body">
                <UserCog className="mr-2 h-4 w-4" /> Admin Only - Manage Users
              </Button>
            </Link>
          )}

          {subscriptionTier !== 'pro' && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-headline">Stripe Security & Pop-up Blockers</AlertTitle>
                <AlertDescription className="font-body text-sm">
                  If the Stripe payment page doesn't open or appears blank, please temporarily disable browser extensions (like ad blockers or privacy tools) or security software that might be interfering. Using an Incognito/Private window can also help.
                </AlertDescription>
            </Alert>
          )}

          {/* TEMPORARY LINK FOR TESTING */}
          <Link href="/subscribe/success" passHref onClick={handleNavigation}>
            <Button variant="outline" className="w-full font-body">
              View Success Page (Test Link)
            </Button>
          </Link>

          <Button onClick={handleLogout} variant="destructive" className="w-full font-body">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
