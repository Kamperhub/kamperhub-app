
"use client";

import React, { useEffect, useState } from 'react'; // Added useState
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { CheckCircle, Loader2, CreditCard, Star } from 'lucide-react'; // Added Star
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SubscriptionTier } from '@/types/auth'; // Import SubscriptionTier

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// Define your tiers and their corresponding Price IDs
const TIER_PRICE_IDS: Record<Exclude<SubscriptionTier, 'free'>, string | undefined> = {
  pro: process.env.STRIPE_PRICE_ID, // Using the existing env var for 'pro' tier
  // Add more tiers here if needed, e.g., premium: process.env.STRIPE_PREMIUM_PRICE_ID
};

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { subscriptionTier, setSubscriptionDetails, isLoading: isSubscriptionLoading, isProTier } = useSubscription();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      toast({
        title: "Stripe Not Configured",
        description: "Stripe publishable key is missing. Payment functionality is disabled.",
        variant: "destructive",
      });
    }
    if (!TIER_PRICE_IDS.pro) { // Check for the specific 'pro' tier Price ID
         toast({
        title: "Stripe Product Not Configured",
        description: "Stripe Price ID for the 'Pro' tier is missing. Please configure STRIPE_PRICE_ID in the .env file.",
        variant: "destructive",
      });
    }

    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success && sessionId) {
      // In a real app, you'd verify the session_id with your backend before confirming subscription.
      // For this mock, we'll assume success means 'pro' tier.
      setSubscriptionDetails('pro' as SubscriptionTier, `cus_mock_${Date.now()}`); // Mock customer ID
      toast({
        title: "Subscription Successful!",
        description: "Welcome to KamperHub Pro! You now have access to all premium features.",
        variant: "default",
        className: "bg-green-500 text-white",
      });
      router.replace('/subscribe'); 
    }

    if (canceled) {
      // No change to subscription status if cancelled
      toast({
        title: "Subscription Canceled",
        description: "Your subscription process was canceled. You can try again anytime.",
        variant: "destructive",
      });
      router.replace('/subscribe');
    }
  }, [searchParams, toast, router, setSubscriptionDetails]);

  const handleSubscribeClick = async (tier: Exclude<SubscriptionTier, 'free'>) => {
    const priceId = TIER_PRICE_IDS[tier];

    if (!stripePromise) {
      toast({ title: "Stripe Error", description: "Stripe is not properly configured.", variant: "destructive" });
      return;
    }
    if (!priceId) {
      toast({ title: "Configuration Error", description: `Stripe Price ID for '${tier}' tier is not set.`, variant: "destructive" });
      return;
    }

    setIsRedirecting(true);

    try {
      const response = await fetch('/api/create-stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceId }), // Send the priceId for the chosen tier
      });

      const sessionData = await response.json();

      if (response.ok && sessionData.url) {
        window.location.href = sessionData.url;
      } else {
        throw new Error(sessionData.error || 'Failed to create Stripe session.');
      }
    } catch (error: any) {
      console.error("Subscription Error:", error);
      toast({ title: "Subscription Failed", description: error.message || "Could not initiate subscription.", variant: "destructive" });
      setIsRedirecting(false);
    }
  };

  if (isSubscriptionLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-body">Loading subscription status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline mb-6 text-primary flex items-center">
        <CreditCard className="mr-3 h-8 w-8" /> KamperHub Subscriptions
      </h1>

      <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
        <CreditCard className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="font-headline text-yellow-700">Important Notice</AlertTitle>
        <AlertDescription className="font-body">
          This is a conceptual paywall using Stripe. Ensure Stripe keys and Price IDs are in `.env`.
          Subscription status is mocked via local storage and is **not secure for production.**
          A real implementation requires Stripe webhooks to securely update subscription status in a database, linked to user authentication.
        </AlertDescription>
      </Alert>

      <Card className="max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center text-primary">
            {isProTier ? "You are a KamperHub Pro Member!" : "Choose Your Plan"}
          </CardTitle>
          <CardDescription className="font-body text-center">
            {isProTier 
              ? "Thank you for supporting KamperHub. Enjoy all Pro features!" 
              : "Unlock premium features and enhance your caravanning experience."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {isProTier ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-body">Your Pro access (Tier: {subscriptionTier}) is active.</p>
              <Button 
                variant="outline" 
                onClick={() => setSubscriptionDetails('free' as SubscriptionTier, null)} 
                className="font-body"
              >
                Simulate Downgrade to Free (for demo)
              </Button>
            </div>
          ) : (
            <>
              {subscriptionTier === 'free' && (
                <p className="font-body text-muted-foreground">You are currently on the <strong>Free</strong> tier.</p>
              )}
              <div className="p-6 border border-primary rounded-lg bg-primary/5 shadow-sm">
                <h3 className="text-2xl font-headline text-accent flex items-center justify-center mb-2">
                    <Star className="mr-2 h-6 w-6 text-yellow-400 fill-yellow-400" /> KamperHub Pro
                </h3>
                <p className="font-body text-muted-foreground mb-4">
                  Unlimited vehicles, caravans, WDHs, and access to all future premium features.
                  <br />
                  (Actual price is set in your Stripe Dashboard via STRIPE_PRICE_ID)
                </p>
                <Button 
                  onClick={() => handleSubscribeClick('pro')} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body text-lg py-6"
                  disabled={!stripePromise || isRedirecting || !TIER_PRICE_IDS.pro}
                >
                  {isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Redirecting to Stripe...
                    </>
                  ) : (
                    "Upgrade to Pro"
                  )}
                </Button>
              </div>
               {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <p className="text-xs text-destructive font-body mt-2">Stripe Publishable Key is not configured. Payment disabled.</p>
              )}
               {!TIER_PRICE_IDS.pro && (
                <p className="text-xs text-destructive font-body mt-2">Stripe Price ID for 'Pro' tier is not configured. Payment disabled.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
