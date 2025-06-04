
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription'; // Import the hook
import { CheckCircle, XCircle, Loader2, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Ensure your Stripe publishable key is set in your environment variables
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isSubscribed, setIsSubscribed, isLoading: isSubscriptionLoading } = useSubscription(); // Use the subscription hook
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      toast({
        title: "Stripe Not Configured",
        description: "Stripe publishable key is missing. Payment functionality is disabled.",
        variant: "destructive",
      });
    }
    if (!process.env.STRIPE_PRICE_ID) {
         toast({
        title: "Stripe Product Not Configured",
        description: "Stripe Price ID is missing. Please configure it in the .env file.",
        variant: "destructive",
      });
    }

    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success) {
      setIsSubscribed(true); // Set subscription status
      toast({
        title: "Subscription Successful!",
        description: "Welcome to KamperHub Pro! You now have access to all features.",
        variant: "default",
        className: "bg-green-500 text-white",
      });
      router.replace('/subscribe'); // Remove query params
    }

    if (canceled) {
      setIsSubscribed(false); // Ensure subscription is false if cancelled
      toast({
        title: "Subscription Canceled",
        description: "Your subscription process was canceled. You can try again anytime.",
        variant: "destructive",
      });
      router.replace('/subscribe'); // Remove query params
    }
  }, [searchParams, toast, router, setIsSubscribed]);

  const handleSubscribeClick = async () => {
    if (!stripePromise) {
      toast({
        title: "Stripe Error",
        description: "Stripe is not properly configured. Cannot proceed with payment.",
        variant: "destructive",
      });
      return;
    }
    if (!process.env.STRIPE_PRICE_ID) {
      toast({
        title: "Configuration Error",
        description: "Stripe Price ID is not set. Cannot proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsRedirecting(true);

    try {
      const response = await fetch('/api/create-stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // You might want to send user ID or other details if you have auth
        // body: JSON.stringify({ userId: 'some-user-id' }), 
      });

      const sessionData = await response.json();

      if (response.ok && sessionData.url) {
        // Redirect to Stripe Checkout
        window.location.href = sessionData.url;
      } else {
        throw new Error(sessionData.error || 'Failed to create Stripe session.');
      }
    } catch (error: any) {
      console.error("Subscription Error:", error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Could not initiate the subscription process. Please try again.",
        variant: "destructive",
      });
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
        <CreditCard className="mr-3 h-8 w-8" /> KamperHub Pro Subscription
      </h1>

      <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
        <CreditCard className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="font-headline text-yellow-700">Important Notice</AlertTitle>
        <AlertDescription className="font-body">
          This is a conceptual paywall using Stripe. You will need to replace placeholder API keys and Price ID in the `.env` file with your actual Stripe data.
          The subscription status is currently mocked using local browser storage for demonstration and is **not secure for a production environment.**
          A real implementation requires handling Stripe webhooks to securely update subscription status in a database, tied to user authentication.
        </AlertDescription>
      </Alert>

      <Card className="max-w-md mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-center text-primary">
            {isSubscribed ? "You are Subscribed!" : "Unlock KamperHub Pro"}
          </CardTitle>
          <CardDescription className="font-body text-center">
            {isSubscribed 
              ? "Thank you for being a Pro member. Enjoy all features!" 
              : "Access all premium features, unlimited planning, and more."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {isSubscribed ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-body">Your Pro access is active.</p>
              <Button variant="outline" onClick={() => setIsSubscribed(false)} className="font-body">
                Simulate Unsubscribe (for demo)
              </Button>
            </div>
          ) : (
            <>
              <p className="text-4xl font-headline text-accent">$9.99 <span className="text-lg text-muted-foreground">/ month</span></p>
              <p className="font-body text-muted-foreground">
                (This is a placeholder price. Actual price is set in your Stripe Dashboard via STRIPE_PRICE_ID)
              </p>
              <Button 
                onClick={handleSubscribeClick} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body text-lg py-6"
                disabled={!stripePromise || isRedirecting || !process.env.STRIPE_PRICE_ID}
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Redirecting to Stripe...
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </Button>
               {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
                <p className="text-xs text-destructive font-body mt-2">Stripe Publishable Key is not configured. Payment disabled.</p>
              )}
               {!process.env.STRIPE_PRICE_ID && (
                <p className="text-xs text-destructive font-body mt-2">Stripe Price ID is not configured. Payment disabled.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
