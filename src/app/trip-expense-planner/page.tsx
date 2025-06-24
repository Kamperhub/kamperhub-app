
"use client"; 

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Map, Edit, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TripPlannerLoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="md:col-span-1">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
    <div className="md:col-span-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-[400px] w-full rounded-b-lg" />
        </CardContent>
      </Card>
    </div>
  </div>
);

const TripPlannerClient = dynamic(
  () => import('@/components/features/tripplanner/TripPlannerClient').then(mod => mod.TripPlannerClient),
  {
    ssr: false,
    loading: () => <TripPlannerLoadingSkeleton />,
  }
);


export default function TripExpensePlannerPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-2 text-primary">Trip & Expense Planner</h1>
        <p className="text-muted-foreground font-body mb-6">
          Plan your itinerary, set budgets, and track expenses for your next adventure.
        </p>
      </div>
      
      {apiKey ? (
         <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="itinerary" className="font-body"><Map className="mr-2 h-4 w-4"/>Itinerary</TabsTrigger>
            <TabsTrigger value="budget" className="font-body"><Edit className="mr-2 h-4 w-4"/>Budget</TabsTrigger>
            <TabsTrigger value="expenses" className="font-body"><DollarSign className="mr-2 h-4 w-4"/>Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="itinerary" className="mt-6">
            <TripPlannerClient />
          </TabsContent>
          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle>Budget Setup</CardTitle>
                <CardDescription>Define categories and allocate funds for your trip.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-body">Budgeting tools and category management will be implemented here soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="expenses">
             <Card>
              <CardHeader>
                <CardTitle>Expense Tracking</CardTitle>
                <CardDescription>Log your spending as you go and compare it against your budget.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-body">The expense ledger and tracking visualizations will be implemented here soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-headline">Google Maps API Key Missing</AlertTitle>
          <AlertDescription className="font-body">
            The Trip Planner requires a Google Maps API key to function. Please configure it in your environment variables (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
            Without it, map and routing features will be unavailable.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
