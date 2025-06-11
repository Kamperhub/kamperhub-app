
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser, updateProfile, updateEmail, type AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import {
  MOCK_AUTH_SUBSCRIPTION_TIER_KEY,
  MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY,
  MOCK_AUTH_CITY_KEY,
  MOCK_AUTH_STATE_KEY,
  MOCK_AUTH_COUNTRY_KEY,
} from '@/types/auth';
import type { SubscriptionTier, UserProfile } from '@/types/auth';
import { useSubscription } from '@/hooks/useSubscription'; // Import useSubscription
import { UserCircle, LogOut, ShieldAlert, Mail, Star, ExternalLink, MapPin, Building, Globe, Edit3, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditProfileForm, type EditProfileFormData } from '@/components/features/account/EditProfileForm';

export default function MyAccountPage() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({}); // Store Firestore profile data
  const [isAuthLoading, setIsAuthLoading] = useState(true); // For initial auth check
  const [isProfileLoading, setIsProfileLoading] = useState(false); // For Firestore profile fetch
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  // Local state for display, synced from userProfile (Firestore) or localStorage as fallback
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
        // Sync Firestore data to local display state and localStorage/context for wider app consistency
        setProfileCity(profileData.city || null);
        setProfileState(profileData.state || null);
        setProfileCountry(profileData.country || null);
        setSubscriptionDetails(profileData.subscriptionTier || 'free', profileData.stripeCustomerId || null);

        // Update localStorage for these specific items if still needed by other components
        if (profileData.city) localStorage.setItem(MOCK_AUTH_CITY_KEY, profileData.city); else localStorage.removeItem(MOCK_AUTH_CITY_KEY);
        if (profileData.state) localStorage.setItem(MOCK_AUTH_STATE_KEY, profileData.state); else localStorage.removeItem(MOCK_AUTH_STATE_KEY);
        if (profileData.country) localStorage.setItem(MOCK_AUTH_COUNTRY_KEY, profileData.country); else localStorage.removeItem(MOCK_AUTH_COUNTRY_KEY);
      } else {
        console.log("No Firestore profile document found for user:", user.uid, ". It will be created on first save.");
        // Fallback to localStorage for subscription if no Firestore doc (for older users)
        const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
        const storedStripeId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
        setSubscriptionDetails(storedTier || 'free', storedStripeId);
        
        setProfileCity(localStorage.getItem(MOCK_AUTH_CITY_KEY));
        setProfileState(localStorage.getItem(MOCK_AUTH_STATE_KEY));
        setProfileCountry(localStorage.getItem(MOCK_AUTH_COUNTRY_KEY));
        setUserProfile({ email: user.email, displayName: user.displayName }); // Basic info from auth
      }
    } catch (error) {
      console.error("Error fetching user profile from Firestore:", error);
      toast({ title: "Error", description: "Could not load your profile details from the server.", variant: "destructive" });
      // Fallback to localStorage if Firestore fails
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
        fetchUserProfile(user); // Fetch Firestore profile data
      } else {
        setFirebaseUser(null);
        setUserProfile({});
        setProfileCity(null);
        setProfileState(null);
        setProfileCountry(null);
        setSubscriptionDetails('free', null); // Reset subscription context on logout
        // Clear local storage related to profile on logout
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
      // States are reset by onAuthStateChanged listener
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

    // 1. Update Display Name in Firebase Auth
    const newDisplayName = `${data.firstName} ${data.lastName}`.trim();
    if (newDisplayName && newDisplayName !== firebaseUser.displayName) {
      try {
        await updateProfile(firebaseUser, { displayName: newDisplayName });
        // FirebaseUser state will update via onAuthStateChanged, triggering re-fetch or use current
        // For immediate UI update of displayName, we can setFirebaseUser, but onAuthStateChanged is cleaner
        setFirebaseUser(auth.currentUser); // Force re-fetch of firebaseUser which has updated displayName
        successMessages.push("Display Name updated.");
        authUpdatesSuccessful = true;
      } catch (error: any) {
        console.error("Error updating display name:", error);
        errorMessages.push(`Failed to update display name: ${error.message}`);
      }
    } else if (newDisplayName === firebaseUser.displayName) {
        // No change, no message
    }


    // 2. Update Email in Firebase Auth
    if (data.email.toLowerCase() !== (firebaseUser.email?.toLowerCase() || '')) {
      try {
        await updateEmail(firebaseUser, data.email);
        setFirebaseUser(auth.currentUser); // Re-fetch user for new email
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

    // 3. Update profile details in Firestore
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const firestoreProfileData: Partial<UserProfile> = {
      firstName: data.firstName,
      lastName: data.lastName,
      city: data.city,
      state: data.state,
      country: data.country,
      // email and displayName are primarily managed by Firebase Auth, but we can mirror them here
      email: data.email, // Mirror the new email
      displayName: newDisplayName, // Mirror the new display name (from firstName, lastName)
      updatedAt: new Date().toISOString(),
    };

    // Ensure createdAt is only set if the document is being newly created
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      firestoreProfileData.createdAt = new Date().toISOString();
      firestoreProfileData.subscriptionTier = 'free'; // Set default tier for new Firestore doc
      firestoreProfileData.stripeCustomerId = null;  // Set default Stripe ID for new Firestore doc
    }


    try {
      await setDoc(userDocRef, firestoreProfileData, { merge: true });
      firestoreUpdateSuccessful = true;
      successMessages.push("Profile details saved to server.");
      
      // Update local state for immediate UI reflection & sync localStorage
      setUserProfile(prev => ({...prev, ...firestoreProfileData}));
      setProfileCity(data.city);
      setProfileState(data.state);
      setProfileCountry(data.country);
      localStorage.setItem(MOCK_AUTH_CITY_KEY, data.city);
      localStorage.setItem(MOCK_AUTH_STATE_KEY, data.state);
      localStorage.setItem(MOCK_AUTH_COUNTRY_KEY, data.country);

    } catch (error: any) {
      console.error("Error saving profile to Firestore:", error);
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

  if (isAuthLoading || (!firebaseUser && !isAuthLoading)) { // Show main loader if auth is loading or user is null (and auth not loading)
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
  
  // User is authenticated, now check if profile is loading
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
    city: profileCity || '', // Use local state which is synced from Firestore/localStorage
    state: profileState || '',
    country: profileCountry || '',
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

    