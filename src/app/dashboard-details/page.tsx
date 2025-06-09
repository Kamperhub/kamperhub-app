
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { dashboardDetailItems, type NavItem } from '@/lib/navigation'; // Using the specific items for this page

export default function DashboardDetailsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <LayoutDashboard className="mr-3 h-8 w-8 text-primary" />
        <h1 className="text-3xl font-headline text-primary">Dashboard Hub</h1>
      </div>
      <p className="font-body text-lg text-muted-foreground">
        Access your travel statistics and explore our upcoming rewards program.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboardDetailItems.map((item: NavItem) => (
          <Card key={item.href} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="font-headline text-xl text-primary flex items-center">
                <item.icon className="w-6 h-6 mr-3 text-primary" />
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <CardDescription className="font-body text-sm text-muted-foreground mb-4">
                {item.label === 'Travel Stats'
                  ? 'View your accumulated travel statistics, trip history insights, and milestones.'
                  : 'Discover how you can earn rewards, badges, and benefits with KamperHub.'}
              </CardDescription>
              <div
                className="h-32 w-full bg-muted/30 rounded-md flex items-center justify-center my-2 overflow-hidden"
                data-ai-hint={item.keywords || item.label.toLowerCase().split(' ')[0]}
              >
                <item.icon className="w-16 h-16 text-primary opacity-20" />
              </div>
              <Link href={item.href} asChild>
                <Button asChild variant="outline" className="w-full font-body text-primary hover:bg-primary/5 mt-auto">
                  {/* Wrap content in a span for better Slot compatibility when Button has asChild */}
                  <span>
                    Go to {item.label} <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
