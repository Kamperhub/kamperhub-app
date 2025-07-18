
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { QueryProvider } from '@/components/layout/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';

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
        {/* New Font Imports: Belleza and Alegreya */}
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        {/* Kept Source Code Pro for code blocks */}
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <QueryProvider>
          <SubscriptionProvider>
            <AuthProvider>
              <AppShell>
                {children}
              </AppShell>
            </AuthProvider>
          </SubscriptionProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
