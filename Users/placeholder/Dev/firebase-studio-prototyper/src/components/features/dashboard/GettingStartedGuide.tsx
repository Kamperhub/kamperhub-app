
"use client";

import { useContext } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Settings, Backpack, Route as RouteIcon, ChevronRight } from 'lucide-react';
import { NavigationContext } from '@/components/layout/AppShell';

const guideSteps = [
  {
    step: 1,
    title: "Set Up Your Rig",
    description: "This is the most important first step. Add your tow vehicle and caravan details to unlock weight management and accurate trip planning.",
    buttonText: "Go to Vehicle Setup",
    href: "/vehicles",
    icon: Settings,
  },
  {
    step: 2,
    title: "Manage Your Inventory",
    description: "Once your rig is set up, track all your items, manage their weights, and stay compliant with your vehicle's limits.",
    buttonText: "Go to Inventory & Weight",
    href: "/inventory",
    icon: Backpack,
  },
  {
    step: 3,
    title: "Plan Your First Trip",
    description: "With everything configured, you're ready to plan your first adventure! Calculate routes, set budgets, and track expenses.",
    buttonText: "Go to Trip Planner",
    href: "/trip-expense-planner",
    icon: RouteIcon,
  },
];

export function GettingStartedGuide() {
  const navContext = useContext(NavigationContext);

  const handleNavigation = () => {
    if (navContext) {
      navContext.setIsNavigating(true);
    }
  };

  return (
    <Card className="w-full shadow-lg border-accent">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary flex items-center">
          <Rocket className="mr-3 h-6 w-6 text-accent" />
          Welcome! Let's Get Started.
        </CardTitle>
        <CardDescription className="font-body">
          Follow these steps to set up the app for your adventures.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {guideSteps.map(({ step, title, description, buttonText, href, icon: Icon }) => (
          <div key={step} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border bg-muted/30">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground">
              <span className="font-headline text-xl">{step}</span>
            </div>
            <div className="flex-grow">
              <h3 className="font-headline text-lg text-foreground">{title}</h3>
              <p className="font-body text-sm text-muted-foreground">{description}</p>
            </div>
            <Button asChild onClick={handleNavigation} className="w-full sm:w-auto flex-shrink-0 bg-accent hover:bg-accent/80">
              <Link href={href}>
                <Icon className="mr-2 h-4 w-4" />
                {buttonText}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
