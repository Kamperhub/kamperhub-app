// src/app/(protected)/dashboard-details/page.tsx
"use client";

import { useContext } from 'react';
import Link from 'next/link';
import { dashboardDetailItems } from '@/lib/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NavigationContext } from '@/components/layout/AppShell';

export default function DashboardDetailsPage() {
  const navContext = useContext(NavigationContext);

  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  return (
    <div className="space-y-8">
      <Button asChild variant="link" className="p-0 h-auto font-body text-muted-foreground hover:text-primary -ml-1">
        <Link href="/dashboard" onClick={handleNavigation}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Return to Main Dashboard
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary">Adventure Hub</h1>
        <p className="text-muted-foreground font-body">
          Explore your travel stats, manage important documents, and check your loyalty rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardDetailItems.map((item) => (
          <Link key={item.href} href={item.href} passHref onClick={handleNavigation}>
            <Card className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col group">
              <CardHeader>
                <div className="flex items-center mb-2">
                  <div className="p-3 rounded-full bg-primary/10 mr-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-headline text-xl text-primary">{item.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="font-body text-base text-muted-foreground">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
