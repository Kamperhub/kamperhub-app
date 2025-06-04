
"use client"; 

import { useState, useEffect } from 'react';
import { InventoryList } from '@/components/features/inventory/InventoryList';
import type { StoredCaravan } from '@/types/caravan'; 
import { CARAVANS_STORAGE_KEY, ACTIVE_CARAVAN_ID_KEY } from '@/types/caravan';
import type { CaravanWeightData } from '@/types/inventory';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { AlertTriangle, Settings, Loader2 } from 'lucide-react';

const defaultCaravanSpecs: CaravanWeightData = {
  tareMass: 0,
  atm: 0,
  gtm: 0,
  maxTowballDownload: 0,
};

export default function InventoryPage() {
  const [caravanSpecs, setCaravanSpecs] = useState<CaravanWeightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);

  useEffect(() => {
    setIsLocalStorageReady(true); // Mark as ready for conditional rendering
  }, []);

  useEffect(() => {
    if (isLocalStorageReady && typeof window !== 'undefined') {
      setIsLoading(true);
      try {
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
          } else {
            setError("Active caravan data not found. Please re-select an active caravan in the Vehicles section.");
            setCaravanSpecs(defaultCaravanSpecs); 
          }
        } else {
          setCaravanSpecs(null); 
        }
      } catch (e) {
        console.error("Error loading active caravan data for Inventory:", e);
        setError("Could not load caravan data. Please try again or check your browser's storage.");
        setCaravanSpecs(defaultCaravanSpecs);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isLocalStorageReady]);

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
          Track your caravan's load, manage items, and stay compliant with weight limits.
          {caravanSpecs && caravanSpecs.tareMass > 0 ? " Using specifications from your active caravan." : " Please set an active caravan in the 'Vehicles' section for accurate calculations. Current calculations use default zero values."}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Caravan Data</AlertTitle>
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
      
      <InventoryList caravanSpecs={caravanSpecs || defaultCaravanSpecs} />
    </div>
  );
}
