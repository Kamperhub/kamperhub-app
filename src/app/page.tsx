
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { navItems } from '@/lib/navigation';

export default function LandingPage() {

  // Filter for the features to be displayed on the landing page, excluding meta-pages
  const featuresToDisplay = navItems.filter(item => 
    !['/my-account', '/contact', '/dashboard-details', '/trip-manager', '/learn'].includes(item.href)
  );

  return (
    <div className="bg-background font-body">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-10">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/kamperhub-s4hc2.firebasestorage.app/o/KamperHub%20512x512.jpg?alt=media&token=00bf2acd-dbca-4cc2-984e-58461f67fdbd"
            alt="KamperHub Logo"
            width={120}
            height={120}
            className="mx-auto mb-6 rounded-2xl shadow-sm"
            data-ai-hint="logo brand"
            priority
          />
          <h1 className="text-4xl md:text-5xl font-headline text-primary">
            Your Ultimate Travelling Companion
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Plan, pack, and travel with confidence. KamperHub brings all your essential caravanning tools into one smart, easy-to-use app.
          </p>
          <div className="mt-6 flex justify-center gap-6">
            <Link href="/signup" className="text-lg font-medium text-primary hover:underline underline-offset-4">
              Get Started for Free
            </Link>
            <Link href="/login" className="text-lg font-medium text-primary hover:underline underline-offset-4">
              Log In
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-headline text-primary">Everything You Need for the Road Ahead</h2>
            <p className="mt-2 max-w-3xl mx-auto text-lg text-muted-foreground">
              From weight management to trip planning, KamperHub is packed with features designed for every traveller.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-12">
            {featuresToDisplay.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="flex flex-col items-center text-center">
                  <Icon className="h-10 w-10 text-primary mb-3" />
                  <h3 className="text-2xl font-headline text-foreground">{feature.label}</h3>
                  <p className="text-muted-foreground mt-1 text-base max-w-md">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
