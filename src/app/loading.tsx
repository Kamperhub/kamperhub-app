"use client";
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function Loading() {
  useEffect(() => {
    console.log('Global loading.tsx: MOUNTED - Preparing your next view...');
    return () => {
      console.log('Global loading.tsx: UNMOUNTED - View ready!');
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-12 w-12 animate-spin text-accent mb-6" />
      <p className="text-xl font-headline text-accent font-bold">Loading Your Adventure...</p>
      <p className="text-sm font-body text-muted-foreground mt-2">Please wait a moment.</p>
    </div>
  );
}
