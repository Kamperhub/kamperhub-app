
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from "@/components/ui/toaster";
import { SubscriptionProvider } from '@/hooks/useSubscription';
import { QueryProvider } from '@/components/layout/QueryProvider';
import { AuthProvider } from '@/hooks/useAuth';
import { APIProvider } from '@vis.gl/react-google-maps';

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
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <QueryProvider>
          <APIProvider 
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "MISSING_API_KEY"} 
            solutionChannel="GMP_visgl_rgm_reactfirebase_v1"
            libraries={['places', 'routes', 'geometry']}
          >
            <AuthProvider>
              <SubscriptionProvider>
                <AppShell>
                  {children}
                </AppShell>
              </SubscriptionProvider>
            </AuthProvider>
          </APIProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
