
import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from "@/components/ui/toaster";
import { Providers } from '@/components/layout/Providers';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Alegreya, Belleza, Source_Code_Pro } from 'next/font/google';

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
    <html lang="en" className={`${belleza.variable} ${alegreya.variable} ${sourceCodePro.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <AppShell>
              {children}
            </AppShell>
          </Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
