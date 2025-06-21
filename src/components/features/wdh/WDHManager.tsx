
"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { StoredWDH, WDHFormData } from '@/types/wdh';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { WDHForm } from './WDHForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, Link2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  fetchWdhs,
  createWdh,
  updateWdh,
  deleteWdh,
  fetchUserPreferences,
  updateUserPreferences
} from '@/lib/api-client';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from '@/hooks/useSubscription';

export function WDHManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasProAccess } = useSubscription();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWdh, setEditingWdh] = useState<StoredWDH | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; wdhId: string | null; wdhName: string | null; confirmationText: string }>({
    isOpen: false,
    wdhId: null,
    wdhName: null,
    confirmationText: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { data: wdhs = [], isLoading: isLoadingWdhs, error: wdhsError } = useQuery<StoredWDH[]>({
    queryKey: ['wdhs', user?.uid],
    queryFn: fetchWdhs,
    enabled: !!user,
  });

  const { data: userPrefs, isLoading: isLoadingPrefs, error: prefsError } = useQuery<Partial<UserProfile>>({
    queryKey: ['userPreferences', user?.uid],
    queryFn: fetchUserPreferences,
    enabled: !!user,
  });

  const activeWdhId = userPrefs?.activeWdhId;
  const isLoadingData = isLoadingWdhs || isLoadingPrefs;
  const queryError = wdhsError || prefsError;

  const saveWdhMutation = useMutation({
    mutationFn: (wdhData: WDHFormData | StoredWDH) => {
      const dataToSend = editingWdh ? { ...editingWdh, ...wdhData } : wdhData;
      return 'id' in dataToSend && dataToSend.id ? updateWdh(dataToSend as StoredWDH) : createWdh(dataToSend as WDHFormData);
    },
    onSuccess: (savedWdh) => {
      queryClient.invalidateQueries({ queryKey: ['wdhs', user?.uid] });
      toast({
        title: editingWdh ? "WDH Updated" : "WDH Added",
        description: `${savedWdh.name} has been saved.`,
      });
      setIsFormOpen(false);
      setEditingWdh(null);
    },
    onError: (error: Error) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteWdhMutation = useMutation({
    mutationFn: deleteWdh,
    onSuccess: (_, wdhId) => {
      queryClient.invalidateQueries({ queryKey: ['wdhs', user?.uid] });
      if (activeWdhId === wdhId) {
        queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.uid] });
      }
      toast({ title: "WDH Deleted" });
      setDeleteDialogState({ isOpen: false, wdhId: null, wdhName: null, confirmationText: '' });
    },
    onError: (error: Error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  const setActiveWdhMutation = useMutation({
    mutationFn: (wdhId: string) => updateUserPreferences({ activeWdhId: wdhId }),
    onSuccess: (_, wdhId) => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.uid] });
      const wdh = wdhs.find(w => w.id === wdhId);
      toast({ title: "Active WDH Set", description: `${wdh?.name} is now active.` });
    },
    onError: (error: Error) => {
       toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveWdh = (data: WDHFormData) => {
    saveWdhMutation.mutate(data);
  };

  const handleEditWdh = (wdh: StoredWDH) => {
    setEditingWdh(wdh);
    setIsFormOpen(true);
  };

  const handleDeleteWdh = (id: string, name: string) => {
    setDeleteDialogState({ isOpen: true, wdhId: id, wdhName: name, confirmationText: '' });
  };

  const confirmDeleteWdh = () => {
    if (deleteDialogState.wdhId && deleteDialogState.confirmationText === "DELETE") {
      deleteWdhMutation.mutate(deleteDialogState.wdhId);
    }
    setDeleteDialogState({ isOpen: false, wdhId: null, wdhName: null, confirmationText: '' });
  };

  const handleSetActiveWdh = (id: string) => {
    setActiveWdhMutation.mutate(id);
  };
  
  const handleOpenFormForNew = () => {
    setEditingWdh(null);
    setIsFormOpen(true);
  };
  
  const loadingSkeleton = (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-2/5" />
            <Skeleton className="h-9 w-[160px]" />
          </div>
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
  );

  if (isAuthLoading) {
    return loadingSkeleton;
  }
  
  if (!user) {
    return null; // Don't render anything if logged out
  }

  if (isLoadingData) {
    return loadingSkeleton;
  }

  if (queryError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading WDHs</CardTitle>
          <CardDescription>{queryError.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isAddButtonDisabled = !hasProAccess && wdhs.length >= 1;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline flex items-center"><Link2 className="mr-2 h-5 w-5 text-primary" /> Weight Distribution Hitches</CardTitle>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingWdh(null); }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isAddButtonDisabled}>
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
                  isLoading={saveWdhMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="font-body">
            Manage your Weight Distribution Hitches. Select one as active if used.
            {!hasProAccess && " (Free tier limit: 1)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wdhs.length === 0 && <p className="text-muted-foreground text-center font-body py-4">No WDHs added yet.</p>}
          {wdhs.map(wdh => (
            <Card key={wdh.id} className={`p-4 ${activeWdhId === wdh.id ? 'border-primary shadow-md' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold font-body text-lg">{wdh.name}</h3>
                  <div className="text-sm text-muted-foreground font-body grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <span>Type: {wdh.type}</span>
                    <span>Max Capacity: {wdh.maxCapacityKg}kg</span>
                    {wdh.minCapacityKg != null && <span>Min Capacity: {wdh.minCapacityKg}kg</span>}
                    <span>Integrated Sway: {wdh.hasIntegratedSwayControl ? 'Yes' : 'No'}</span>
                    {wdh.swayControlType && !wdh.hasIntegratedSwayControl && <span>Sway Control: {wdh.swayControlType}</span>}
                  </div>
                  {wdh.notes && <p className="text-xs text-muted-foreground font-body mt-1">Notes: {wdh.notes}</p>}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center flex-shrink-0">
                  {activeWdhId !== wdh.id && (
                    <Button variant="outline" size="sm" onClick={() => handleSetActiveWdh(wdh.id)} className="font-body" disabled={setActiveWdhMutation.isPending}>
                       {setActiveWdhMutation.isPending && setActiveWdhMutation.variables === wdh.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4 text-green-500" />} Set Active
                    </Button>
                  )}
                  {activeWdhId === wdh.id && <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs h-9 flex items-center justify-center"><CheckCircle className="mr-1 h-4 w-4" /> Active</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => handleEditWdh(wdh)}><Edit3 className="h-5 w-5 text-blue-600" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteWdh(wdh.id, wdh.name)}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogState.isOpen} onOpenChange={(isOpen) => setDeleteDialogState(prev => ({ ...prev, isOpen }))}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-headline text-destructive">Confirm Deletion</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="font-body">Are you sure you want to delete the WDH: <strong>{deleteDialogState.wdhName}</strong>? This action cannot be undone.</p>
            <p className="font-body mt-2">To confirm, please type "<strong>DELETE</strong>" in the box below.</p>
            <Input type="text" value={deleteDialogState.confirmationText} onChange={(e) => setDeleteDialogState(prev => ({ ...prev, confirmationText: e.target.value }))} placeholder='Type DELETE to confirm' className="mt-2 font-body" disabled={deleteWdhMutation.isPending}/>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogState({ isOpen: false, wdhId: null, wdhName: null, confirmationText: '' })} className="font-body" disabled={deleteWdhMutation.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteWdh} disabled={deleteDialogState.confirmationText !== "DELETE" || deleteWdhMutation.isPending} className="font-body">
              {deleteWdhMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
