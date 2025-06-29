
"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, UserCircle, LogIn, LogOut, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between h-[68px]">
        <Link href="/" className="flex items-center">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/kamperhub-s4hc2.firebasestorage.app/o/Kamper%20Social%20Media%20Banner.jpg?alt=media&token=1050fb50-5c13-4f03-8cad-d80954cf9072"
            alt="KamperHub Banner Logo"
            width={160}
            height={40}
            priority
            className="object-contain"
            data-ai-hint="logo brand banner"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" aria-label="Go to Homepage" className="p-0 hover:bg-primary/80">
              <Home className="h-7 w-7" />
            </Button>
          </Link>

          <Link href="/chatbot" passHref>
            <Button variant="ghost" size="icon" aria-label="AI Chatbot" className="p-0 hover:bg-primary/80">
              <MessageSquare className="h-6 w-6" />
            </Button>
          </Link>

          {isAuthLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : user ? (
            <>
              <Link href="/my-account" passHref>
                <Button variant="ghost" className="p-0 sm:px-3 sm:py-2 hover:bg-primary/80 flex items-center max-w-[150px] sm:max-w-[200px]">
                  <UserCircle className="h-6 w-6 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline font-body text-sm truncate">{user.displayName || user.email}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log Out" className="p-0 hover:bg-primary/80">
                <LogOut className="h-6 w-6" />
              </Button>
            </>
          ) : (
            <Link href="/login" passHref>
              <Button variant="ghost" className="p-0 sm:px-3 sm:py-2 hover:bg-primary/80 flex items-center">
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
