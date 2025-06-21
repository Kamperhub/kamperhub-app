
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { QueryProvider } from '@/components/layout/QueryProvider';

export const metadata: Metadata = {
  title: 'KamperHub',
  description: 'Your ultimate caravanning companion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* New Font Imports: Merriweather and Roboto */}
        <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        {/* Kept Source Code Pro for code blocks */}
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <QueryProvider>
          <SubscriptionProvider>
            <AppShell>
              {children}
            </AppShell>
          </SubscriptionProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
