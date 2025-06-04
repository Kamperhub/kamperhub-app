
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import { AuthGuard } from '@/components/layout/AuthGuard'; // Import AuthGuard

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
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SubscriptionProvider>
          <AuthProvider>
            <AuthGuard> {/* AuthGuard wraps AppShell and children */}
              <AppShell>
                {children}
              </AppShell>
            </AuthGuard>
          </AuthProvider>
        </SubscriptionProvider>
        <Toaster />
      </body>
    </html>
  );
}
