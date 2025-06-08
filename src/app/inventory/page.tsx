
"use client"; 

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { InventoryList } from '@/components/features/inventory/InventoryList';
import type { StoredCaravan, StorageLocation, WaterTank } from '@/types/caravan'; 
import { CARAVANS_STORAGE_KEY, ACTIVE_CARAVAN_ID_KEY, WATER_TANK_LEVELS_STORAGE_KEY_PREFIX } from '@/types/caravan';
import type { StoredVehicle, VehicleStorageLocation } from '@/types/vehicle';
import { VEHICLES_STORAGE_KEY, ACTIVE_VEHICLE_ID_KEY as ACTIVE_TOW_VEHICLE_ID_KEY } from '@/types/vehicle';
import type { StoredWDH } from '@/types/wdh';
import { WDHS_STORAGE_KEY, ACTIVE_WDH_ID_KEY } from '@/types/wdh';
import type { CaravanWeightData, InventoryItem, CaravanInventories } from '@/types/inventory';
import { INVENTORY_STORAGE_KEY } from '@/types/inventory';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { AlertTriangle, Settings, Loader2, Car, Home, Backpack, Link2 as Link2Icon } from 'lucide-react';

const defaultCaravanSpecs: CaravanWeightData = {
  tareMass: 0,
  atm: 0,
  gtm: 0,
  maxTowballDownload: 0,
  numberOfAxles: 1,
  make: undefined,
  model: undefined,
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

const defaultWdhSpecs: StoredWDH = {
  id: '',
  name: '',
  type: '',
  maxCapacityKg: 0,
  hasIntegratedSwayControl: false,
};

export default function InventoryPage() {
  const [activeCaravanFull, setActiveCaravanFull] = useState<StoredCaravan | null>(null);
  const [activeCaravanName, setActiveCaravanName] = useState<string | null>(null);
  const [activeVehicleSpecs, setActiveVehicleSpecs] = useState<StoredVehicle | null>(null);
  const [activeWdhSpecs, setActiveWdhSpecs] = useState<StoredWDH | null>(null);
  const [activeCaravanId, setActiveCaravanId] = useState<string | null>(null);
  const [currentCaravanInventory, setCurrentCaravanInventory] = useState<InventoryItem[]>([]);
  const [waterTankLevels, setWaterTankLevels] = useState<Record<string, number>>({});
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
      setActiveWdhSpecs(null);
      setActiveCaravanId(null);
      setCurrentCaravanInventory([]);
      setActiveCaravanFull(null);
      setWaterTankLevels({});

      try {
        const currentActiveCaravanId = localStorage.getItem(ACTIVE_CARAVAN_ID_KEY);
        setActiveCaravanId(currentActiveCaravanId);

        // Load Active Caravan Specs & Inventory
        const storedCaravansJson = localStorage.getItem(CARAVANS_STORAGE_KEY);
        if (currentActiveCaravanId && storedCaravansJson) {
          const storedCaravans: StoredCaravan[] = JSON.parse(storedCaravansJson);
          const activeCaravan = storedCaravans.find(c => c.id === currentActiveCaravanId);

          if (activeCaravan) {
            setActiveCaravanFull(activeCaravan);
            setActiveCaravanName(`${activeCaravan.year} ${activeCaravan.make} ${activeCaravan.model}`);
            
            const allInventoriesJson = localStorage.getItem(INVENTORY_STORAGE_KEY);
            if (allInventoriesJson) {
              const allInventories: CaravanInventories = JSON.parse(allInventoriesJson);
              setCurrentCaravanInventory(allInventories[currentActiveCaravanId] || []);
            } else {
              setCurrentCaravanInventory([]);
            }

            // Load water tank levels for this caravan
            const storedWaterLevelsJson = localStorage.getItem(`${WATER_TANK_LEVELS_STORAGE_KEY_PREFIX}${currentActiveCaravanId}`);
            if (storedWaterLevelsJson) {
              setWaterTankLevels(JSON.parse(storedWaterLevelsJson));
            } else {
              // Initialize levels to 0% if not found
              const initialLevels: Record<string, number> = {};
              (activeCaravan.waterTanks || []).forEach(tank => {
                initialLevels[tank.id] = 0;
              });
              setWaterTankLevels(initialLevels);
            }

          } else {
            setError("Active caravan data not found. Please re-select an active caravan in 'Vehicles'.");
            setActiveCaravanFull(null); 
            setCurrentCaravanInventory([]);
            setWaterTankLevels({});
          }
        } else {
          setActiveCaravanFull(null); 
          setCurrentCaravanInventory([]);
          setWaterTankLevels({});
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

        // Load Active WDH Specs
        const activeWdhId = localStorage.getItem(ACTIVE_WDH_ID_KEY);
        const storedWdhsJson = localStorage.getItem(WDHS_STORAGE_KEY);
        if (activeWdhId && storedWdhsJson) {
          const storedWdhs: StoredWDH[] = JSON.parse(storedWdhsJson);
          const activeWdh = storedWdhs.find(w => w.id === activeWdhId);
          if (activeWdh) {
            setActiveWdhSpecs(activeWdh);
          } else {
            setActiveWdhSpecs(defaultWdhSpecs);
          }
        } else {
          setActiveWdhSpecs(null);
        }

      } catch (e) {
        console.error("Error loading active data for Inventory:", e);
        setError("Could not load vehicle/caravan/WDH data or inventory. Please try again.");
        setActiveCaravanFull(null); 
        setActiveVehicleSpecs(defaultVehicleSpecs);
        setActiveWdhSpecs(defaultWdhSpecs);
        setCurrentCaravanInventory([]);
        setWaterTankLevels({});
      } finally {
        setIsLoading(false);
      }
    }
  }, [isLocalStorageReady, pathname]);

  const handleUpdateWaterTankLevel = useCallback((tankId: string, level: number) => {
    setWaterTankLevels(prevLevels => {
      const newLevels = { ...prevLevels, [tankId]: Math.max(0, Math.min(100, level)) };
      if (activeCaravanId && isLocalStorageReady && typeof window !== 'undefined') {
        localStorage.setItem(`${WATER_TANK_LEVELS_STORAGE_KEY_PREFIX}${activeCaravanId}`, JSON.stringify(newLevels));
      }
      return newLevels;
    });
  }, [activeCaravanId, isLocalStorageReady]);


  const getDescriptiveText = () => {
    let text = "Track your caravan's load, manage items, and stay compliant with weight limits. Calculations consider active caravan, tow vehicle, and WDH specifications if selected. Water tank levels also contribute to the total weight.";
    if (activeCaravanName && activeVehicleSpecs && activeVehicleSpecs.make) {
      text += ` Using specs for your ${activeCaravanName} towed by ${activeVehicleSpecs.year} ${activeVehicleSpecs.make} ${activeVehicleSpecs.model}.`;
    } else if (activeCaravanName) {
      text += ` Using specs for your ${activeCaravanName}. Select an active tow vehicle in 'Vehicles' for full compliance checks.`;
    } else if (activeVehicleSpecs && activeVehicleSpecs.make) {
      text += ` Current tow vehicle: ${activeVehicleSpecs.year} ${activeVehicleSpecs.make} ${activeVehicleSpecs.model}. Set an active caravan for accurate calculations.`;
    } else {
       text += " Please set an active caravan and tow vehicle in 'Vehicles' for accurate weight management. Current calculations use default zero values.";
    }
    if (activeWdhSpecs && activeWdhSpecs.name) {
      text += ` Active WDH: ${activeWdhSpecs.name}.`;
    }
    return text;
  };

  const caravanSpecsForList: CaravanWeightData = activeCaravanFull 
    ? {
        tareMass: activeCaravanFull.tareMass,
        atm: activeCaravanFull.atm,
        gtm: activeCaravanFull.gtm,
        maxTowballDownload: activeCaravanFull.maxTowballDownload,
        numberOfAxles: activeCaravanFull.numberOfAxles,
        make: activeCaravanFull.make,
        model: activeCaravanFull.model,
      }
    : defaultCaravanSpecs;

  if (!isLocalStorageReady || isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-foreground flex items-center">
          <Backpack className="mr-3 h-8 w-8" /> Inventory & Weight Management
        </h1>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-foreground mr-3" />
          <p className="font-body text-lg">Loading specifications &amp; inventory...</p>
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

      {!error && (!activeCaravanFull || activeCaravanFull.tareMass === 0 || !activeCaravanId) && (
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
      {activeWdhSpecs && activeWdhSpecs.name && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Link2Icon className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active WDH: {activeWdhSpecs.name} ({activeWdhSpecs.type}, Max: {activeWdhSpecs.maxCapacityKg}kg)</AlertTitle>
         </Alert>
      )}
      
      <InventoryList 
        caravanSpecs={caravanSpecsForList}
        activeCaravanStorageLocations={activeCaravanFull?.storageLocations || []}
        activeVehicleStorageLocations={activeVehicleSpecs?.storageLocations || []}
        activeCaravanWaterTanks={activeCaravanFull?.waterTanks || []}
        waterTankLevels={waterTankLevels}
        onUpdateWaterTankLevel={handleUpdateWaterTankLevel}
        activeTowVehicleSpecs={activeVehicleSpecs || defaultVehicleSpecs}
        activeWdhSpecs={activeWdhSpecs} 
        initialCaravanInventory={currentCaravanInventory}
        activeCaravanId={activeCaravanId}
      />
    </div>
  );
}

