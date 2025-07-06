"use client";

import Link from 'next/link';
import { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Home, ShieldCheck } from 'lucide-react';
import { NavigationContext } from '@/components/layout/AppShell';

export default function SubscriptionSuccessPage() {
  const navContext = useContext(NavigationContext);

  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
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
            You now have access to all premium features. Please go to your account page to see your updated status.
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
