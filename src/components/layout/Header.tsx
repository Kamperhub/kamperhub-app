
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// Image import removed as it's no longer used
import { Home, UserCircle, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_AUTH_USERNAME_KEY, MOCK_AUTH_LOGGED_IN_KEY, MOCK_AUTH_EMAIL_KEY } from '@/types/auth'; 
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const updateAuthState = () => {
    if (typeof window !== 'undefined') {
      const loggedInStatus = localStorage.getItem(MOCK_AUTH_LOGGED_IN_KEY) === 'true';
      const storedUsername = localStorage.getItem(MOCK_AUTH_USERNAME_KEY);
      setIsLoggedIn(loggedInStatus);
      setUsername(loggedInStatus ? storedUsername : null);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    updateAuthState(); 

    const handleStorageChange = () => {
      updateAuthState();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_AUTH_USERNAME_KEY);
      localStorage.removeItem(MOCK_AUTH_EMAIL_KEY); 
      localStorage.removeItem(MOCK_AUTH_LOGGED_IN_KEY);
    }
    setIsLoggedIn(false);
    setUsername(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/'); 
    router.refresh(); 
  };

  if (!hasMounted) {
    return (
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Placeholder for logo area if needed, or can be removed if brand name is sufficient */}
          <Link href="/" className="flex items-center gap-3 text-xl font-bold font-headline">
             KamperHub
          </Link>
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
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo removed, displaying text link instead */}
        <Link href="/" className="flex items-center gap-3 text-xl font-bold font-headline">
          KamperHub
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" aria-label="Go to Homepage" className="p-0 hover:bg-primary/80">
              <Home className="h-7 w-7" />
            </Button>
          </Link>

          {isLoggedIn && username ? (
            <>
              <Link href="/my-account" passHref>
                <Button variant="ghost" className="p-0 sm:px-3 sm:py-2 hover:bg-primary/80 flex items-center">
                  <UserCircle className="h-6 w-6 sm:mr-2" />
                  <span className="hidden sm:inline font-body text-sm">{username}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log Out" className="p-0 hover:bg-primary/80">
                <LogOut className="h-6 w-6" />
              </Button>
            </>
          ) : (
            <Link href="/signup" passHref>
              <Button variant="ghost" className="p-0 sm:px-3 sm:py-2 hover:bg-primary/80 flex items-center">
                <LogIn className="h-6 w-6 sm:mr-2" />
                <span className="hidden sm:inline font-body text-sm">Sign Up / Log In</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
