
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { StoredCaravan, CaravanFormData, StorageLocation, WaterTank } from '@/types/caravan';
import { CARAVANS_STORAGE_KEY, ACTIVE_CARAVAN_ID_KEY, WATER_TANK_LEVELS_STORAGE_KEY_PREFIX } from '@/types/caravan';
import type { StoredWDH } from '@/types/wdh';
import { WDHS_STORAGE_KEY, ACTIVE_WDH_ID_KEY } from '@/types/wdh';
import type { CaravanInventories } from '@/types/inventory';
import { INVENTORY_STORAGE_KEY } from '@/types/inventory';
import type { CaravanChecklists } from '@/types/checklist';
import { CHECKLISTS_STORAGE_KEY } from '@/types/checklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CaravanForm } from './CaravanForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, ShieldAlert, Settings2, Link2 as LinkIcon, Ruler, PackagePlus, MapPin, ArrowLeftRight, ArrowUpDown, Droplet, Weight, Axe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';


const FREE_TIER_CARAVAN_LIMIT = 1;

export function CaravanManager() {
  const { toast } = useToast();
  const [caravans, setCaravans] = useState<StoredCaravan[]>([]);
  const [activeCaravanId, setActiveCaravanId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCaravan, setEditingCaravan] = useState<StoredCaravan | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { isSubscribed, isLoading: isSubscriptionLoading } = useSubscription();
  const [allWdhs, setAllWdhs] = useState<StoredWDH[]>([]);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; caravanId: string | null; caravanName: string | null; confirmationText: string }>({
    isOpen: false,
    caravanId: null,
    caravanName: null,
    confirmationText: '',
  });

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      const storedWdhs = localStorage.getItem(WDHS_STORAGE_KEY);
      if (storedWdhs) {
        setAllWdhs(JSON.parse(storedWdhs));
      }
    }
  }, []);

  useEffect(() => {
    if (hasMounted) {
      try {
        const storedCaravans = localStorage.getItem(CARAVANS_STORAGE_KEY);
        if (storedCaravans) {
          const parsedCaravans: StoredCaravan[] = JSON.parse(storedCaravans);
          // Sanitize data: ensure storageLocations and waterTanks are always arrays
          const sanitizedCaravans = parsedCaravans.map(c => ({
            ...c,
            storageLocations: Array.isArray(c.storageLocations) ? c.storageLocations : [],
            waterTanks: Array.isArray(c.waterTanks) ? c.waterTanks : [],
          }));
          setCaravans(sanitizedCaravans);
        }
        const storedActiveId = localStorage.getItem(ACTIVE_CARAVAN_ID_KEY);
        if (storedActiveId) setActiveCaravanId(storedActiveId);
      } catch (error) {
        console.error("Error loading caravan data from localStorage:", error);
        toast({ title: "Error Loading Caravans", variant: "destructive" });
      }
    }
  }, [hasMounted, toast]);

  const saveCaravansToStorage = useCallback((updatedCaravans: StoredCaravan[]) => {
     if (!hasMounted || typeof window === 'undefined') return;
    try {
      localStorage.setItem(CARAVANS_STORAGE_KEY, JSON.stringify(updatedCaravans));
    } catch (error) {
      toast({ title: "Error Saving Caravans", variant: "destructive" });
    }
  }, [toast, hasMounted]);

  const saveActiveCaravanIdToStorage = useCallback((id: string | null) => {
     if (!hasMounted || typeof window === 'undefined') return;
    try {
      if (id) {
        localStorage.setItem(ACTIVE_CARAVAN_ID_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_CARAVAN_ID_KEY);
      }
    } catch (error) {
      toast({ title: "Error Saving Active Caravan Selection", variant: "destructive" });
    }
  }, [toast, hasMounted]);

  const saveActiveWdhIdToStorage = useCallback((id: string | null) => {
    if (!hasMounted || typeof window === 'undefined') return;
    try {
      if (id) {
        localStorage.setItem(ACTIVE_WDH_ID_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_WDH_ID_KEY);
      }
    } catch (error) {
      toast({ title: "Error Saving Active WDH Selection", variant: "destructive" });
    }
  }, [toast, hasMounted]);

  const handleSaveCaravan = (data: CaravanFormData) => {
    if (!isSubscribed && caravans.length >= FREE_TIER_CARAVAN_LIMIT && !editingCaravan) {
      toast({
        title: "Free Limit Reached",
        description: `You can only add ${FREE_TIER_CARAVAN_LIMIT} caravan on the free plan. Upgrade to Pro for unlimited caravans.`,
        variant: "destructive",
      });
      setIsFormOpen(false);
      return;
    }

    let updatedCaravans;
    const caravanDataToSave: StoredCaravan = {
      ...data,
      id: editingCaravan ? editingCaravan.id : Date.now().toString(),
      storageLocations: data.storageLocations || [],
      waterTanks: data.waterTanks || [],
    };

    if (editingCaravan) {
      updatedCaravans = caravans.map(c => c.id === editingCaravan.id ? caravanDataToSave : c);
      toast({ title: "Caravan Updated", description: `${data.make} ${data.model} updated.` });
    } else {
      updatedCaravans = [...caravans, caravanDataToSave];
      toast({ title: "Caravan Added", description: `${data.make} ${data.model} added.` });
    }
    setCaravans(updatedCaravans);
    saveCaravansToStorage(updatedCaravans);
    setIsFormOpen(false);
    setEditingCaravan(null);
  };

  const handleEditCaravan = (caravan: StoredCaravan) => {
    setEditingCaravan({
        ...caravan,
        storageLocations: caravan.storageLocations || [],
        waterTanks: caravan.waterTanks || [],
    });
    setIsFormOpen(true);
  };

  const handleDeleteCaravan = (id: string, name: string) => {
    setDeleteDialogState({ isOpen: true, caravanId: id, caravanName: name, confirmationText: '' });
  };

  const confirmDeleteCaravan = () => {
    if (!deleteDialogState.caravanId || deleteDialogState.confirmationText !== "DELETE") {
        setDeleteDialogState({ isOpen: false, caravanId: null, caravanName: null, confirmationText: '' });
        return;
    }

    const idToDelete = deleteDialogState.caravanId;

    if (!hasMounted || typeof window === 'undefined') return;

    const updatedCaravans = caravans.filter(c => c.id !== idToDelete);
    setCaravans(updatedCaravans);
    saveCaravansToStorage(updatedCaravans);

    try {
      const allInventoriesJson = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (allInventoriesJson) {
        const allInventories: CaravanInventories = JSON.parse(allInventoriesJson);
        if (allInventories[idToDelete]) {
          delete allInventories[idToDelete];
          localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(allInventories));
        }
      }
    } catch (error) {
      console.error("Error deleting caravan inventory from localStorage:", error);
      toast({ title: "Error Deleting Inventory", description: "Could not remove associated inventory data.", variant: "destructive" });
    }

    try {
      const allChecklistsJson = localStorage.getItem(CHECKLISTS_STORAGE_KEY);
      if (allChecklistsJson) {
        const allChecklists: CaravanChecklists = JSON.parse(allChecklistsJson);
        if (allChecklists[idToDelete]) {
          delete allChecklists[idToDelete];
          localStorage.setItem(CHECKLISTS_STORAGE_KEY, JSON.stringify(allChecklists));
        }
      }
    } catch (error) {
      console.error("Error deleting caravan checklists from localStorage:", error);
      toast({ title: "Error Deleting Checklists", description: "Could not remove associated checklist data.", variant: "destructive" });
    }

    try {
      localStorage.removeItem(`${WATER_TANK_LEVELS_STORAGE_KEY_PREFIX}${idToDelete}`);
    } catch (error) {
      console.error("Error deleting caravan water tank levels from localStorage:", error);
      toast({ title: "Error Deleting Water Levels", description: "Could not remove associated water tank level data.", variant: "destructive" });
    }

    if (activeCaravanId === idToDelete) {
      setActiveCaravanId(null);
      saveActiveCaravanIdToStorage(null);
      saveActiveWdhIdToStorage(null);
    }
    toast({ title: "Caravan Deleted", description: `${deleteDialogState.caravanName} and all its associated data have been removed.` });
    setDeleteDialogState({ isOpen: false, caravanId: null, caravanName: null, confirmationText: '' });
  };

  const handleSetActiveCaravan = (id: string) => {
    setActiveCaravanId(id);
    saveActiveCaravanIdToStorage(id);
    const caravan = caravans.find(c => c.id === id);
    let toastMessage = `${caravan?.make} ${caravan?.model} is now active.`;

    if (caravan?.associatedWdhId) {
      const associatedWdh = allWdhs.find(w => w.id === caravan.associatedWdhId);
      if (associatedWdh) {
        saveActiveWdhIdToStorage(associatedWdh.id);
        toastMessage += ` Associated WDH '${associatedWdh.name}' also activated.`;
      } else {
        saveActiveWdhIdToStorage(null);
        toastMessage += ` Associated WDH (ID: ${caravan.associatedWdhId.substring(0,6)}...) not found; no WDH activated.`;
      }
    } else {
      saveActiveWdhIdToStorage(null);
      toastMessage += ` No WDH associated with this caravan. Any previously active WDH has been cleared.`;
    }
    toast({ title: "Active Caravan Set", description: toastMessage });
  };

  const handleOpenFormForNew = () => {
    if (!isSubscribed && caravans.length >= FREE_TIER_CARAVAN_LIMIT) {
      toast({
        title: "Upgrade to Pro",
        description: `Manage more than ${FREE_TIER_CARAVAN_LIMIT} caravan with KamperHub Pro!`,
        variant: "default",
        className: "bg-primary text-primary-foreground",
        action: (
          <Link href="/subscribe">
            <Button variant="outline" size="sm" className="ml-auto text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Upgrade
            </Button>
          </Link>
        ),
      });
      return;
    }
    setEditingCaravan(null);
    setIsFormOpen(true);
  };

  const getWdhNameById = (wdhId: string | null | undefined) => {
    if (!wdhId) return null;
    const wdh = allWdhs.find(w => w.id === wdhId);
    if (wdh) return wdh.name;
    return `WDH (ID: ${wdhId.substring(0,6)}...) not found`;
  };

  const formatDimension = (value: number | null | undefined, unit: string = 'mm') => {
    return typeof value === 'number' ? `${value}${unit}` : 'N/A';
  };

  const formatPositionText = (item: { longitudinalPosition: string; lateralPosition: string; }) => {
    const longText = {
      'front-of-axles': 'Front',
      'over-axles': 'Over Axles',
      'rear-of-axles': 'Rear'
    }[item.longitudinalPosition] || item.longitudinalPosition;
    const latText = {
      'left': 'Left',
      'center': 'Center',
      'right': 'Right'
    }[item.lateralPosition] || item.lateralPosition;
    return `${longText} / ${latText}`;
  };


  if (!hasMounted || isSubscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">Caravans</CardTitle>
            <Skeleton className="h-9 w-[180px]" />
          </div>
          <CardDescription className="font-body">
            Loading caravan data...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  const canAddMoreCaravans = isSubscribed || caravans.length < FREE_TIER_CARAVAN_LIMIT;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">Caravans</CardTitle>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
              setIsFormOpen(isOpen);
              if (!isOpen) setEditingCaravan(null);
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={!canAddMoreCaravans && !editingCaravan}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Caravan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">{editingCaravan ? 'Edit Caravan' : 'Add New Caravan'}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                  <CaravanForm
                    initialData={editingCaravan || undefined}
                    onSave={handleSaveCaravan}
                    onCancel={() => { setIsFormOpen(false); setEditingCaravan(null); }}
                  />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="font-body">
            Manage your caravans. Select one as active for inventory and planning.
            {!isSubscribed && ` Free plan: ${FREE_TIER_CARAVAN_LIMIT} caravan limit.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSubscribed && caravans.length >= FREE_TIER_CARAVAN_LIMIT && !editingCaravan && (
            <Alert variant="default" className="bg-primary/10 border-primary/30">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <AlertTitle className="font-headline text-primary">Free Tier Limit Reached</AlertTitle>
              <AlertDescription className="font-body text-primary/80">
                You've reached the maximum of {FREE_TIER_CARAVAN_LIMIT} caravan for the free plan.
                <Link href="/subscribe" passHref>
                  <Button variant="link" className="p-0 h-auto ml-1 text-primary hover:underline font-body">Upgrade to Pro</Button>
                </Link>
                &nbsp;to add unlimited caravans.
              </AlertDescription>
            </Alert>
          )}
          {caravans.length === 0 && hasMounted &&(
            <p className="text-muted-foreground text-center font-body py-4">No caravans added yet. Click "Add New Caravan" to start.</p>
          )}
          {caravans.map(caravan => {
            const caravanGrossPayload = (typeof caravan.atm === 'number' && typeof caravan.tareMass === 'number' && caravan.atm > 0 && caravan.tareMass > 0 && caravan.atm >= caravan.tareMass) ? caravan.atm - caravan.tareMass : null;
            return (
              <Card key={caravan.id} className={`p-4 ${activeCaravanId === caravan.id ? 'border-primary shadow-lg' : 'shadow-sm'}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                  <div className="flex-grow">
                    <h3 className="font-semibold font-headline text-xl text-primary">{caravan.year} {caravan.make} {caravan.model}</h3>
                    <div className="text-sm text-muted-foreground font-body grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 mt-1">
                      <span className="flex items-center"><Weight className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Tare: {caravan.tareMass}kg</span>
                      <span className="flex items-center"><Weight className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> ATM: {caravan.atm}kg</span>
                      {caravanGrossPayload !== null && (
                        <span className="flex items-center"><PackagePlus className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Payload: {caravanGrossPayload.toFixed(0)}kg</span>
                      )}
                      <span className="flex items-center"><Weight className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> GTM: {caravan.gtm}kg</span>
                      <span className="flex items-center"><Weight className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Towball: {caravan.maxTowballDownload}kg</span>
                      <span className="flex items-center"><Axe className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Axles: {typeof caravan.numberOfAxles === 'number' ? caravan.numberOfAxles : 'N/A'}</span>
                      {caravan.associatedWdhId && getWdhNameById(caravan.associatedWdhId) && (
                         <span className="flex items-center col-span-full sm:col-span-1 md:col-span-1"><LinkIcon className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> WDH: {getWdhNameById(caravan.associatedWdhId)}</span>
                      )}
                      <span className="flex items-center col-span-full sm:col-span-1 md:col-span-1"><Ruler className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Overall Len: {formatDimension(caravan.overallLength)}</span>
                      <span className="flex items-center col-span-full sm:col-span-1 md:col-span-1"><Ruler className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Body Len: {formatDimension(caravan.bodyLength)}</span>
                      <span className="flex items-center col-span-full sm:col-span-1 md:col-span-1"><Ruler className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Height: {formatDimension(caravan.overallHeight)}</span>
                      <span className="flex items-center col-span-full sm:col-span-1 md:col-span-1"><Ruler className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Hitch-Axle: {formatDimension(caravan.hitchToAxleCenterDistance)}</span>
                      {Number(caravan.numberOfAxles) > 1 && caravan.interAxleSpacing && (
                        <span className="flex items-center col-span-full sm:col-span-1 md:col-span-1"><Ruler className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Inter-Axle: {formatDimension(caravan.interAxleSpacing)}</span>
                      )}
                    </div>
                  </div>
                   <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center self-start sm:self-auto flex-shrink-0 mt-2 sm:mt-0">
                    {activeCaravanId !== caravan.id && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActiveCaravan(caravan.id)} className="font-body w-full sm:w-auto">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Set Active
                      </Button>
                    )}
                    {activeCaravanId === caravan.id && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs h-8 w-full sm:w-auto flex items-center justify-center">
                        <CheckCircle className="mr-1 h-4 w-4" /> Active
                      </Badge>
                    )}
                    <div className="flex gap-1 w-full sm:w-auto">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCaravan(caravan)} className="font-body flex-grow sm:flex-grow-0">
                        <Edit3 className="h-4 w-4 sm:mr-1" /><span className="sm:hidden ml-1">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCaravan(caravan.id, `${caravan.year} ${caravan.make} ${caravan.model}`)} className="font-body text-destructive hover:text-destructive hover:bg-destructive/10 flex-grow sm:flex-grow-0">
                        <Trash2 className="h-4 w-4 sm:mr-1" /><span className="sm:hidden ml-1">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {(caravan.storageLocations && caravan.storageLocations.length > 0) || (caravan.waterTanks && caravan.waterTanks.length > 0) ? (
                  <CardFooter className="p-0 pt-3 mt-3 border-t flex flex-col items-start space-y-3">
                    {caravan.storageLocations && caravan.storageLocations.length > 0 && (
                      <div className="w-full">
                        <h4 className="text-sm font-semibold font-body mb-1.5 text-foreground flex items-center">
                          <PackagePlus className="w-4 h-4 mr-2 text-primary"/>Storage Locations:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                          {caravan.storageLocations.map(loc => (
                            <div key={loc.id} className="p-3 border rounded-lg bg-card shadow-sm">
                              <h5 className="font-semibold font-body text-base flex items-center mb-1 text-primary">
                                <MapPin className="w-4 h-4 mr-2 text-accent" /> {loc.name}
                              </h5>
                              <div className="space-y-0.5 text-xs font-body text-muted-foreground">
                                <p><strong className="text-foreground/80">Position:</strong> {formatPositionText(loc)}</p>
                                <p><strong className="text-foreground/80">Max Capacity:</strong> {formatDimension(loc.maxWeightCapacityKg, 'kg')}</p>
                                <p className="flex items-center"><ArrowLeftRight className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Dist. from Axle:</strong>&nbsp;{formatDimension(loc.distanceFromAxleCenterMm)}</p>
                                <p className="flex items-center"><ArrowUpDown className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Dist. from Centerline:</strong>&nbsp;{formatDimension(loc.distanceFromCenterlineMm)}</p>
                                <p className="flex items-center"><Ruler className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Height from Ground:</strong>&nbsp;{formatDimension(loc.heightFromGroundMm)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {caravan.waterTanks && caravan.waterTanks.length > 0 && (
                      <div className="w-full">
                        <h4 className="text-sm font-semibold font-body mb-1.5 text-foreground flex items-center">
                          <Droplet className="w-4 h-4 mr-2 text-primary"/>Water Tanks:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {caravan.waterTanks.map(tank => (
                            <Badge key={tank.id} variant="outline" className="font-normal font-body text-xs py-1 px-2 h-auto text-left whitespace-normal border-primary/50">
                               <div className="flex flex-col">
                                <div className="flex items-center font-medium"><Droplet className="w-3 h-3 mr-1.5 text-blue-500"/> {tank.name} ({tank.type})</div>
                                <div className="pl-[1.125rem] text-muted-foreground/90">
                                  Capacity: {tank.capacityLiters}L<br/>
                                  Pos: {formatPositionText(tank)}<br/>
                                   {typeof tank.distanceFromAxleCenterMm === 'number' && <span className="flex items-center"><ArrowLeftRight className="w-2.5 h-2.5 mr-1"/>Axle: {formatDimension(tank.distanceFromAxleCenterMm)}</span>}
                                </div>
                              </div>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardFooter>
                ) : null}
              </Card>
            )
          })}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogState.isOpen} onOpenChange={(isOpen) => setDeleteDialogState(prev => ({ ...prev, isOpen }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-destructive">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="font-body">
              Are you sure you want to delete the caravan: <strong>{deleteDialogState.caravanName}</strong>?
              This action cannot be undone and will delete all associated inventory, checklists, and water tank levels.
            </p>
            <p className="font-body mt-2">
              To confirm, please type "<strong>DELETE</strong>" in the box below.
            </p>
            <Input
              type="text"
              value={deleteDialogState.confirmationText}
              onChange={(e) => setDeleteDialogState(prev => ({ ...prev, confirmationText: e.target.value }))}
              placeholder='Type DELETE to confirm'
              className="mt-2 font-body"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogState({ isOpen: false, caravanId: null, caravanName: null, confirmationText: '' })} className="font-body">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCaravan}
              disabled={deleteDialogState.confirmationText !== "DELETE"}
              className="font-body"
            >
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

