
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  MOCK_AUTH_USERNAME_KEY, 
  MOCK_AUTH_LOGGED_IN_KEY, 
  MOCK_AUTH_EMAIL_KEY, 
  MOCK_AUTH_SUBSCRIPTION_TIER_KEY, 
  MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY, 
  type MockAuthSession,
  type SubscriptionTier
} from '@/types/auth';
import { UserCircle, LogOut, ShieldAlert, Mail, Star } from 'lucide-react'; // Added Star
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge'; // Added Badge

export default function MyAccountPage() {
  const [session, setSession] = useState<MockAuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem(MOCK_AUTH_USERNAME_KEY);
      const storedEmail = localStorage.getItem(MOCK_AUTH_EMAIL_KEY);
      const isLoggedIn = localStorage.getItem(MOCK_AUTH_LOGGED_IN_KEY) === 'true';
      const storedTier = localStorage.getItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY) as SubscriptionTier | null;
      const storedStripeCustomerId = localStorage.getItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);

      if (isLoggedIn && storedUsername) {
        setSession({ 
          isLoggedIn: true, 
          username: storedUsername, 
          email: storedEmail,
          subscriptionTier: storedTier || 'free', // Default to 'free' if not set
          stripeCustomerId: storedStripeCustomerId
        });
      } else {
        setSession({ isLoggedIn: false, username: null, email: null, subscriptionTier: 'free' });
      }
      setIsLoading(false);
    }
  }, []); // Removed router from dependencies as it doesn't change

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_AUTH_USERNAME_KEY);
      localStorage.removeItem(MOCK_AUTH_EMAIL_KEY);
      localStorage.removeItem(MOCK_AUTH_LOGGED_IN_KEY);
      localStorage.removeItem(MOCK_AUTH_SUBSCRIPTION_TIER_KEY);
      localStorage.removeItem(MOCK_AUTH_STRIPE_CUSTOMER_ID_KEY);
    }
    setSession({ isLoggedIn: false, username: null, email: null, subscriptionTier: 'free' });
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    window.dispatchEvent(new Event('storage')); // Notify header and other components
    router.push('/');
    router.refresh(); 
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
            <Link href="/signup" passHref>
            <Button className="w-full font-body bg-primary text-primary-foreground hover:bg-primary/90">
                Sign Up / Log In
            </Button>
            </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="max-w-lg mx-auto shadow-xl">
        <CardHeader className="text-center">
          <UserCircle className="h-20 w-20 text-primary mx-auto mb-3" />
          <CardTitle className="font-headline text-3xl text-primary">
            Welcome, {session.username}!
          </CardTitle>
          <CardDescription className="font-body text-lg">
            This is your conceptual account page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
            <ShieldAlert className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="font-headline text-yellow-700">Demonstration Only</AlertTitle>
            <AlertDescription className="font-body">
              This account system is for demonstration and uses browser local storage.
              It is not secure for real applications.
            </AlertDescription>
          </Alert>
          
          <div className="p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-headline text-foreground mb-2">Account Details:</h3>
            <p className="font-body text-sm"><strong>User Name:</strong> {session.username}</p>
            {session.email && (
              <p className="font-body text-sm flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 text-primary/80" />
                  <strong>Email:</strong> {session.email}
              </p>
            )}
            <div className="font-body text-sm flex items-center mt-2">
              <Star className={`h-4 w-4 mr-2 ${session.subscriptionTier === 'pro' ? 'text-yellow-500 fill-yellow-400' : 'text-primary/80'}`} />
              <strong>Subscription Tier:</strong>&nbsp;
              <Badge variant={session.subscriptionTier === 'pro' ? 'default' : 'secondary'} className={session.subscriptionTier === 'pro' ? 'bg-yellow-500 text-white' : ''}>
                {session.subscriptionTier?.toUpperCase() || 'N/A'}
              </Badge>
            </div>
            {session.stripeCustomerId && (
               <p className="font-body text-xs mt-1 text-muted-foreground">Stripe Customer ID: {session.stripeCustomerId}</p>
            )}
            {session.subscriptionTier !== 'pro' && (
                <Link href="/subscribe" passHref>
                    <Button size="sm" className="mt-3 font-body bg-accent text-accent-foreground hover:bg-accent/90">
                        Upgrade to Pro
                    </Button>
                </Link>
            )}
          </div>
          
          <Button onClick={handleLogout} variant="destructive" className="w-full font-body">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
