
"use client";

import { useEffect } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/components/layout/Providers';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Alegreya, Belleza, Source_Code_Pro } from 'next/font/google';
import { initializeFirebaseAppCheck } from '@/lib/firebase';

const belleza = Belleza({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-headline',
  display: 'swap',
});

const alegreya = Alegreya({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-code',
  display: 'swap',
});

// Metadata can still be exported from a client component in the root layout
export const metadata: Metadata = {
  title: 'KamperHub',
  description: 'Your ultimate caravanning companion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Initialize Firebase App Check once the component has mounted on the client.
    // This is the correct place for global client-side initialization.
    initializeAppCheck();
  }, []);

  return (
    <html lang="en" className={`${belleza.variable} ${alegreya.variable} ${sourceCodePro.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
          </Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
