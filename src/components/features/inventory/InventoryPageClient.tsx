
"use client"; 

import { useState, useMemo, useContext } from 'react';
import type { StoredCaravan } from '@/types/caravan'; 
import type { StoredVehicle } from '@/types/vehicle';
import type { UserProfile } from '@/types/auth';
import type { LoggedTrip } from '@/types/tripplanner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Settings, Car, HomeIcon, Link2 as Link2Icon, Backpack, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NavigationContext } from '@/components/layout/AppShell';

const InventoryList = dynamic(
  () => import('@/components/features/inventory/InventoryList').then(mod => mod.InventoryList),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    ),
  }
);

interface InventoryPageClientProps {
    initialData: {
        userProfile: Partial<UserProfile> | null;
        caravans: StoredCaravan[];
        vehicles: StoredVehicle[];
        trips: LoggedTrip[];
    }
}

export function InventoryPageClient({ initialData }: InventoryPageClientProps) {
  const navContext = useContext(NavigationContext);
  const [selectedTripId, setSelectedTripId] = useState<string>('none');

  const { userProfile: userPrefs, caravans: allCaravans, vehicles: allVehicles, trips: allTrips } = initialData;

  const activeCaravanId = userPrefs?.activeCaravanId;
  const activeVehicleId = userPrefs?.activeVehicleId;

  const activeCaravan = activeCaravanId ? allCaravans.find(c => c.id === activeCaravanId) : null;
  const activeVehicle = activeVehicleId ? allVehicles.find(v => v.id === activeVehicleId) : null;
  const activeWdh = activeCaravan?.wdh;
  
  const selectedTrip = useMemo(() => allTrips.find(trip => trip.id === selectedTripId), [allTrips, selectedTripId]);
  
  const handleNavigation = () => {
    navContext?.setIsNavigating(true);
  };

  const getDescriptiveText = () => {
    let text = "Track your caravan's load, manage items, and stay compliant with weight limits. Calculations consider active caravan, tow vehicle, and WDH specifications if selected. Water tank levels also contribute to the total weight.";
    if (activeCaravan && activeVehicle) {
      text += ` Using specs for your ${activeCaravan.year} ${activeCaravan.make} ${activeCaravan.model} towed by ${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}.`;
    } else if (activeCaravan) {
      text += ` Using specs for your ${activeCaravan.year} ${activeCaravan.make} ${activeCaravan.model}. Select an active tow vehicle in 'Vehicles' for full compliance checks.`;
    } else if (activeVehicle) {
       text += ` Current tow vehicle: ${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}. Set an active caravan for accurate calculations.`;
    } else {
       text += " Please set an active caravan and tow vehicle in 'Vehicles' for accurate weight management. Current calculations use default zero values.";
    }
    if (activeWdh) {
      text += ` Active WDH: ${activeWdh.name}.`;
    }
    return text;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-foreground flex items-center">
          <Backpack className="mr-3 h-8 w-8" /> Inventory & Weight Management
        </h1>
        <p className="text-muted-foreground font-body mb-6">
          {getDescriptiveText()}
        </p>
      </div>

      {!activeCaravan && (
        <Alert variant="default" className="mb-6 bg-muted border-border">
          <Settings className="h-4 w-4 text-foreground" />
          <AlertTitle className="font-headline text-foreground">Active Caravan Required</AlertTitle>
          <AlertDescription className="font-body text-muted-foreground">
            Please add a caravan and set it as active in the 'Vehicles' section to manage its inventory and see accurate weight calculations.
            <Link href="/vehicles" passHref onClick={handleNavigation}>
              <Button variant="link" className="p-0 h-auto ml-1 text-foreground hover:underline font-body">Go to Vehicles</Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}
      {!activeVehicle && (
        <Alert variant="default" className="mb-6 bg-muted border-border">
          <Settings className="h-4 w-4 text-foreground" />
          <AlertTitle className="font-headline text-foreground">Active Tow Vehicle Recommended</AlertTitle>
          <AlertDescription className="font-body text-muted-foreground">
            For full towing compliance checks, please add a tow vehicle and set it as active in 'Vehicles'.
            <Link href="/vehicles" passHref onClick={handleNavigation}>
              <Button variant="link" className="p-0 h-auto ml-1 text-foreground hover:underline font-body">Go to Vehicles</Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {activeCaravan && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <HomeIcon className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active Caravan: {activeCaravan.year} {activeCaravan.make} {activeCaravan.model}</AlertTitle>
         </Alert>
      )}
      {activeVehicle && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Car className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active Tow Vehicle: {activeVehicle.year} {activeVehicle.make} {activeVehicle.model}</AlertTitle>
         </Alert>
      )}
      {activeWdh && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Link2Icon className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active WDH: {activeWdh.name} ({activeWdh.type}, Max: {activeWdh.maxCapacityKg}kg)</AlertTitle>
         </Alert>
      )}

      <Card className="bg-muted/30">
          <CardHeader>
              <CardTitle className="font-headline flex items-center"><Users className="mr-2 h-5 w-5"/>Occupant Weight</CardTitle>
              <CardDescription>Select a trip to include occupant weights in the GVM calculation.</CardDescription>
          </CardHeader>
          <CardContent>
               <div className="max-w-sm">
                    <Label htmlFor="trip-occupants-select">Include Occupants from Trip</Label>
                    <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                        <SelectTrigger id="trip-occupants-select">
                            <SelectValue placeholder="Select a trip..."/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None (No Occupant Weight)</SelectItem>
                            {allTrips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
               </div>
          </CardContent>
      </Card>
      
      <InventoryList 
        activeCaravan={activeCaravan}
        activeVehicle={activeVehicle}
        wdh={activeWdh}
        userPreferences={userPrefs}
        occupants={selectedTrip?.occupants}
      />
    </div>
  );
}
