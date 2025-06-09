
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Removed: import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { CheckCircle, Loader2, CreditCard, Star, ExternalLink } from 'lucide-react'; // Added ExternalLink
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { SubscriptionTier } from '@/types/auth';
import Link from 'next/link'; // Added Link

// Removed: stripePromise

const STRIPE_PRO_CHECKOUT_LINK = process.env.NEXT_PUBLIC_STRIPE_PRO_TIER_CHECKOUT_LINK;

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { subscriptionTier, setSubscriptionDetails, isLoading: isSubscriptionLoading, isProTier } = useSubscription();
  // Removed: const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Removed Stripe not configured toast related to publishable key, as it's not directly used here anymore.
    // If STRIPE_PRO_CHECKOUT_LINK is missing, it's handled by disabling the button.

    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id'); // Stripe Checkout Links can still pass this

    if (success) { // Simplified check, session_id might not always be present or needed for this conceptual update
      setSubscriptionDetails('pro' as SubscriptionTier, `cus_mock_checkout_link_${Date.now()}`);
      toast({
        title: "Subscription Successful!",
        description: "Welcome to KamperHub Pro! You now have access to all premium features.",
        variant: "default",
        className: "bg-green-500 text-white",
      });
      router.replace('/subscribe'); 
    }

    if (canceled) {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription process was canceled. You can try again anytime.",
        variant: "destructive",
      });
      router.replace('/subscribe');
    }
  }, [searchParams, toast, router, setSubscriptionDetails]);

  // Removed: handleSubscribeClick function

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
          This is a conceptual paywall using a direct Stripe Checkout Link. 
          Ensure <code>NEXT_PUBLIC_STRIPE_PRO_TIER_CHECKOUT_LINK</code> is set in your <code>.env</code> file (this link is generated in your Stripe Dashboard).
          Subscription status is updated client-side based on redirect parameters and is <strong>not secure for production.</strong>
          A real implementation requires Stripe webhooks to securely update subscription status in a database.
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
                  (Price is set via the Stripe Payment Link configured in your Stripe Dashboard.)
                </p>
                <Button 
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body text-lg py-6"
                  disabled={!STRIPE_PRO_CHECKOUT_LINK}
                >
                  <Link 
                    href={STRIPE_PRO_CHECKOUT_LINK || '#'} 
                    target="_blank" // Open Stripe in a new tab
                    rel="noopener noreferrer"
                  >
                    Upgrade to Pro <ExternalLink className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                {!STRIPE_PRO_CHECKOUT_LINK && (
                  <p className="text-xs text-destructive font-body mt-2">
                    Stripe Pro Tier Checkout Link is not configured. Admins: Please set <code>NEXT_PUBLIC_STRIPE_PRO_TIER_CHECKOUT_LINK</code> in your .env file.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
