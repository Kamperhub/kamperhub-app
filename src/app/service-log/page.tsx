// This file was intentionally left blank.
// The "Service & Fuel Log" feature has been removed to restore application stability.
// Re-implementing now...
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Fuel, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const FuelLogLoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-40 w-full" />
  </div>
);

const FuelLogClient = dynamic(
  () => import('@/components/features/service/FuelLogClient').then((mod) => mod.FuelLogClient),
  { ssr: false, loading: () => <FuelLogLoadingSkeleton /> }
);

const MaintenanceLogClient = dynamic(
  () => import('@/components/features/service/MaintenanceLogClient').then((mod) => mod.MaintenanceLogClient),
  { ssr: false, loading: () => <FuelLogLoadingSkeleton /> } // Can reuse same skeleton
);


export default function ServiceLogPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline mb-2 text-primary">Service & Fuel Log</h1>
      <p className="text-muted-foreground font-body">
        Keep a detailed history of your fuel consumption and maintenance tasks for all your vehicles.
      </p>

      <Tabs defaultValue="fuel" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fuel" className="font-body text-base">
            <Fuel className="mr-2 h-5 w-5" /> Fuel Log
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="font-body text-base">
            <Wrench className="mr-2 h-5 w-5" /> Maintenance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fuel" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Log</CardTitle>
              <CardDescription>Track every fill-up to monitor consumption and costs.</CardDescription>
            </CardHeader>
            <CardContent>
                <FuelLogClient />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="maintenance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Log</CardTitle>
              <CardDescription>Record all service and repair tasks to maintain your vehicle's history.</CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceLogClient />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
