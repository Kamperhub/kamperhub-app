
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, UserCircle, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
// Removed MOCK_AUTH keys as they are not primarily used for auth state anymore

export function Header() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Added isLoading state
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsLoggedIn(true);
      } else {
        setFirebaseUser(null);
        setIsLoggedIn(false);
      }
      setIsLoading(false); // Set loading to false after auth state is determined
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Firebase onAuthStateChanged will handle state updates (isLoggedIn, firebaseUser)
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/'); // Redirect to home page after logout
      // router.refresh(); // Often not needed if onAuthStateChanged handles UI updates correctly
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) { // Consistent loading state with fixed height
    return (
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between h-[68px]">
          <div className="h-[40px] w-[160px] bg-primary/50 rounded animate-pulse"></div>
          <div className="flex items-center gap-3">
             <div className="h-7 w-7 bg-primary/50 rounded-full animate-pulse"></div>
             <div className="h-7 w-20 bg-primary/50 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between h-[68px]">
        <Link href="/" className="flex items-center">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/kamperhub-s4hc2.firebasestorage.app/o/Kamper%20Social%20Media%20Banner.jpg?alt=media&token=1050fb50-5c13-4f03-8cad-d80954cf9072"
            alt="KamperHub Banner Logo"
            width={160} // Provided width
            height={40} // Provided height
            priority
            className="object-contain" // Ensures aspect ratio is maintained within bounds
            style={{ width: 'auto', height: '40px' }} // Or style={{ width: '160px', height: 'auto' }}
            data-ai-hint="logo brand banner"
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" aria-label="Go to Homepage" className="p-0 hover:bg-primary/80">
              <Home className="h-7 w-7" />
            </Button>
          </Link>

          {isLoggedIn && firebaseUser ? ( // Added firebaseUser check here for more safety
            <>
              <Link href="/my-account" passHref>
                <Button variant="ghost" className="p-0 sm:px-3 sm:py-2 hover:bg-primary/80 flex items-center">
                  <UserCircle className="h-6 w-6 sm:mr-2" />
                  <span className="hidden sm:inline font-body text-sm">{firebaseUser.displayName || firebaseUser.email}</span>
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
