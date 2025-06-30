
"use client";

import { Wrench, Fuel } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ServiceLogSkeleton = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-40 w-full rounded-lg" />
    </div>
);

const FuelLogClient = dynamic(
  () => import('@/components/features/service/FuelLogClient').then(mod => mod.FuelLogClient),
  { 
    ssr: false,
    loading: () => <ServiceLogSkeleton />
  }
);

const MaintenanceLogClient = dynamic(
  () => import('@/components/features/service/MaintenanceLogClient').then(mod => mod.MaintenanceLogClient),
  { 
    ssr: false,
    loading: () => <ServiceLogSkeleton />
  }
);


export default function ServiceLogPage() {
  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-headline mb-2 text-primary flex items-center">
          <Wrench className="mr-3 h-8 w-8" /> Service &amp; Fuel Log
        </h1>
        <p className="text-muted-foreground font-body mb-6">
          Track fuel consumption for your vehicles and manage maintenance schedules for all your assets.
        </p>
      </div>

       <Tabs defaultValue="maintenance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="maintenance" className="font-body"><Wrench className="mr-2 h-4 w-4"/>Maintenance Log</TabsTrigger>
            <TabsTrigger value="fuel" className="font-body"><Fuel className="mr-2 h-4 w-4"/>Fuel Log</TabsTrigger>
        </TabsList>
        <TabsContent value="maintenance" className="mt-6">
            <MaintenanceLogClient />
        </TabsContent>
        <TabsContent value="fuel" className="mt-6">
            <FuelLogClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
