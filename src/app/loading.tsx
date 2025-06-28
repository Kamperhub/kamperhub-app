
"use client";
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
      <p className="text-lg font-semibold text-primary">Loading...</p>
    </div>
  );
}
