// src/app/(public)/subscribe/success/page.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Home, Rocket } from 'lucide-react';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export default function SubscriptionSuccessPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Invalidate user data to refetch the new subscription status
  useEffect(() => {
    if (user) {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.uid] });
      queryClient.invalidateQueries({ queryKey: ['allVehicleData', user.uid] });
    }
  }, [user, queryClient]);


  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="font-headline text-3xl text-primary">
            Welcome to KamperHub Pro!
          </CardTitle>
          <CardDescription className="font-body text-lg text-muted-foreground pt-2">
            Your subscription is now active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="font-body text-foreground">
            Thank you for upgrading! You now have unlimited access to all features, including adding multiple vehicles and rigs. Your account details have been updated.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" passHref> 
              <Button className="w-full sm:w-auto font-body bg-primary text-primary-foreground hover:bg-primary/90">
                <Rocket className="mr-2 h-5 w-5" />
                Start Exploring
              </Button>
            </Link>
            <Link href="/my-account" passHref>
              <Button variant="outline" className="w-full sm:w-auto font-body">
                <Home className="mr-2 h-5 w-5" />
                Go to My Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
