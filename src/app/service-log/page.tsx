"use client";

import { Wrench, Fuel } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FuelLogClient } from '@/components/features/service/FuelLogClient';
import { MaintenanceLogClient } from '@/components/features/service/MaintenanceLogClient';


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
