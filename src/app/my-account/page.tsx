
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  MOCK_AUTH_USERNAME_KEY,
  MOCK_AUTH_LOGGED_IN_KEY,
  MOCK_AUTH_EMAIL_KEY,
  MOCK_AUTH_FIRST_NAME_KEY,
  MOCK_AUTH_LAST_NAME_KEY,
  MOCK_AUTH_SUBSCRIPTION_TIER_KEY,
  MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY,
  MOCK_AUTH_CITY_KEY,
  MOCK_AUTH_STATE_KEY,
  MOCK_AUTH_COUNTRY_KEY,
  MOCK_AUTH_USER_REGISTRY_KEY,
  type MockAuthSession,
  type SubscriptionTier,
  type MockUserRegistryEntry,
} from '@/types/auth';
import { UserCircle, LogOut, ShieldAlert, Mail, Star, ExternalLink, MapPin, Building, Globe, Edit3, User } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { EditProfileForm, type EditProfileFormData } from '@/components/features/account/EditProfileForm';

export default function MyAccountPage() {
  const [session, setSession] = useState<MockAuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const loadSessionData = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem(MOCK_AUTH_USERNAME_KEY);
      const storedEmail = localStorage.getItem(MOCK_AUTH_EMAIL_KEY);
      const storedFirstName = localStorage.getItem(MOCK_AUTH_FIRST_NAME_KEY);
      const storedLastName = localStorage.getItem(MOCK_AUTH_LAST_NAME_KEY);
      const isLoggedIn = localStorage.getItem(MOCK_AUTH_LOGGED_IN_KEY) === 'true';
      const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
      const storedStripeCustomerId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
      const storedCity = localStorage.getItem(MOCK_AUTH_CITY_KEY);
      const storedState = localStorage.getItem(MOCK_AUTH_STATE_KEY);
      const storedCountry = localStorage.getItem(MOCK_AUTH_COUNTRY_KEY);

      if (isLoggedIn && storedUsername) {
        setSession({
          isLoggedIn: true,
          username: storedUsername,
          email: storedEmail || null,
          firstName: storedFirstName || null,
          lastName: storedLastName || null,
          subscriptionTier: storedTier || 'free',
          stripeCustomerId: storedStripeCustomerId || null,
          city: storedCity || null,
          state: storedState || null,
          country: storedCountry || null,
        });
      } else {
        setSession({ 
            isLoggedIn: false, 
            username: null, 
            email: null, 
            firstName: null, 
            lastName: null, 
            subscriptionTier: 'free', 
            stripeCustomerId: null,
            city: null,
            state: null,
            country: null,
        });
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      // Clear all mock auth keys
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('kamperhub_mock_')) {
          localStorage.removeItem(key);
        }
      });
    }
    setSession({ 
        isLoggedIn: false, username: null, email: null, firstName: null, lastName: null, 
        subscriptionTier: 'free', stripeCustomerId: null, city: null, state: null, country: null,
    });
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    window.dispatchEvent(new Event('storage'));
    router.push('/');
    router.refresh();
  };

  const handleSaveProfile = async (data: EditProfileFormData): Promise<boolean> => {
    if (!session || !session.username) {
      toast({ title: "Error", description: "No active session found.", variant: "destructive" });
      return false;
    }
    setIsSavingProfile(true);

    let emailChanged = data.email.toLowerCase() !== (session.email?.toLowerCase() || '');
    let newEmailIsAvailable = true;

    // Update localStorage user registry
    try {
      const storedRegistryJson = localStorage.getItem(MOCK_AUTH_USER_REGISTRY_KEY);
      let userRegistry: MockUserRegistryEntry[] = storedRegistryJson ? JSON.parse(storedRegistryJson) : [];

      // Check email uniqueness if changed
      if (emailChanged) {
        const emailExists = userRegistry.some(
          user => user.email.toLowerCase() === data.email.toLowerCase() && user.username.toLowerCase() !== session.username!.toLowerCase()
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

      userRegistry = userRegistry.map(user => {
        if (user.username.toLowerCase() === session.username!.toLowerCase()) {
          return {
            ...user, // Keep existing fields like password
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

      // Update current session localStorage
      localStorage.setItem(MOCK_AUTH_FIRST_NAME_KEY, data.firstName);
      localStorage.setItem(MOCK_AUTH_LAST_NAME_KEY, data.lastName);
      localStorage.setItem(MOCK_AUTH_EMAIL_KEY, data.email);
      localStorage.setItem(MOCK_AUTH_CITY_KEY, data.city);
      localStorage.setItem(MOCK_AUTH_STATE_KEY, data.state);
      localStorage.setItem(MOCK_AUTH_COUNTRY_KEY, data.country);

      // Update local session state to re-render
      setSession(prev => prev ? ({
        ...prev,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        city: data.city,
        state: data.state,
        country: data.country,
      }) : null);

      toast({ title: "Profile Updated", description: "Your account details have been saved." });
      setIsEditProfileOpen(false); // Close dialog on successful save
      window.dispatchEvent(new Event('storage')); // Notify header to update
      setIsSavingProfile(false);
      return true;

    } catch (error) {
      console.error("Error saving profile:", error);
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

  if (!session?.isLoggedIn) {
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
  
  const initialProfileDataForEdit = {
    firstName: session.firstName || '',
    lastName: session.lastName || '',
    email: session.email || '',
    city: session.city || '',
    state: session.state || '',
    country: session.country || '',
  };

  return (
    <div className="space-y-8">
      <Card className="max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center">
          <UserCircle className="h-20 w-20 text-primary mx-auto mb-3" />
          <CardTitle className="font-headline text-3xl text-primary">
            Welcome, {session.firstName || session.username}!
          </CardTitle>
          <CardDescription className="font-body text-lg">
            Manage your account details and subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
            <ShieldAlert className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="font-headline text-yellow-700">Demonstration Only</AlertTitle>
            <AlertDescription className="font-body">
              This account system uses browser local storage for demonstration.
              Subscription management and trial logic are conceptual.
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
            
            {session.firstName && (
              <p className="font-body text-sm flex items-center">
                  <User className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                  <strong>First Name:</strong>&nbsp;{session.firstName}
              </p>
            )}
            {session.lastName && (
              <p className="font-body text-sm flex items-center">
                  <User className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                  <strong>Last Name:</strong>&nbsp;{session.lastName}
              </p>
            )}
            <p className="font-body text-sm flex items-center">
                <UserCircle className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>User Name:</strong>&nbsp;{session.username} <span className="text-xs text-muted-foreground/70 ml-1">(cannot be changed)</span>
            </p>
            {session.email && (
              <p className="font-body text-sm flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                  <strong>Email:</strong>&nbsp;{session.email}
              </p>
            )}
            <p className="font-body text-sm flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>City:</strong>&nbsp;{session.city || '[Not Provided]'}
            </p>
            <p className="font-body text-sm flex items-center">
                <Building className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>State / Region:</strong>&nbsp;{session.state || '[Not Provided]'}
            </p>
             <p className="font-body text-sm flex items-center">
                <Globe className="h-4 w-4 mr-2 text-primary/80 opacity-70" />
                <strong>Country:</strong>&nbsp;{session.country || '[Not Provided]'}
            </p>
          </div>

          <div className="p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-headline text-foreground mb-2">Subscription Status:</h3>
            <div className="font-body text-sm flex items-center">
              <Star className={`h-4 w-4 mr-2 ${session.subscriptionTier === 'pro' ? 'text-yellow-500 fill-yellow-400' : 'text-primary/80'}`} />
              <strong>Current Tier:</strong>&nbsp;
              <Badge variant={session.subscriptionTier === 'pro' ? 'default' : 'secondary'} className={session.subscriptionTier === 'pro' ? 'bg-yellow-500 text-white' : ''}>
                {session.subscriptionTier?.toUpperCase() || 'N/A'}
              </Badge>
            </div>
            {session.stripeCustomerId && (
               <p className="font-body text-xs mt-1 text-muted-foreground">Stripe Customer ID: {session.stripeCustomerId}</p>
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
