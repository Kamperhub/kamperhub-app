
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { StoredWDH, WDHFormData } from '@/types/wdh';
import { WDHS_STORAGE_KEY, ACTIVE_WDH_ID_KEY } from '@/types/wdh';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { WDHForm } from './WDHForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, Link2, ShieldAlert, Settings2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const FREE_TIER_WDH_LIMIT = 1;

export function WDHManager() {
  const { toast } = useToast();
  const [wdhs, setWdhs] = useState<StoredWDH[]>([]);
  const [activeWdhId, setActiveWdhId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWdh, setEditingWdh] = useState<StoredWDH | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { isSubscribed, isLoading: isSubscriptionLoading } = useSubscription();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      try {
        const storedWdhs = localStorage.getItem(WDHS_STORAGE_KEY);
        if (storedWdhs) setWdhs(JSON.parse(storedWdhs));
        const storedActiveId = localStorage.getItem(ACTIVE_WDH_ID_KEY);
        if (storedActiveId) setActiveWdhId(storedActiveId);
      } catch (error) {
        console.error("Error loading WDH data from localStorage:", error);
        toast({ title: "Error Loading WDHs", variant: "destructive" });
      }
    }
  }, [hasMounted, toast]);

  const saveWdhsToStorage = useCallback((updatedWdhs: StoredWDH[]) => {
    if (!hasMounted || typeof window === 'undefined') return;
    try {
      localStorage.setItem(WDHS_STORAGE_KEY, JSON.stringify(updatedWdhs));
    } catch (error) {
      toast({ title: "Error Saving WDHs", variant: "destructive" });
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
      toast({ title: "Error Saving Active WDH", variant: "destructive" });
    }
  }, [toast, hasMounted]);

  const handleSaveWdh = (data: WDHFormData) => {
    if (!isSubscribed && wdhs.length >= FREE_TIER_WDH_LIMIT && !editingWdh) {
      toast({
        title: "Free Limit Reached",
        description: `You can only add ${FREE_TIER_WDH_LIMIT} WDH on the free plan. Upgrade to Pro for unlimited WDHs.`,
        variant: "destructive",
      });
      setIsFormOpen(false);
      return;
    }

    let updatedWdhs;
    if (editingWdh) {
      updatedWdhs = wdhs.map(w => w.id === editingWdh.id ? { ...editingWdh, ...data } : w);
      toast({ title: "WDH Updated", description: `${data.name} updated.` });
    } else {
      const newWdh: StoredWDH = { ...data, id: Date.now().toString() };
      updatedWdhs = [...wdhs, newWdh];
      toast({ title: "WDH Added", description: `${data.name} added.` });
    }
    setWdhs(updatedWdhs);
    saveWdhsToStorage(updatedWdhs);
    setIsFormOpen(false);
    setEditingWdh(null);
  };

  const handleEditWdh = (wdh: StoredWDH) => {
    setEditingWdh(wdh);
    setIsFormOpen(true);
  };

  const handleDeleteWdh = (id: string) => {
    const wdhToDelete = wdhs.find(w => w.id === id);
    if (window.confirm(`Are you sure you want to delete ${wdhToDelete?.name}?`)) {
      const updatedWdhs = wdhs.filter(w => w.id !== id);
      setWdhs(updatedWdhs);
      saveWdhsToStorage(updatedWdhs);
      if (activeWdhId === id) {
        setActiveWdhId(null);
        saveActiveWdhIdToStorage(null);
      }
      toast({ title: "WDH Deleted", description: `${wdhToDelete?.name} has been removed.` });
    }
  };

  const handleSetActiveWdh = (id: string) => {
    setActiveWdhId(id);
    saveActiveWdhIdToStorage(id);
    const wdh = wdhs.find(w => w.id === id);
    toast({ title: "Active WDH Set", description: `${wdh?.name} is now active.` });
  };

  const handleOpenFormForNew = () => {
    if (!isSubscribed && wdhs.length >= FREE_TIER_WDH_LIMIT) {
      toast({
        title: "Upgrade to Pro",
        description: `Manage more than ${FREE_TIER_WDH_LIMIT} WDH with KamperHub Pro!`,
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
    setEditingWdh(null);
    setIsFormOpen(true);
  };

  if (!hasMounted || isSubscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline flex items-center"><Link2 className="mr-2 h-5 w-5 text-primary" /> Weight Distribution Hitches</CardTitle>
            <Skeleton className="h-9 w-[180px]" />
          </div>
          <CardDescription className="font-body">
            Loading WDH data...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const canAddMoreWdhs = isSubscribed || wdhs.length < FREE_TIER_WDH_LIMIT;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline flex items-center"><Link2 className="mr-2 h-5 w-5 text-primary" /> Weight Distribution Hitches</CardTitle>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingWdh(null); // Reset editing state when dialog closes
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={!canAddMoreWdhs && !editingWdh}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New WDH
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle className="font-headline">{editingWdh ? 'Edit WDH' : 'Add New WDH'}</DialogTitle>
              </DialogHeader>
              <WDHForm
                initialData={editingWdh || undefined}
                onSave={handleSaveWdh}
                onCancel={() => { setIsFormOpen(false); setEditingWdh(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="font-body">
          Manage your Weight Distribution Hitches. Select one as active if used.
          {!isSubscribed && ` Free plan: ${FREE_TIER_WDH_LIMIT} WDH limit.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSubscribed && wdhs.length >= FREE_TIER_WDH_LIMIT && (
          <Alert variant="default" className="bg-primary/10 border-primary/30">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <AlertTitle className="font-headline text-primary">Free Tier Limit Reached</AlertTitle>
            <AlertDescription className="font-body text-primary/80">
              You've reached the maximum of {FREE_TIER_WDH_LIMIT} WDH for the free plan.
              <Link href="/subscribe" passHref>
                <Button variant="link" className="p-0 h-auto ml-1 text-primary hover:underline font-body">Upgrade to Pro</Button>
              </Link>
              &nbsp;to add unlimited WDHs.
            </AlertDescription>
          </Alert>
        )}
        {wdhs.length === 0 && hasMounted && (
          <p className="text-muted-foreground text-center font-body py-4">No WDHs added yet. Click "Add New WDH" to start.</p>
        )}
        {wdhs.map(wdh => (
          <Card key={wdh.id} className={`p-4 ${activeWdhId === wdh.id ? 'border-primary shadow-md' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold font-body text-lg">{wdh.name}</h3>
                <div className="text-sm text-muted-foreground font-body grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  <span>Type: {wdh.type}</span>
                  <span>Max Capacity: {wdh.maxCapacityKg}kg</span>
                  {wdh.minCapacityKg && <span>Min Capacity: {wdh.minCapacityKg}kg</span>}
                  <span>Integrated Sway: {wdh.hasIntegratedSwayControl ? 'Yes' : 'No'}</span>
                  {wdh.swayControlType && !wdh.hasIntegratedSwayControl && <span>Sway Control: {wdh.swayControlType}</span>}
                </div>
                {wdh.notes && <p className="text-xs text-muted-foreground font-body mt-1">Notes: {wdh.notes}</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center flex-shrink-0">
                {activeWdhId !== wdh.id && (
                  <Button variant="outline" size="sm" onClick={() => handleSetActiveWdh(wdh.id)} className="font-body">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Set Active
                  </Button>
                )}
                {activeWdhId === wdh.id && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-300 flex items-center font-body">
                    <CheckCircle className="mr-1 h-4 w-4" /> Active
                  </span>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleEditWdh(wdh)}>
                  <Edit3 className="h-5 w-5 text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteWdh(wdh.id)}>
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
