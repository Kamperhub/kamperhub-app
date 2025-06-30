
"use client";

import Link from 'next/link';
import { useEffect, useContext } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Home, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NavigationContext } from '@/components/layout/AppShell';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const navContext = useContext(NavigationContext);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // In a real app, you might want to verify the session_id with your backend
      // to confirm the subscription status before showing a strong success message
      // or granting access. For now, we'll assume success if redirected here with a session_id.
      console.log('Stripe Checkout Session ID:', sessionId);
      toast({
        title: 'Subscription Activated!',
        description: 'Your KamperHub Pro features are now available.',
        variant: 'default',
        duration: 7000,
      });
      // Optionally, clear any local state that might be out of sync
      // and force a refresh of user data or subscription status.
      // e.g. by invalidating a React Query cache or calling a refresh function.
    } else {
        toast({
            title: 'Subscription Processed',
            description: 'Welcome to KamperHub Pro! Your new features should be active.',
            variant: 'default',
            duration: 7000,
        });
    }

    // Redirect to account page after a short delay
    const timer = setTimeout(() => {
      router.push('/my-account');
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [searchParams, router, toast]);

  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">
            Subscription Successful!
          </CardTitle>
          <CardDescription className="font-body text-lg text-muted-foreground pt-2">
            Welcome to KamperHub Pro! Your account has been upgraded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="font-body text-foreground">
            You now have access to all premium features. You will be redirected to your account page shortly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/my-account" passHref>
              <Button className="w-full sm:w-auto font-body bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleNavigation}>
                <ShieldCheck className="mr-2 h-5 w-5" />
                Go to My Account
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button variant="outline" className="w-full sm:w-auto font-body" onClick={handleNavigation}>
                <Home className="mr-2 h-5 w-5" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
