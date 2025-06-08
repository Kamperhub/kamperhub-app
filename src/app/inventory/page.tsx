
"use client"; 

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { InventoryList } from '@/components/features/inventory/InventoryList';
import type { StoredCaravan } from '@/types/caravan'; 
import { CARAVANS_STORAGE_KEY, ACTIVE_CARAVAN_ID_KEY } from '@/types/caravan';
import type { StoredVehicle } from '@/types/vehicle';
import { VEHICLES_STORAGE_KEY, ACTIVE_VEHICLE_ID_KEY as ACTIVE_TOW_VEHICLE_ID_KEY } from '@/types/vehicle';
import type { CaravanWeightData, InventoryItem, CaravanInventories } from '@/types/inventory';
import { INVENTORY_STORAGE_KEY } from '@/types/inventory';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { AlertTriangle, Settings, Loader2, Car, Home, Backpack } from 'lucide-react'; 

const defaultCaravanSpecs: CaravanWeightData = {
  tareMass: 0,
  atm: 0,
  gtm: 0,
  maxTowballDownload: 0,
  numberOfAxles: 1, // Added default for numberOfAxles
  make: undefined, // Optional make for display
  model: undefined, // Optional model for display
};

const defaultVehicleSpecs: StoredVehicle = {
  id: '',
  make: '',
  model: '',
  year: 0,
  gvm: 0,
  gcm: 0,
  maxTowCapacity: 0,
  maxTowballMass: 0,
  fuelEfficiency: 0,
  kerbWeight: 0,
  frontAxleLimit: 0,
  rearAxleLimit: 0,
};

export default function InventoryPage() {
  const [caravanSpecs, setCaravanSpecs] = useState<CaravanWeightData | null>(null);
  const [activeCaravanName, setActiveCaravanName] = useState<string | null>(null);
  const [activeVehicleSpecs, setActiveVehicleSpecs] = useState<StoredVehicle | null>(null);
  const [activeCaravanId, setActiveCaravanId] = useState<string | null>(null);
  const [currentCaravanInventory, setCurrentCaravanInventory] = useState<InventoryItem[]>([]);
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
      setActiveVehicleSpecs(null);
      setActiveCaravanId(null);
      setCurrentCaravanInventory([]);

      try {
        const currentActiveCaravanId = localStorage.getItem(ACTIVE_CARAVAN_ID_KEY);
        setActiveCaravanId(currentActiveCaravanId);

        // Load Active Caravan Specs
        const storedCaravansJson = localStorage.getItem(CARAVANS_STORAGE_KEY);
        if (currentActiveCaravanId && storedCaravansJson) {
          const storedCaravans: StoredCaravan[] = JSON.parse(storedCaravansJson);
          const activeCaravan = storedCaravans.find(c => c.id === currentActiveCaravanId);

          if (activeCaravan) {
            setCaravanSpecs({
              tareMass: activeCaravan.tareMass,
              atm: activeCaravan.atm,
              gtm: activeCaravan.gtm,
              maxTowballDownload: activeCaravan.maxTowballDownload,
              numberOfAxles: activeCaravan.numberOfAxles, // Load numberOfAxles
              make: activeCaravan.make, // Store make for display
              model: activeCaravan.model, // Store model for display
            });
            setActiveCaravanName(`${activeCaravan.year} ${activeCaravan.make} ${activeCaravan.model}`);
            
            const allInventoriesJson = localStorage.getItem(INVENTORY_STORAGE_KEY);
            if (allInventoriesJson) {
              const allInventories: CaravanInventories = JSON.parse(allInventoriesJson);
              setCurrentCaravanInventory(allInventories[currentActiveCaravanId] || []);
            } else {
              setCurrentCaravanInventory([]);
            }
          } else {
            setError("Active caravan data not found. Please re-select an active caravan in 'Vehicles'.");
            setCaravanSpecs(defaultCaravanSpecs); 
            setCurrentCaravanInventory([]);
          }
        } else {
          setCaravanSpecs(null); 
          setCurrentCaravanInventory([]);
        }

        // Load Active Tow Vehicle Specs
        const activeVehicleId = localStorage.getItem(ACTIVE_TOW_VEHICLE_ID_KEY);
        const storedVehiclesJson = localStorage.getItem(VEHICLES_STORAGE_KEY);
        if (activeVehicleId && storedVehiclesJson) {
          const storedVehicles: StoredVehicle[] = JSON.parse(storedVehiclesJson);
          const activeVehicle = storedVehicles.find(v => v.id === activeVehicleId);
          if (activeVehicle) {
            setActiveVehicleSpecs(activeVehicle);
          } else {
            setActiveVehicleSpecs(defaultVehicleSpecs); 
          }
        } else {
          setActiveVehicleSpecs(null);
        }

      } catch (e) {
        console.error("Error loading active data for Inventory:", e);
        setError("Could not load vehicle/caravan data or inventory. Please try again.");
        setCaravanSpecs(defaultCaravanSpecs); 
        setActiveVehicleSpecs(defaultVehicleSpecs);
        setCurrentCaravanInventory([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isLocalStorageReady, pathname]);

  const getDescriptiveText = () => {
    let text = "Track your caravan's load, manage items, and stay compliant with weight limits. Calculations consider both active caravan and tow vehicle specifications if selected.";
    if (activeCaravanName && activeVehicleSpecs && activeVehicleSpecs.make) {
      text += ` Using specs for your ${activeCaravanName} towed by ${activeVehicleSpecs.year} ${activeVehicleSpecs.make} ${activeVehicleSpecs.model}.`;
    } else if (activeCaravanName) {
      text += ` Using specs for your ${activeCaravanName}. Select an active tow vehicle in 'Vehicles' for full compliance checks.`;
    } else if (activeVehicleSpecs && activeVehicleSpecs.make) {
      text += ` Current tow vehicle: ${activeVehicleSpecs.year} ${activeVehicleSpecs.make} ${activeVehicleSpecs.model}. Set an active caravan for accurate calculations.`;
    } else {
       text += " Please set an active caravan and tow vehicle in 'Vehicles' for accurate weight management. Current calculations use default zero values.";
    }
    return text;
  };


  if (!isLocalStorageReady || isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-foreground flex items-center">
          <Backpack className="mr-3 h-8 w-8" /> Inventory & Weight Management
        </h1>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-foreground mr-3" />
          <p className="font-body text-lg">Loading caravan specifications &amp; inventory...</p>
        </div>
      </div>
    );
  }

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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && (!caravanSpecs || caravanSpecs.tareMass === 0 || !activeCaravanId) && (
        <Alert variant="default" className="mb-6 bg-muted border-border">
          <Settings className="h-4 w-4 text-foreground" />
          <AlertTitle className="font-headline text-foreground">Active Caravan Required</AlertTitle>
          <AlertDescription className="font-body text-muted-foreground">
            Please add a caravan and set it as active in the 'Vehicles' section to manage its inventory and see accurate weight calculations.
            <Link href="/vehicles" passHref>
              <Button variant="link" className="p-0 h-auto ml-1 text-foreground hover:underline font-body">Go to Vehicles</Button>
            </Link>
             Currently, weight calculations use default zero values.
          </AlertDescription>
        </Alert>
      )}
       {!error && (!activeVehicleSpecs || !activeVehicleSpecs.make) && (
        <Alert variant="default" className="mb-6 bg-muted border-border">
          <Settings className="h-4 w-4 text-foreground" />
          <AlertTitle className="font-headline text-foreground">Active Tow Vehicle Recommended</AlertTitle>
          <AlertDescription className="font-body text-muted-foreground">
            For full towing compliance checks (like Max Towing Capacity and GCM advisory), please add a tow vehicle and set it as active in 'Vehicles'.
            <Link href="/vehicles" passHref>
              <Button variant="link" className="p-0 h-auto ml-1 text-foreground hover:underline font-body">Go to Vehicles</Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {activeCaravanName && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Home className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active Caravan: {activeCaravanName}</AlertTitle>
         </Alert>
      )}
      {activeVehicleSpecs && activeVehicleSpecs.make && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Car className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active Tow Vehicle: {activeVehicleSpecs.year} {activeVehicleSpecs.make} {activeVehicleSpecs.model}</AlertTitle>
         </Alert>
      )}
      
      <InventoryList 
        caravanSpecs={caravanSpecs || defaultCaravanSpecs}
        activeTowVehicleSpecs={activeVehicleSpecs || defaultVehicleSpecs}
        initialCaravanInventory={currentCaravanInventory}
        activeCaravanId={activeCaravanId}
      />
    </div>
  );
}
