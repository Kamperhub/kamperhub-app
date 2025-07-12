
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, ListTodo, CalendarPlus } from 'lucide-react';
import Image from 'next/image';
import { navItems } from '@/lib/navigation';

export default function LandingPage() {

  return (
    <div className="bg-background font-body">
      <main>
        {/* Hero Section */}
        <section className="text-center py-12 md:py-20 px-4">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/kamperhub-s4hc2.firebasestorage.app/o/KamperHub%20512x512.jpg?alt=media&token=00bf2acd-dbca-4cc2-984e-58461f67fdbd"
            alt="KamperHub Logo"
            width={120}
            height={120}
            className="mx-auto mb-6 rounded-2xl shadow-md"
            data-ai-hint="logo brand"
          />
          <h1 className="text-4xl md:text-6xl font-headline text-primary">
            Your Ultimate Travelling Companion
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            Plan, pack, and travel with confidence. KamperHub brings all your essential caravanning tools into one smart, easy-to-use app.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="font-headline text-lg">
              <Link href="/signup">Get Started for Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-headline text-lg">
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-20 bg-muted/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-headline text-primary">Everything You Need for the Road Ahead</h2>
              <p className="mt-2 text-lg text-muted-foreground">
                From weight management to trip planning, KamperHub is packed with features designed for every traveller.
              </p>
            </div>
            <div className="space-y-10">
              {navItems.filter(item => !['/my-account', '/contact', '/dashboard-details', '/chatbot'].includes(item.href)).map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.label} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-headline text-foreground">{feature.label}</h3>
                      <p className="text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        
        {/* Data Usage Transparency Section */}
        <section id="data-usage" className="py-12 md:py-20">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl md:text-4xl font-headline text-primary">Your Data, Your Control</h2>
                 <p className="mt-2 max-w-3xl mx-auto text-lg text-muted-foreground">We provide optional features that can connect to your Google account. Here’s why:</p>
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                     <div className="bg-card border p-6 rounded-lg shadow-sm text-left">
                         <h3 className="font-headline text-xl flex items-center"><ListTodo className="w-6 h-6 mr-2 text-primary" /> Google Tasks (Optional)</h3>
                         <p className="mt-2 text-muted-foreground">
                            You can choose to connect your Google Account to authorize KamperHub to create detailed packing checklists directly in your Google Tasks. This is an optional feature to help you manage your packing outside our app. We only request permission to create new tasks and do not read, store, or delete any of your existing tasks.
                         </p>
                     </div>
                     <div className="bg-card border p-6 rounded-lg shadow-sm text-left">
                         <h3 className="font-headline text-xl flex items-center"><CalendarPlus className="w-6 h-6 mr-2 text-primary" /> Google Calendar (Optional)</h3>
                         <p className="mt-2 text-muted-foreground">
                            The "Add to Calendar" feature for your trips works by generating a standard Google Calendar event link. Clicking this link opens Google Calendar in a new tab with pre-filled event details for you to save. This feature does not require you to grant KamperHub any special permissions and we do not access or store your calendar data.
                         </p>
                     </div>
                 </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto py-6 px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KamperHub. All Rights Reserved.</p>
          <Link href="/learn?tab=tos" className="text-sm hover:text-primary hover:underline">
              Privacy Policy & Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
