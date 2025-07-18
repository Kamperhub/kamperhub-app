
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InventoryItem, CaravanWeightData } from '@/types/inventory';
import type { StoredCaravan, WDHFormData } from '@/types/caravan';
import type { StoredVehicle } from '@/types/vehicle';
import type { UserProfile } from '@/types/auth';
import type { LoggedTrip, Occupant } from '@/types/tripplanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Trash2, PlusCircle, Edit3, AlertTriangle, Car, HomeIcon, Weight, Axe, Settings2, Link2 as Link2Icon, StickyNote, PackageSearch, Droplet, Archive, Info, PackagePlus, Users, Wand, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label as RechartsLabel } from 'recharts';
import { fetchInventory, updateInventory, updateUserPreferences } from '@/lib/api-client';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { Separator } from '@/components/ui/separator';


interface InventoryListClientProps {
  activeCaravan: StoredCaravan | null;
  activeVehicle: StoredVehicle | null;
  wdh: WDHFormData | null | undefined;
  userPreferences: Partial<UserProfile> | null;
  trips: LoggedTrip[];
}

const defaultCaravanSpecs: CaravanWeightData = {
  tareMass: 0, atm: 0, gtm: 0, maxTowballDownload: 0, numberOfAxles: 1, axleGroupRating: 0
};

const DonutChartCustomLabel = ({ viewBox, value, limit, unit, name }: { viewBox?: { cx?: number, cy?: number }, value: number, limit: number, unit: string, name: string }) => {
  const { cx, cy } = viewBox || { cx: 0, cy: 0 };
  const isLimitNotSet = limit <= 0;
  const percentage = !isLimitNotSet && limit > 0 && typeof value === 'number' && !isNaN(value) ? ((value / limit) * 100) : 0;
  const isOverLimit = !isLimitNotSet && typeof value === 'number' && !isNaN(value) && value > limit;
  const displayValue = typeof value === 'number' && !isNaN(value) ? value.toFixed(0) : '--';

  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="font-body">
      <tspan x={cx} dy="-1.6em" className="text-xl fill-muted-foreground">{name}</tspan>
      <tspan x={cx} dy="1.3em" className={`text-4xl font-bold font-headline ${isOverLimit ? 'fill-destructive' : 'fill-primary'}`}>
        {displayValue}{unit}
      </tspan>
      {!isLimitNotSet ? (
        <tspan x={cx} dy="1.5em" className="text-lg fill-muted-foreground">
          ({percentage.toFixed(0)}%)
        </tspan>
      ) : (
        <tspan x={cx} dy="1.5em" className="text-lg fill-muted-foreground">
          (Limit N/A)
        </tspan>
      )}
    </text>
  );
};


export function InventoryList({ activeCaravan, activeVehicle, wdh, userPreferences, trips }: InventoryListClientProps) {
  const queryClient = useQueryClient();
  const user = auth.currentUser;
  const { toast } = useToast();

  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery<{ items: InventoryItem[] }>({
    queryKey: ['inventory', activeCaravan?.id],
    queryFn: () => fetchInventory(activeCaravan!.id),
    enabled: !!activeCaravan,
  });
  const items = inventoryData?.items || [];
  
  const [itemName, setItemName] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [itemLocationId, setItemLocationId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [localWaterLevels, setLocalWaterLevels] = useState<Record<string, number>>({});
  const [selectedTripId, setSelectedTripId] = useState<string>('none');

  const selectedTrip = useMemo(() => trips.find(trip => trip.id === selectedTripId), [trips, selectedTripId]);
  const occupants = useMemo(() => selectedTrip?.occupants || [], [selectedTrip]);

  const preferencesMutation = useMutation({
    mutationFn: (prefs: Partial<UserProfile>) => updateUserPreferences(prefs),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['vehiclePageData', user?.uid] });
    },
    onError: (error: Error) => {
      toast({ title: "Error Saving Preferences", description: error.message, variant: "destructive" });
    },
  });

  const debouncedSaveWaterLevels = useCallback(
    (() => {
      let timer: NodeJS.Timeout;
      return (levels: Record<string, Record<string, number>>) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          preferencesMutation.mutate({ caravanWaterLevels: levels });
        }, 500); // 500ms debounce delay
      };
    })(),
    [preferencesMutation]
  );
  
  useEffect(() => {
    if (activeCaravan && userPreferences?.caravanWaterLevels) {
      setLocalWaterLevels(userPreferences.caravanWaterLevels[activeCaravan.id] || {});
    } else {
      setLocalWaterLevels({});
    }
  }, [activeCaravan, userPreferences?.caravanWaterLevels]);

  const handleUpdateWaterTankLevel = useCallback((tankId: string, level: number) => {
    if (!activeCaravan || !userPreferences) return;

    const newLevel = Math.max(0, Math.min(100, level));

    // Update local state immediately for responsive UI
    setLocalWaterLevels(prevLevels => ({
      ...prevLevels,
      [tankId]: newLevel
    }));

    // Prepare the full data structure for debounced saving
    const currentGlobalLevels = userPreferences.caravanWaterLevels || {};
    const updatedGlobalLevels = {
      ...currentGlobalLevels,
      [activeCaravan.id]: {
        ...(currentGlobalLevels[activeCaravan.id] || {}),
        [tankId]: newLevel,
      }
    };
    debouncedSaveWaterLevels(updatedGlobalLevels);
  }, [activeCaravan, userPreferences, debouncedSaveWaterLevels]);

  
  const inventoryMutation = useMutation({
    mutationFn: (newItems: InventoryItem[]) => updateInventory({ caravanId: activeCaravan!.id, items: newItems }),
    onMutate: async (newItems: InventoryItem[]) => {
      await queryClient.cancelQueries({ queryKey: ['inventory', activeCaravan?.id] });
      const previousInventory = queryClient.getQueryData<{ items: InventoryItem[] }>(['inventory', activeCaravan?.id]);
      queryClient.setQueryData<{ items: InventoryItem[] }>(['inventory', activeCaravan?.id], { items: newItems });
      return { previousInventory };
    },
    onError: (err, newItems, context) => {
      if (context?.previousInventory) {
        queryClient.setQueryData(['inventory', activeCaravan?.id], context.previousInventory);
      }
      toast({ title: "Error Saving Inventory", description: (err as Error).message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', activeCaravan?.id] });
    },
  });
  
  const enrichedCombinedStorageLocations = useMemo(() => {
    const formatPosition = (pos: { longitudinalPosition: string; lateralPosition: string; }) => {
      const longText = {
        'front-of-axles': 'Front', 'over-axles': 'Over Axles', 'rear-of-axles': 'Rear',
        'front-of-front-axle': 'Front of F.Axle', 'between-axles': 'Between Axles', 'rear-of-rear-axle': 'Rear of R.Axle', 'roof-center': 'Roof Center'
      }[pos.longitudinalPosition] || pos.longitudinalPosition;
      const latText = { 'left': 'Left', 'center': 'Center', 'right': 'Right' }[pos.lateralPosition] || pos.lateralPosition;
      return `(${longText} / ${latText})`;
    };
    const caravanLocs = (activeCaravan?.storageLocations || []).map(loc => ({ id: `cv-${loc.id}`, name: `CV: ${loc.name}`, details: formatPosition(loc), maxWeightCapacityKg: loc.maxWeightCapacityKg, distanceFromAxleCenterMm: loc.distanceFromAxleCenterMm, type: 'caravan' as 'caravan' | 'vehicle' }));
    const vehicleLocs = (activeVehicle?.storageLocations || []).map(loc => ({ id: `veh-${loc.id}`, name: `VEH: ${loc.name}`, details: formatPosition(loc), maxWeightCapacityKg: loc.maxWeightCapacityKg, distanceFromAxleCenterMm: loc.distanceFromRearAxleMm, type: 'vehicle' as 'caravan' | 'vehicle' }));
    return [...caravanLocs, ...vehicleLocs];
  }, [activeCaravan?.storageLocations, activeVehicle?.storageLocations]);
  
  const { totalCaravanInventoryWeight, unassignedWeight } = useMemo(() => {
    return items.reduce((acc, item) => {
      const itemTotalWeight = item.weight * item.quantity;
      const location = enrichedCombinedStorageLocations.find(loc => loc.id === item.locationId);
      if (location?.type === 'caravan') {
        acc.totalCaravanInventoryWeight += itemTotalWeight;
      } else if (!location) {
        acc.unassignedWeight += itemTotalWeight;
      }
      return acc;
    }, { totalCaravanInventoryWeight: 0, unassignedWeight: 0 });
  }, [items, enrichedCombinedStorageLocations]);

  const totalVehicleInventoryWeight = useMemo(() => {
    return items.reduce((sum, item) => {
      const location = enrichedCombinedStorageLocations.find(loc => loc.id === item.locationId);
      return location?.type === 'vehicle' ? sum + (item.weight * item.quantity) : sum;
    }, 0);
  }, [items, enrichedCombinedStorageLocations]);

  const totalWaterWeight = useMemo(() => {
    return (activeCaravan?.waterTanks || []).reduce((sum, tank) => {
      const levelPercentage = localWaterLevels[tank.id] || 0;
      return sum + (tank.capacityLitres * (levelPercentage / 100));
    }, 0);
  }, [activeCaravan?.waterTanks, localWaterLevels]);

  const caravanSpecs = activeCaravan ? {
    tareMass: activeCaravan.tareMass, atm: activeCaravan.atm, gtm: activeCaravan.gtm,
    maxTowballDownload: activeCaravan.maxTowballDownload, numberOfAxles: activeCaravan.numberOfAxles, axleGroupRating: activeCaravan.axleGroupRating,
    hitchToAxleCenterDistance: activeCaravan.hitchToAxleCenterDistance,
  } : { ...defaultCaravanSpecs, hitchToAxleCenterDistance: null };
  const { tareMass, atm: atmLimit, gtm: gtmLimit, maxTowballDownload: caravanMaxTowballDownloadLimit, axleGroupRating, hitchToAxleCenterDistance } = caravanSpecs;

  const caravanPayload = totalCaravanInventoryWeight + unassignedWeight + totalWaterWeight;
  const currentCaravanMass = tareMass + caravanPayload;

  const calculatedTowballMass = useMemo(() => {
    if (!activeCaravan || !hitchToAxleCenterDistance) {
      return (totalCaravanInventoryWeight + unassignedWeight + totalWaterWeight) * 0.1;
    }
    let totalMoment = 0; // in kg.mm
    items.forEach(item => {
      const location = enrichedCombinedStorageLocations.find(loc => loc.id === item.locationId);
      if (location?.type === 'caravan' && typeof location.distanceFromAxleCenterMm === 'number') {
        totalMoment += (item.weight * item.quantity) * location.distanceFromAxleCenterMm;
      }
    });
    (activeCaravan.waterTanks || []).forEach(tank => {
      if (typeof tank.distanceFromAxleCenterMm === 'number') {
        const waterWeight = (tank.capacityLitres * (localWaterLevels[tank.id] || 0)) / 100;
        totalMoment += waterWeight * tank.distanceFromAxleCenterMm;
      }
    });
    const gasWeight = (activeCaravan.numberOfGasBottles || 0) * (activeCaravan.gasBottleCapacityKg || 0);
    if (gasWeight > 0) {
      const gasBottlePosition = hitchToAxleCenterDistance * 0.9;
      totalMoment += gasWeight * gasBottlePosition;
    }
    const calculatedTBM = totalMoment / hitchToAxleCenterDistance;
    return isNaN(calculatedTBM) ? 0 : calculatedTBM;
  }, [items, activeCaravan, enrichedCombinedStorageLocations, localWaterLevels, totalCaravanInventoryWeight, unassignedWeight, totalWaterWeight, hitchToAxleCenterDistance]);

  const remainingPayloadATM = atmLimit > 0 ? atmLimit - currentCaravanMass : 0;
  const currentLoadOnAxles = currentCaravanMass - calculatedTowballMass;
  const axleLoadLimit = Math.min(gtmLimit || Infinity, axleGroupRating || Infinity);
  
  const totalOccupantWeight = useMemo(() => (occupants || []).reduce((sum, occ) => sum + occ.weight, 0), [occupants]);
  
  const vehicleKerbWeight = activeVehicle?.kerbWeight ?? 0;
  const vehicleGVM = activeVehicle?.gvm ?? 0;
  const vehicleGCM = activeVehicle?.gcm ?? 0;

  const vehicleAddedPayload = totalVehicleInventoryWeight + calculatedTowballMass + totalOccupantWeight;
  const currentVehicleMass = vehicleKerbWeight + vehicleAddedPayload;

  const vehicleMaxTowCapacity = activeVehicle?.maxTowCapacity ?? 0;
  const vehicleMaxTowballMass = activeVehicle?.maxTowballMass ?? 0;
  
  const isOverMaxTowCapacity = vehicleMaxTowCapacity > 0 && currentCaravanMass > vehicleMaxTowCapacity;
  const isOverVehicleMaxTowball = vehicleMaxTowballMass > 0 && calculatedTowballMass > vehicleMaxTowballMass;
  
  const currentGCM = currentCaravanMass + currentVehicleMass;

  const wdhMaxCapacity = wdh?.maxCapacityKg ?? 0;
  const wdhMinCapacity = wdh?.minCapacityKg ?? null;
  const isTowballOverWdhMax = wdhMaxCapacity > 0 && calculatedTowballMass > wdhMaxCapacity;
  const isTowballUnderWdhMin = wdhMinCapacity !== null && wdhMinCapacity > 0 && calculatedTowballMass < wdhMinCapacity;

  const handleAddItem = () => {
    if (!activeCaravan) {
      toast({ title: "No Active Caravan", description: "Please select an active caravan.", variant: "destructive" });
      return;
    }
    const weight = parseFloat(itemWeight);
    const quantity = parseInt(itemQuantity, 10);
    if (!itemName.trim() || isNaN(weight) || weight <= 0 || isNaN(quantity) || quantity < 1) {
      toast({ title: "Invalid Input", description: "Please provide valid item details.", variant: "destructive" });
      return;
    }
    const newItem: InventoryItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: itemName.trim(), weight, quantity, locationId: itemLocationId,
    };
    const updatedItems = editingItem ? items.map(item => (item.id === editingItem.id ? newItem : item)) : [...items, newItem];
    inventoryMutation.mutate(updatedItems);
    toast({ title: editingItem ? "Item Updated" : "Item Added" });
    setItemName(''); setItemWeight(''); setItemQuantity('1'); setItemLocationId(null); setEditingItem(null);
  };

  const handleEditItem = (itemToEdit: InventoryItem) => {
    setEditingItem(itemToEdit);
    setItemName(itemToEdit.name);
    setItemWeight(itemToEdit.weight.toString());
    setItemQuantity(itemToEdit.quantity.toString());
    setItemLocationId(itemToEdit.locationId || null);
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    inventoryMutation.mutate(updatedItems);
    toast({ title: "Item Removed" });
  };
  
  const getAlertStylingVariant = (currentValue: number, limit: number, isWarning?: boolean) => {
    if (limit <= 0 && !isWarning) return "default";
    if (currentValue > limit || isWarning) return "destructive";
    return "default";
  };
  
  const prepareChartData = (currentVal: number, limitVal: number) => {
    const isLimitNotSet = limitVal <= 0;
    const isOver = !isLimitNotSet && currentVal > limitVal;
    if (isLimitNotSet) return { data: [{ name: 'N/A', value: 100 }], colors: ['hsl(var(--muted))'] };
    return {
      data: [{ name: 'Used', value: currentVal }, { name: 'Remaining', value: Math.max(0, limitVal - currentVal) }],
      colors: [isOver ? 'hsl(var(--destructive))' : 'hsl(var(--primary))', 'hsl(var(--muted))'],
    };
  };

  const atmChart = prepareChartData(currentCaravanMass, atmLimit);
  const axleLoadChart = prepareChartData(currentLoadOnAxles, axleLoadLimit);
  const towballChart = prepareChartData(calculatedTowballMass, caravanMaxTowballDownloadLimit);
  const gcmChart = prepareChartData(currentGCM, vehicleGCM);
  
  const getLocationNameById = (locationId: string | null | undefined) => !locationId ? 'Unassigned' : enrichedCombinedStorageLocations.find(loc => loc.id === locationId)?.name || 'Unknown';
  
  const capacityTrackedLocations = useMemo(() => enrichedCombinedStorageLocations.filter(loc => typeof loc.maxWeightCapacityKg === 'number' && loc.maxWeightCapacityKg > 0), [enrichedCombinedStorageLocations]);
  
  const locationWeights = useMemo(() => {
    const weightsMap = new Map<string, number>();
    capacityTrackedLocations.forEach(loc => weightsMap.set(loc.id, 0));
    items.forEach(item => {
      if (item.locationId && weightsMap.has(item.locationId)) {
        weightsMap.set(item.locationId, (weightsMap.get(item.locationId) || 0) + (item.weight * item.quantity));
      }
    });
    return weightsMap;
  }, [items, capacityTrackedLocations]);

  const isFormDisabled = !activeCaravan;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Inventory Weight Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 pt-4">
          <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><Users className="mr-2 h-5 w-5"/>Occupant Weight</CardTitle>
                <CardDescription>Select a trip to include occupant weights in the GVM calculation.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="trip-occupants-select">Include Occupants from Trip</Label>
                        <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                            <SelectTrigger id="trip-occupants-select">
                                <SelectValue placeholder="Select a trip..."/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None (No Occupant Weight)</SelectItem>
                                {trips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {occupants.length > 0 && (
                        <div className="space-y-1">
                            <Label>Occupants ({totalOccupantWeight.toFixed(1)} kg total)</Label>
                            <ul className="text-sm text-muted-foreground list-disc pl-5">
                                {occupants.map(occ => (
                                    <li key={occ.id}>
                                        {occ.name} ({occ.weight} kg)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                 </div>
            </CardContent>
          </Card>
          <h3 className="text-xl font-headline">Weight Summary &amp; Compliance</h3>
          <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-700 dark:text-blue-300" />
            <AlertTitle className="font-headline text-blue-800 dark:text-blue-200">For Accurate Calculations</AlertTitle>
            <AlertDescription className="font-body text-blue-700 dark:text-blue-300 text-xs">
              The precision of these weight figures, especially the Calculated Towball Mass, depends directly on the accuracy of your inventory. Ensure each item's weight is correct and that items are assigned to the appropriate storage location. "Unassigned" items are assumed to be centered over the axles and will not contribute to the towball moment calculation.
            </AlertDescription>
          </Alert>
          <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Wand className="h-4 w-4 text-blue-700 dark:text-blue-300" />
              <AlertTitle className="font-headline text-blue-800 dark:text-blue-200">About these calculations</AlertTitle>
              <AlertDescription className="font-body text-blue-700 dark:text-blue-300 text-xs">
                  {hitchToAxleCenterDistance ? 
                  "Tow Ball Mass is now calculated based on the position of items. This provides a more accurate estimate than the simple percentage method. Unassigned items are assumed to be over the axle." :
                  "Tow Ball Mass is a simple 10% estimate of payload. For a more accurate calculation, edit your active caravan and provide the 'Hitch to Axle Center' distance."
                  }
                  Always verify weights at a certified weighbridge.
              </AlertDescription>
          </Alert>
           {wdh && (
             <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <Link2Icon className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                <AlertTitle className="font-headline text-blue-800 dark:text-blue-200">WDH In Use: Note on Weight Distribution</AlertTitle>
                <AlertDescription className="font-body text-blue-700 dark:text-blue-300 text-xs">
                  Your Weight Distribution Hitch improves safety and handling by distributing the towball mass across the vehicle and caravan axles.
                  However, it does <strong>not</strong> change the legal GVM, ATM, or tow capacity limits. Our calculations use the full estimated towball mass for GVM compliance, which is the safest approach. Always verify your actual axle weights at a certified weighbridge.
                </AlertDescription>
              </Alert>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-headline flex items-center"><HomeIcon className="mr-2 h-5 w-5"/> Caravan Weights</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
              <div>
                <Label className="text-sm font-normal text-muted-foreground">ATM</Label>
                <p className={`font-bold text-lg ${getAlertStylingVariant(currentCaravanMass, atmLimit) === 'destructive' ? 'text-destructive' : 'text-foreground'}`}>
                    {currentCaravanMass.toFixed(1)} / {atmLimit > 0 ? atmLimit.toFixed(0) : 'N/A'} kg
                </p>
              </div>
              <div>
                <Label className="text-sm font-normal text-muted-foreground">Axle Load</Label>
                <p className={`font-bold text-lg ${getAlertStylingVariant(currentLoadOnAxles, axleLoadLimit) === 'destructive' ? 'text-destructive' : 'text-foreground'}`}>
                    {currentLoadOnAxles.toFixed(1)} / {axleLoadLimit > 0 && axleLoadLimit !== Infinity ? axleLoadLimit.toFixed(0) : 'N/A'} kg
                </p>
              </div>
            </CardContent>
          </Card>

          {activeVehicle && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-headline flex items-center"><Car className="mr-2 h-5 w-5"/> Vehicle Weights</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-center">
                {vehicleGVM > 0 && (
                  <div>
                    <Label className="text-sm font-normal text-muted-foreground">GVM</Label>
                    <p className={`font-bold text-lg ${getAlertStylingVariant(currentVehicleMass, vehicleGVM) === 'destructive' ? 'text-destructive' : 'text-foreground'}`}>
                        {currentVehicleMass.toFixed(1)} / {vehicleGVM.toFixed(0)} kg
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-normal text-muted-foreground">Towing Capacity</Label>
                  <p className={`font-bold text-lg ${isOverMaxTowCapacity ? 'text-destructive' : 'text-foreground'}`}>
                      {currentCaravanMass.toFixed(1)} / {vehicleMaxTowCapacity.toFixed(0)} kg
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            <div className="flex flex-col items-center p-3 border rounded-lg"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={atmChart.data} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={75} dataKey="value" stroke="hsl(var(--background))">{atmChart.data.map((_, i) => (<Cell key={`cell-atm-${i}`} fill={atmChart.colors[i % atmChart.colors.length]} />))}<RechartsLabel content={<DonutChartCustomLabel name="ATM" value={currentCaravanMass} limit={atmLimit} unit="kg" />} position="center" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            <div className="flex flex-col items-center p-3 border rounded-lg"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={axleLoadChart.data} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={75} dataKey="value" stroke="hsl(var(--background))">{axleLoadChart.data.map((_, i) => (<Cell key={`cell-axle-${i}`} fill={axleLoadChart.colors[i % axleLoadChart.colors.length]} />))}<RechartsLabel content={<DonutChartCustomLabel name="Axle Load" value={currentLoadOnAxles} limit={axleLoadLimit} unit="kg" />} position="center" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            <div className="flex flex-col items-center p-3 border rounded-lg"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={towballChart.data} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={75} dataKey="value" stroke="hsl(var(--background))">{towballChart.data.map((_, i) => (<Cell key={`cell-towball-${i}`} fill={towballChart.colors[i % towballChart.colors.length]} />))}<RechartsLabel content={<DonutChartCustomLabel name="Calc. Towball" value={calculatedTowballMass} limit={caravanMaxTowballDownloadLimit} unit="kg" />} position="center" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            {activeVehicle && vehicleGCM > 0 && (
              <div className="flex flex-col items-center p-3 border rounded-lg"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={gcmChart.data} cx="50%" cy="50%" labelLine={false} outerRadius={100} innerRadius={75} dataKey="value" stroke="hsl(var(--background))">{gcmChart.data.map((_, i) => (<Cell key={`cell-gcm-${i}`} fill={gcmChart.colors[i % gcmChart.colors.length]} />))}<RechartsLabel content={<DonutChartCustomLabel name="GCM" value={currentGCM} limit={vehicleGCM} unit="kg" />} position="center" /></Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            )}
        </div>

        <Separator/>
        
        {isFormDisabled && (
            <Alert variant="default" className="bg-muted border-border">
                <AlertTriangle className="h-4 w-4 text-foreground" />
                <AlertTitle className="font-headline text-foreground">Select Active Caravan</AlertTitle>
                <AlertDescription className="font-body text-muted-foreground">Inventory management is disabled. Please set an active caravan in 'Vehicles' to add or modify items.</AlertDescription>
            </Alert>
        )}
        <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 min-w-0">
                    <Label htmlFor="itemName" className="font-body">Item Name</Label>
                    <Input id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Camping Chair" disabled={isFormDisabled}/>
                </div>
                <div className="w-full md:w-28 flex-shrink-0">
                    <Label htmlFor="itemWeight" className="font-body">Weight (kg)</Label>
                    <Input id="itemWeight" type="number" value={itemWeight} onChange={(e) => setItemWeight(e.target.value)} placeholder="2.5" disabled={isFormDisabled}/>
                </div>
                <div className="w-full md:w-24 flex-shrink-0">
                    <Label htmlFor="itemQuantity" className="font-body">Qty</Label>
                    <Input id="itemQuantity" type="number" min="1" value={itemQuantity} onChange={(e) => setItemQuantity(e.target.value)} placeholder="2" disabled={isFormDisabled}/>
                </div>
                <div className="flex-1 min-w-0">
                    <Label htmlFor="itemLocation" className="font-body">Location</Label>
                    <Select value={itemLocationId || "none"} onValueChange={(v) => setItemLocationId(v === "none" ? null : v)} disabled={isFormDisabled || enrichedCombinedStorageLocations.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {enrichedCombinedStorageLocations.map(loc => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name} {loc.details}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <Button onClick={handleAddItem} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isFormDisabled || inventoryMutation.isPending}>
                <PlusCircle className="mr-2 h-4 w-4" /> {editingItem ? 'Update' : 'Add'} Item
            </Button>
        </div>

        {isLoadingInventory && <p>Loading inventory...</p>}
        {items.length > 0 && (
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Qty</TableHead><TableHead>Total Wt.</TableHead><TableHead>Location</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{items.map(item => (<TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{(item.weight * item.quantity).toFixed(1)}kg</TableCell><TableCell>{getLocationNameById(item.locationId)}</TableCell><TableCell><Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}</TableBody>
             <TableCaption>Total Inventory Weight (Caravan &amp; Vehicle): {(totalCaravanInventoryWeight + unassignedWeight + totalVehicleInventoryWeight).toFixed(1)} kg</TableCaption>
          </Table>)}
        
        {activeCaravan?.waterTanks && activeCaravan.waterTanks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center"><Droplet className="mr-2 h-5 w-5 text-primary" />Water Tank Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {activeCaravan.waterTanks.map(tank => {
                const currentLevel = localWaterLevels[tank.id] || 0;
                const levelOptions = [
                  { label: "Empty", value: 0 },
                  { label: "1/4", value: 25 },
                  { label: "1/2", value: 50 },
                  { label: "3/4", value: 75 },
                  { label: "Full", value: 100 },
                ];
                return (
                  <div key={tank.id}>
                    <div className="flex items-baseline gap-4 mb-2">
                      <Label>{tank.name} ({tank.capacityLitres}L - {tank.type})</Label>
                      <span className="text-sm font-medium text-muted-foreground">
                        {currentLevel}% ({((tank.capacityLitres * currentLevel) / 100).toFixed(1)} kg)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {levelOptions.map(opt => (
                        <Button
                          key={opt.value}
                          variant={currentLevel === opt.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateWaterTankLevel(tank.id, opt.value)}
                          disabled={preferencesMutation.isPending}
                          className="font-body text-xs flex-grow sm:flex-grow-0"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter>
              <p>Total Water Weight: {totalWaterWeight.toFixed(1)} kg</p>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
