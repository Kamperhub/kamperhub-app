
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import type { StoredWDH } from '@/types/wdh';
import { WDHS_STORAGE_KEY, ACTIVE_WDH_ID_KEY } from '@/types/wdh';
import type { CaravanInventories } from '@/types/inventory';
import { INVENTORY_STORAGE_KEY } from '@/types/inventory';
import type { CaravanChecklists } from '@/types/checklist';
import { CHECKLISTS_STORAGE_KEY } from '@/types/checklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CaravanForm } from './CaravanForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, ShieldAlert, Settings2, Link2 as LinkIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription'; 
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


const CARAVANS_STORAGE_KEY = 'kamperhub_caravans_list';
const ACTIVE_CARAVAN_ID_KEY = 'kamperhub_active_caravan_id';
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
        if (storedCaravans) setCaravans(JSON.parse(storedCaravans));
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
    if (editingCaravan) {
      updatedCaravans = caravans.map(c => c.id === editingCaravan.id ? { ...c, ...data } : c);
      toast({ title: "Caravan Updated", description: `${data.make} ${data.model} updated.` });
    } else {
      const newCaravan: StoredCaravan = { ...data, id: Date.now().toString() };
      updatedCaravans = [...caravans, newCaravan];
      toast({ title: "Caravan Added", description: `${data.make} ${data.model} added.` });
    }
    setCaravans(updatedCaravans);
    saveCaravansToStorage(updatedCaravans);
    setIsFormOpen(false);
    setEditingCaravan(null);
  };

  const handleEditCaravan = (caravan: StoredCaravan) => {
    setEditingCaravan(caravan);
    setIsFormOpen(true);
  };

  const handleDeleteCaravan = (id: string) => {
    if (!hasMounted || typeof window === 'undefined') return;
    const caravanToDelete = caravans.find(c => c.id === id);
    if (window.confirm(`Are you sure you want to delete ${caravanToDelete?.make} ${caravanToDelete?.model}? This will also delete its inventory and checklists.`)) {
      const updatedCaravans = caravans.filter(c => c.id !== id);
      setCaravans(updatedCaravans);
      saveCaravansToStorage(updatedCaravans);

      try {
        const allInventoriesJson = localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (allInventoriesJson) {
          const allInventories: CaravanInventories = JSON.parse(allInventoriesJson);
          if (allInventories[id]) {
            delete allInventories[id];
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
          if (allChecklists[id]) {
            delete allChecklists[id];
            localStorage.setItem(CHECKLISTS_STORAGE_KEY, JSON.stringify(allChecklists));
          }
        }
      } catch (error) {
        console.error("Error deleting caravan checklists from localStorage:", error);
        toast({ title: "Error Deleting Checklists", description: "Could not remove associated checklist data.", variant: "destructive" });
      }

      if (activeCaravanId === id) {
        setActiveCaravanId(null);
        saveActiveCaravanIdToStorage(null);
        saveActiveWdhIdToStorage(null); // Also clear active WDH if the active caravan is deleted
      }
      toast({ title: "Caravan Deleted", description: `${caravanToDelete?.make} ${caravanToDelete?.model}, its inventory, and checklists have been removed.` });
    }
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
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle className="font-headline">{editingCaravan ? 'Edit Caravan' : 'Add New Caravan'}</DialogTitle>
              </DialogHeader>
              <CaravanForm
                initialData={editingCaravan || undefined}
                onSave={handleSaveCaravan}
                onCancel={() => { setIsFormOpen(false); setEditingCaravan(null); }}
              />
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
        {caravans.map(caravan => (
          <Card key={caravan.id} className={`p-4 ${activeCaravanId === caravan.id ? 'border-primary shadow-md' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold font-body text-lg">{caravan.year} {caravan.make} {caravan.model}</h3>
                <div className="text-sm text-muted-foreground font-body grid grid-cols-2 md:grid-cols-3 gap-x-4">
                  <span>Tare: {caravan.tareMass}kg</span>
                  <span>ATM: {caravan.atm}kg</span>
                  <span>GTM: {caravan.gtm}kg</span>
                  <span>Towball: {caravan.maxTowballDownload}kg</span>
                  <span className="flex items-center"><Settings2 className="w-3 h-3 mr-1 text-primary/70"/> Axles: {caravan.numberOfAxles}</span>
                  {caravan.associatedWdhId && getWdhNameById(caravan.associatedWdhId) && (
                     <span className="flex items-center col-span-full sm:col-span-1"><LinkIcon className="w-3 h-3 mr-1 text-primary/70"/> WDH: {getWdhNameById(caravan.associatedWdhId)}</span>
                  )}
                </div>
              </div>
               <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                {activeCaravanId !== caravan.id && (
                  <Button variant="outline" size="sm" onClick={() => handleSetActiveCaravan(caravan.id)} className="font-body">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Set Active
                  </Button>
                )}
                {activeCaravanId === caravan.id && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-300 flex items-center font-body">
                    <CheckCircle className="mr-1 h-4 w-4" /> Active
                  </span>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleEditCaravan(caravan)}>
                  <Edit3 className="h-5 w-5 text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteCaravan(caravan.id)}>
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
