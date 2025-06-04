
"use client"; 

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { InventoryList } from '@/components/features/inventory/InventoryList';
import type { StoredCaravan } from '@/types/caravan'; 
import { CARAVANS_STORAGE_KEY, ACTIVE_CARAVAN_ID_KEY } from '@/types/caravan';
import type { StoredVehicle } from '@/types/vehicle';
import { VEHICLES_STORAGE_KEY, ACTIVE_VEHICLE_ID_KEY as ACTIVE_TOW_VEHICLE_ID_KEY } from '@/types/vehicle';
import type { CaravanWeightData } from '@/types/inventory';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { AlertTriangle, Settings, Loader2, Car, Home } from 'lucide-react'; // Added Car and Home icons

const defaultCaravanSpecs: CaravanWeightData = {
  tareMass: 0,
  atm: 0,
  gtm: 0,
  maxTowballDownload: 0,
};

export default function InventoryPage() {
  const [caravanSpecs, setCaravanSpecs] = useState<CaravanWeightData | null>(null);
  const [activeCaravanName, setActiveCaravanName] = useState<string | null>(null);
  const [activeVehicleName, setActiveVehicleName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLocalStorageReady(true); 
  }, []);

  useEffect(() => {
    if (isLocalStorageReady && typeof window !== 'undefined') {
      setIsLoading(true);
      setError(null);
      setActiveCaravanName(null);
      setActiveVehicleName(null);

      try {
        // Load Active Caravan
        const activeCaravanId = localStorage.getItem(ACTIVE_CARAVAN_ID_KEY);
        const storedCaravansJson = localStorage.getItem(CARAVANS_STORAGE_KEY);

        if (activeCaravanId && storedCaravansJson) {
          const storedCaravans: StoredCaravan[] = JSON.parse(storedCaravansJson);
          const activeCaravan = storedCaravans.find(c => c.id === activeCaravanId);

          if (activeCaravan) {
            setCaravanSpecs({
              tareMass: activeCaravan.tareMass,
              atm: activeCaravan.atm,
              gtm: activeCaravan.gtm,
              maxTowballDownload: activeCaravan.maxTowballDownload,
            });
            setActiveCaravanName(`${activeCaravan.year} ${activeCaravan.make} ${activeCaravan.model}`);
          } else {
            setError("Active caravan data not found. Please re-select an active caravan in 'Vehicles'.");
            setCaravanSpecs(defaultCaravanSpecs); 
          }
        } else {
          setCaravanSpecs(null); // Trigger "Active Caravan Recommended"
        }

        // Load Active Tow Vehicle
        const activeVehicleId = localStorage.getItem(ACTIVE_TOW_VEHICLE_ID_KEY);
        const storedVehiclesJson = localStorage.getItem(VEHICLES_STORAGE_KEY);

        if (activeVehicleId && storedVehiclesJson) {
          const storedVehicles: StoredVehicle[] = JSON.parse(storedVehiclesJson);
          const activeVehicle = storedVehicles.find(v => v.id === activeVehicleId);
          if (activeVehicle) {
            setActiveVehicleName(`${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`);
          }
          // No error if vehicle not found, it's just for display here
        }

      } catch (e) {
        console.error("Error loading active data for Inventory:", e);
        setError("Could not load vehicle/caravan data. Please try again.");
        setCaravanSpecs(defaultCaravanSpecs); 
      } finally {
        setIsLoading(false);
      }
    }
  }, [isLocalStorageReady, pathname]);

  const getDescriptiveText = () => {
    let text = "Track your caravan's load, manage items, and stay compliant with weight limits.";
    if (activeCaravanName && activeVehicleName) {
      text += ` Using specifications from your active ${activeCaravanName}, towed by your ${activeVehicleName}.`;
    } else if (activeCaravanName) {
      text += ` Using specifications from your active ${activeCaravanName}. Consider selecting an active tow vehicle in 'Vehicles'.`;
    } else if (activeVehicleName) {
      text += ` Current tow vehicle: ${activeVehicleName}. Please set an active caravan in 'Vehicles' for accurate calculations. Current calculations use default zero values.`;
    }
    else if (!activeCaravanName && caravanSpecs === null) {
       text += " Please set an active caravan in the 'Vehicles' section for accurate calculations. Current calculations use default zero values.";
    } else if (caravanSpecs && caravanSpecs.tareMass === 0 && !activeCaravanName) {
       text += " Please set an active caravan in the 'Vehicles' section for accurate calculations. Current calculations use default zero values.";
    }
    return text;
  };


  if (!isLocalStorageReady || isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary">Inventory & Weight Management</h1>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p className="font-body text-lg">Loading caravan specifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Inventory & Weight Management</h1>
        <p className="text-muted-foreground font-body mb-6">
          {getDescriptiveText()}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && (!caravanSpecs || caravanSpecs.tareMass === 0) && (
        <Alert variant="default" className="mb-6 bg-primary/10 border-primary/30">
          <Settings className="h-4 w-4 text-primary" />
          <AlertTitle className="font-headline text-primary">Active Caravan Recommended</AlertTitle>
          <AlertDescription className="font-body text-primary/80">
            For accurate weight calculations, please add a caravan and set it as active in the 'Vehicles' section.
            <Link href="/vehicles" passHref>
              <Button variant="link" className="p-0 h-auto ml-1 text-primary hover:underline font-body">Go to Vehicles</Button>
            </Link>
             Currently, weight calculations are based on default zero values.
          </AlertDescription>
        </Alert>
      )}

      {activeCaravanName && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Home className="h-4 w-4 text-secondary-foreground" />
            <AlertTitle className="font-headline text-secondary-foreground">Active Caravan: {activeCaravanName}</AlertTitle>
         </Alert>
      )}
      {activeVehicleName && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Car className="h-4 w-4 text-secondary-foreground" />
            <AlertTitle className="font-headline text-secondary-foreground">Active Tow Vehicle: {activeVehicleName}</AlertTitle>
         </Alert>
      )}
      
      <InventoryList caravanSpecs={caravanSpecs || defaultCaravanSpecs} />
    </div>
  );
}
