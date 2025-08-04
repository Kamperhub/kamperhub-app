
"use client";

import React, { useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, UserCircle, LogIn, LogOut, MessageSquare, Loader2, AlertTriangle, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { NavigationContext } from '@/components/layout/AppShell';

const EnvironmentBanner = () => {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;

  if (appEnv === 'production') {
    return (
      <div className="bg-green-600 text-white text-center text-xs font-bold py-1">
        Production Mode
      </div>
    );
  }

  if (appEnv === 'development') {
     return (
      <div className="bg-yellow-500 text-black text-center text-xs font-bold py-1 flex items-center justify-center">
        <AlertTriangle className="h-3 w-3 mr-1.5" />
        Development Mode
      </div>
    );
  }

  return null;
};


export function Header() {
  const { user, userProfile, isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const navContext = useContext(NavigationContext);

  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login'); 
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const homeLink = user ? "/dashboard" : "/";

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
       <EnvironmentBanner />
      <div className="container mx-auto px-4 py-3 flex items-center justify-between h-[68px]">
        <Link href={homeLink} className="flex items-center" onClick={handleNavigation}>
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/kamperhub-s4hc2.firebasestorage.app/o/KamperHubMedia%2FKamperHub%20logo%20180x60.png?alt=media&token=0ba20d31-3733-4453-aaad-639a5babe95c"
            alt="KamperHub Banner Logo"
            width={160}
            height={40}
            priority
            className="object-contain"
            data-ai-hint="logo brand banner"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <Link href="/dashboard" passHref>
              <Button variant="ghost" size="icon" aria-label="Go to Dashboard" className="p-0 hover:bg-primary/80" onClick={handleNavigation}>
                <LayoutDashboard className="h-7 w-7" />
              </Button>
            </Link>
          )}

          <Link href="/chatbot" passHref>
            <Button variant="ghost" size="icon" aria-label="AI Chatbot" className="p-0 hover:bg-primary/80" onClick={handleNavigation}>
              <MessageSquare className="h-6 w-6" />
            </Button>
          </Link>

          {isAuthLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : user ? (
            <>
              <Link href="/my-account" passHref>
                <Button variant="ghost" className="p-0 sm:px-3 sm:py-2 hover:bg-primary/80 flex items-center max-w-[150px] sm:max-w-[200px]" onClick={handleNavigation}>
                  <UserCircle className="h-6 w-6 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline font-body text-sm truncate">{userProfile?.displayName || user.displayName || user.email}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log Out" className="p-0 hover:bg-primary/80">
                <LogOut className="h-6 w-6" />
              </Button>
            </>
          ) : (
            <Link href="/login" passHref>
              <Button variant="ghost" className="p-0 sm:px-3 sm:py-2 hover:bg-primary/80 flex items-center" onClick={handleNavigation}>
                <LogIn className="h-6 w-6 sm:mr-2" />
                <span className="hidden sm:inline font-body text-sm">Log In / Sign Up</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
