
"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChecklistTabContent } from '@/components/features/checklists/ChecklistTabContent';
import type { ChecklistItem, ChecklistCategory, CaravanChecklists } from '@/types/checklist';
import { initialChecklists as defaultInitialChecklists, CHECKLISTS_STORAGE_KEY } from '@/types/checklist';
import type { StoredCaravan } from '@/types/caravan';
import { CARAVANS_STORAGE_KEY, ACTIVE_CARAVAN_ID_KEY } from '@/types/caravan';
import type { StoredVehicle } from '@/types/vehicle';
import { VEHICLES_STORAGE_KEY, ACTIVE_VEHICLE_ID_KEY as ACTIVE_TOW_VEHICLE_ID_KEY } from '@/types/vehicle';
import type { StoredWDH } from '@/types/wdh'; // Import WDH types
import { WDHS_STORAGE_KEY, ACTIVE_WDH_ID_KEY } from '@/types/wdh'; // Import WDH keys
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Settings, Loader2, Car, Home, Link2 as Link2Icon } from 'lucide-react';

export default function ChecklistsPage() {
  const [activeCaravanId, setActiveCaravanId] = useState<string | null>(null);
  const [activeCaravanName, setActiveCaravanName] = useState<string | null>(null);
  const [activeVehicleName, setActiveVehicleName] = useState<string | null>(null);
  const [activeWdhName, setActiveWdhName] = useState<string | null>(null); // State for active WDH name
  const [currentCaravanChecklists, setCurrentCaravanChecklists] = useState<Partial<Record<ChecklistCategory, ChecklistItem[]>>>(defaultInitialChecklists);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLocalStorageReady(true);
  }, []);

  useEffect(() => {
    if (isLocalStorageReady && typeof window !== 'undefined') {
      setIsLoading(true);
      setActiveCaravanName(null);
      setActiveVehicleName(null);
      setActiveWdhName(null); // Reset active WDH name

      try {
        const currentActiveCaravanId = localStorage.getItem(ACTIVE_CARAVAN_ID_KEY);
        setActiveCaravanId(currentActiveCaravanId);

        if (currentActiveCaravanId) {
          const storedCaravansJson = localStorage.getItem(CARAVANS_STORAGE_KEY);
          if (storedCaravansJson) {
            const storedCaravans: StoredCaravan[] = JSON.parse(storedCaravansJson);
            const activeCaravan = storedCaravans.find(c => c.id === currentActiveCaravanId);
            if (activeCaravan) {
              setActiveCaravanName(`${activeCaravan.year} ${activeCaravan.make} ${activeCaravan.model}`);
            }
          }
        }
        
        const activeVehicleId = localStorage.getItem(ACTIVE_TOW_VEHICLE_ID_KEY);
        const storedVehiclesJson = localStorage.getItem(VEHICLES_STORAGE_KEY);
        if (activeVehicleId && storedVehiclesJson) {
          const storedVehicles: StoredVehicle[] = JSON.parse(storedVehiclesJson);
          const activeVehicle = storedVehicles.find(v => v.id === activeVehicleId);
          if (activeVehicle) {
            setActiveVehicleName(`${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`);
          }
        }

        // Load Active WDH Name
        const activeWdhId = localStorage.getItem(ACTIVE_WDH_ID_KEY);
        const storedWdhsJson = localStorage.getItem(WDHS_STORAGE_KEY);
        if (activeWdhId && storedWdhsJson) {
          const storedWdhs: StoredWDH[] = JSON.parse(storedWdhsJson);
          const activeWdh = storedWdhs.find(w => w.id === activeWdhId);
          if (activeWdh) {
            setActiveWdhName(activeWdh.name);
          }
        }

        let parsedAllStoredChecklists: CaravanChecklists = {};
        const allStoredChecklistsJson = localStorage.getItem(CHECKLISTS_STORAGE_KEY);
        if (allStoredChecklistsJson) {
            try {
                const parsed = JSON.parse(allStoredChecklistsJson);
                if (typeof parsed === 'object' && parsed !== null) {
                    parsedAllStoredChecklists = parsed;
                } else {
                    console.warn("Checklist data in localStorage was malformed. Resetting.");
                    localStorage.setItem(CHECKLISTS_STORAGE_KEY, JSON.stringify({}));
                }
            } catch (parseError) {
                console.error("Error parsing checklists from localStorage. Resetting.", parseError);
                localStorage.setItem(CHECKLISTS_STORAGE_KEY, JSON.stringify({}));
            }
        }

        if (currentActiveCaravanId) {
            const checklistsForActiveCaravan = parsedAllStoredChecklists[currentActiveCaravanId];
            const resolvedChecklists: Partial<Record<ChecklistCategory, ChecklistItem[]>> = {};
            (Object.keys(defaultInitialChecklists) as ChecklistCategory[]).forEach(category => {
              resolvedChecklists[category] = checklistsForActiveCaravan?.[category] || defaultInitialChecklists[category];
            });
            setCurrentCaravanChecklists(resolvedChecklists);
        } else {
            setCurrentCaravanChecklists(defaultInitialChecklists); 
        }

      } catch (e) {
        console.error("Error loading data for Checklists:", e);
        setCurrentCaravanChecklists(defaultInitialChecklists);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isLocalStorageReady, pathname]);

  const getDescriptiveText = () => {
    let text = "Stay organized with customizable checklists for every stage of your trip. Your checklists are saved per active caravan.";
    if (activeCaravanName && activeVehicleName) {
      text += ` Currently viewing checklists for your ${activeCaravanName}, towed by ${activeVehicleName}.`;
    } else if (activeCaravanName) {
      text += ` Currently viewing checklists for your ${activeCaravanName}. Consider selecting an active tow vehicle in 'Vehicles'.`;
    } else if (activeVehicleName) {
      text += ` Current tow vehicle: ${activeVehicleName}. Please set an active caravan in 'Vehicles' to manage its specific checklists.`;
    } else if (!activeCaravanId) {
      text += " Please set an active caravan in the 'Vehicles' section to manage its specific checklists.";
    }
    if (activeWdhName) {
      text += ` Active WDH: ${activeWdhName}.`;
    }
    return text;
  };

  if (!isLocalStorageReady || isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline mb-6 text-primary">Camping Checklists</h1>
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p className="font-body text-lg">Loading checklists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Camping Checklists</h1>
        <p className="text-muted-foreground font-body mb-6">
          {getDescriptiveText()}
        </p>
      </div>

      {!activeCaravanId && (
        <Alert variant="default" className="mb-6 bg-primary/10 border-primary/30">
          <Settings className="h-4 w-4 text-primary" />
          <AlertTitle className="font-headline text-primary">Active Caravan Required for Custom Checklists</AlertTitle>
          <AlertDescription className="font-body text-primary/80">
            To save and manage checklists specific to a caravan, please add a caravan and set it as active in the 'Vehicles' section.
            <Link href="/vehicles" passHref>
              <Button variant="link" className="p-0 h-auto ml-1 text-primary hover:underline font-body">Go to Vehicles</Button>
            </Link>
            Currently, you are viewing default checklists. Any changes will not be saved.
          </AlertDescription>
        </Alert>
      )}
       {activeCaravanName && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Home className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active Caravan: {activeCaravanName}</AlertTitle>
         </Alert>
      )}
      {activeVehicleName && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Car className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active Tow Vehicle: {activeVehicleName}</AlertTitle>
         </Alert>
      )}
      {activeWdhName && (
         <Alert variant="default" className="mb-6 bg-secondary/30 border-secondary/50">
            <Link2Icon className="h-4 w-4 text-foreground" />
            <AlertTitle className="font-headline font-bold text-foreground">Active WDH: {activeWdhName}</AlertTitle>
         </Alert>
      )}

      <Tabs defaultValue="preDeparture" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
          <TabsTrigger value="preDeparture" className="font-body">Pre-Departure</TabsTrigger>
          <TabsTrigger value="campsiteSetup" className="font-body">Campsite Setup</TabsTrigger>
          <TabsTrigger value="packDown" className="font-body">Pack-Down</TabsTrigger>
        </TabsList>
        <TabsContent value="preDeparture">
          <ChecklistTabContent 
            category="preDeparture" 
            initialItems={currentCaravanChecklists.preDeparture || defaultInitialChecklists.preDeparture} 
            activeCaravanId={activeCaravanId}
          />
        </TabsContent>
        <TabsContent value="campsiteSetup">
          <ChecklistTabContent 
            category="campsiteSetup" 
            initialItems={currentCaravanChecklists.campsiteSetup || defaultInitialChecklists.campsiteSetup}
            activeCaravanId={activeCaravanId}
          />
        </TabsContent>
        <TabsContent value="packDown">
          <ChecklistTabContent 
            category="packDown" 
            initialItems={currentCaravanChecklists.packDown || defaultInitialChecklists.packDown}
            activeCaravanId={activeCaravanId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
