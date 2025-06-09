
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MOCK_AUTH_USERNAME_KEY, MOCK_AUTH_LOGGED_IN_KEY, MOCK_AUTH_EMAIL_KEY, type MockAuthSession } from '@/types/auth';
import { UserCircle, LogOut, ShieldAlert, Mail } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

      if (isLoggedIn && storedUsername) {
        setSession({ isLoggedIn: true, username: storedUsername, email: storedEmail });
      } else {
        setSession({ isLoggedIn: false, username: null, email: null });
      }
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_AUTH_USERNAME_KEY);
      localStorage.removeItem(MOCK_AUTH_EMAIL_KEY); // Clear email on logout
      localStorage.removeItem(MOCK_AUTH_LOGGED_IN_KEY);
    }
    setSession({ isLoggedIn: false, username: null, email: null });
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    window.dispatchEvent(new Event('storage'));
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
              This account system is for demonstration purposes and uses browser local storage.
              It is not secure for real applications. Your "User Name" is: <strong>{session.username}</strong>.
              {session.email && <> Your "Email" is: <strong>{session.email}</strong>.</>}
            </AlertDescription>
          </Alert>
          
          {session.email && (
            <div className="flex items-center justify-center text-sm text-muted-foreground font-body">
                <Mail className="h-4 w-4 mr-2 text-primary" />
                Registered Email: {session.email}
            </div>
          )}
          
          <div className="text-center">
            <p className="text-muted-foreground font-body">
              More account settings and features would appear here in a full application.
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
