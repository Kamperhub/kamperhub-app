
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { XCircle, Home, ShoppingCart } from 'lucide-react';
import { useContext } from 'react';
import { NavigationContext } from '@/components/layout/AppShell';

export default function SubscriptionCancelPage() {
  const navContext = useContext(NavigationContext);
  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="font-headline text-3xl text-destructive">
            Subscription Canceled
          </CardTitle>
          <CardDescription className="font-body text-lg text-muted-foreground pt-2">
            Your subscription process was not completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="font-body text-foreground">
            You have not been charged. If you'd like to try again or explore other options, please see below.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/my-account" passHref> 
              <Button className="w-full sm:w-auto font-body bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleNavigation}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Try Again
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
