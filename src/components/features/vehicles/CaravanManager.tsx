
"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { StoredCaravan, CaravanFormData, StorageLocation, WaterTank } from '@/types/caravan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CaravanForm } from './CaravanForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, Link2 as LinkIcon, Ruler, PackagePlus, MapPin, ArrowLeftRight, ArrowUpDown, Droplet, Weight, Axe, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  fetchCaravans, 
  createCaravan, 
  updateCaravan, 
  deleteCaravan,
  fetchWdhs,
  fetchUserPreferences,
  updateUserPreferences
} from '@/lib/api-client';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/types/auth';
import type { StoredWDH } from '@/types/wdh';
import { useSubscription } from '@/hooks/useSubscription';

export function CaravanManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasProAccess } = useSubscription();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCaravan, setEditingCaravan] = useState<StoredCaravan | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; caravanId: string | null; caravanName: string | null; confirmationText: string }>({
    isOpen: false,
    caravanId: null,
    caravanName: null,
    confirmationText: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { data: caravans = [], isLoading: isLoadingCaravans, error: caravansError } = useQuery<StoredCaravan[]>({
    queryKey: ['caravans', user?.uid],
    queryFn: fetchCaravans,
    enabled: !!user,
  });

  const { data: allWdhs = [] } = useQuery<StoredWDH[]>({
    queryKey: ['wdhs', user?.uid],
    queryFn: fetchWdhs,
    enabled: !!user,
  });

  const { data: userPrefs, isLoading: isLoadingPrefs, error: prefsError } = useQuery<Partial<UserProfile>>({
    queryKey: ['userPreferences', user?.uid],
    queryFn: fetchUserPreferences,
    enabled: !!user,
  });

  const activeCaravanId = userPrefs?.activeCaravanId;
  const isLoadingData = isLoadingCaravans || isLoadingPrefs;
  const queryError = caravansError || prefsError;

  const saveCaravanMutation = useMutation({
    mutationFn: (caravanData: CaravanFormData | StoredCaravan) => {
      const dataToSend = editingCaravan ? { ...editingCaravan, ...caravanData } : caravanData;
      return 'id' in dataToSend && dataToSend.id ? updateCaravan(dataToSend as StoredCaravan) : createCaravan(dataToSend as CaravanFormData);
    },
    onSuccess: (savedCaravan) => {
      queryClient.invalidateQueries({ queryKey: ['caravans', user?.uid] });
      toast({
        title: editingCaravan ? "Caravan Updated" : "Caravan Added",
        description: `${savedCaravan.make} ${savedCaravan.model} has been saved.`,
      });
      setIsFormOpen(false);
      setEditingCaravan(null);
    },
    onError: (error: Error) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    },
  });

  const deleteCaravanMutation = useMutation({
    mutationFn: deleteCaravan,
    onSuccess: (_, caravanId) => {
      queryClient.invalidateQueries({ queryKey: ['caravans', user?.uid] });
      // TODO: Invalidate inventory and water levels for this caravanId
      if (activeCaravanId === caravanId) {
        queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.uid] });
      }
      toast({ title: "Caravan Deleted" });
      setDeleteDialogState({ isOpen: false, caravanId: null, caravanName: null, confirmationText: '' });
    },
    onError: (error: Error) => {
      toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
    },
  });

  const setActiveCaravanMutation = useMutation({
    mutationFn: (caravanId: string) => {
      const caravan = caravans.find(c => c.id === caravanId);
      const associatedWdhId = caravan?.associatedWdhId || null;
      return updateUserPreferences({ activeCaravanId: caravanId, activeWdhId: associatedWdhId });
    },
    onSuccess: (_, caravanId) => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.uid] });
      const caravan = caravans.find(c => c.id === caravanId);
      let toastMessage = `${caravan?.make} ${caravan?.model} is now active.`;
       if (caravan?.associatedWdhId) {
          toastMessage += ` Associated WDH activated.`;
       } else {
          toastMessage += ` No WDH associated.`
       }
      toast({ title: "Active Caravan Set", description: toastMessage });
    },
    onError: (error: Error) => {
       toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveCaravan = (data: CaravanFormData) => {
    saveCaravanMutation.mutate(data);
  };

  const handleEditCaravan = (caravan: StoredCaravan) => {
    setEditingCaravan(caravan);
    setIsFormOpen(true);
  };

  const handleDeleteCaravan = (id: string, name: string) => {
    setDeleteDialogState({ isOpen: true, caravanId: id, caravanName: name, confirmationText: '' });
  };
  
  const confirmDeleteCaravan = () => {
    if (deleteDialogState.caravanId && deleteDialogState.confirmationText === "DELETE") {
      deleteCaravanMutation.mutate(deleteDialogState.caravanId);
    } else {
       setDeleteDialogState({ isOpen: false, caravanId: null, caravanName: null, confirmationText: '' });
    }
  };

  const handleSetActiveCaravan = (id: string) => {
    setActiveCaravanMutation.mutate(id);
  };

  const handleOpenFormForNew = () => {
    setEditingCaravan(null);
    setIsFormOpen(true);
  };

  const getWdhNameById = (wdhId: string | null | undefined) => {
    if (!wdhId) return null;
    const wdh = allWdhs.find(w => w.id === wdhId);
    return wdh ? wdh.name : `WDH (ID not found)`;
  };

  const formatDimension = (value: number | null | undefined, unit: string = 'mm') => {
    return typeof value === 'number' ? `${value}${unit}` : 'N/A';
  };

  const formatPositionText = (item: { longitudinalPosition: string; lateralPosition: string; }) => {
    const longText = { 'front-of-axles': 'Front', 'over-axles': 'Over Axles', 'rear-of-axles': 'Rear' }[item.longitudinalPosition] || item.longitudinalPosition;
    const latText = { 'left': 'Left', 'center': 'Center', 'right': 'Right' }[item.lateralPosition] || item.lateralPosition;
    return `${longText} / ${latText}`;
  };
  
  const loadingSkeleton = (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-9 w-[190px]" />
        </div>
        <Skeleton className="h-4 w-2/3 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full" />
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
                <CardTitle className="text-destructive">Error Loading Caravans</CardTitle>
                <CardDescription>{queryError.message}</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  const isAddButtonDisabled = !hasProAccess && caravans.length >= 1;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">Caravans</CardTitle>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingCaravan(null); }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isAddButtonDisabled}>
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
                    isLoading={saveCaravanMutation.isPending}
                  />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="font-body">
            Manage your caravans. Select one as active for inventory and planning.
            {!hasProAccess && " (Free tier limit: 1)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {caravans.length === 0 && <p className="text-muted-foreground text-center font-body py-4">No caravans added yet.</p>}
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
                      {caravanGrossPayload !== null && <span className="flex items-center"><PackagePlus className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Payload: {caravanGrossPayload.toFixed(0)}kg</span>}
                      <span className="flex items-center"><Weight className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> GTM: {caravan.gtm}kg</span>
                      <span className="flex items-center"><Weight className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Towball: {caravan.maxTowballDownload}kg</span>
                      <span className="flex items-center"><Axe className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Axles: {typeof caravan.numberOfAxles === 'number' ? caravan.numberOfAxles : 'N/A'}</span>
                      {caravan.associatedWdhId && getWdhNameById(caravan.associatedWdhId) && <span className="flex items-center col-span-full sm:col-span-1 md:col-span-1"><LinkIcon className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> WDH: {getWdhNameById(caravan.associatedWdhId)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center self-start sm:self-auto flex-shrink-0 mt-2 sm:mt-0">
                    {activeCaravanId !== caravan.id && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActiveCaravan(caravan.id)} className="font-body w-full sm:w-auto" disabled={setActiveCaravanMutation.isPending}>
                        {setActiveCaravanMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4 text-green-500" />} Set Active
                      </Button>
                    )}
                    {activeCaravanId === caravan.id && <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs h-8 w-full sm:w-auto flex items-center justify-center"><CheckCircle className="mr-1 h-4 w-4" /> Active</Badge>}
                    <div className="flex gap-1 w-full sm:w-auto">
                      <Button variant="ghost" size="sm" onClick={() => handleEditCaravan(caravan)} className="font-body flex-grow sm:flex-grow-0"><Edit3 className="h-4 w-4 sm:mr-1" /><span className="sm:hidden ml-1">Edit</span></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCaravan(caravan.id, `${caravan.year} ${caravan.make} ${caravan.model}`)} className="font-body text-destructive hover:text-destructive hover:bg-destructive/10 flex-grow sm:flex-grow-0"><Trash2 className="h-4 w-4 sm:mr-1" /><span className="sm:hidden ml-1">Delete</span></Button>
                    </div>
                  </div>
                </div>

                {(caravan.storageLocations && caravan.storageLocations.length > 0) || (caravan.waterTanks && caravan.waterTanks.length > 0) ? (
                  <CardFooter className="p-0 pt-3 mt-3 border-t flex flex-col items-start space-y-3">
                    {caravan.storageLocations && caravan.storageLocations.length > 0 && (
                      <div className="w-full">
                        <h4 className="text-sm font-semibold font-body mb-1.5 text-foreground flex items-center"><PackagePlus className="w-4 h-4 mr-2 text-primary"/>Storage Locations:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                          {caravan.storageLocations.map(loc => (
                            <div key={loc.id} className="p-3 border rounded-lg bg-card shadow-sm">
                              <h5 className="font-semibold font-body text-base flex items-center mb-1 text-primary"><MapPin className="w-4 h-4 mr-2 text-accent" /> {loc.name}</h5>
                              <div className="space-y-0.5 text-xs font-body text-muted-foreground">
                                <p><strong className="text-foreground/80">Position:</strong> {formatPositionText(loc)}</p>
                                <p><strong className="text-foreground/80">Max Capacity:</strong> {formatDimension(loc.maxWeightCapacityKg, 'kg')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {caravan.waterTanks && caravan.waterTanks.length > 0 && (
                      <div className="w-full">
                        <h4 className="text-sm font-semibold font-body mb-1.5 text-foreground flex items-center"><Droplet className="w-4 h-4 mr-2 text-primary"/>Water Tanks:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                          {caravan.waterTanks.map(tank => (
                            <div key={tank.id} className="p-3 border rounded-lg bg-card shadow-sm">
                                <h5 className="font-semibold font-body text-base flex items-center mb-1 text-primary"><Droplet className="w-4 h-4 mr-2 text-accent" /> {tank.name}</h5>
                                <div className="space-y-0.5 text-xs font-body text-muted-foreground">
                                    <p><strong className="text-foreground/80">Type:</strong> {tank.type.charAt(0).toUpperCase() + tank.type.slice(1)}</p>
                                    <p><strong className="text-foreground/80">Capacity:</strong> {tank.capacityLiters}L</p>
                                    <p><strong className="text-foreground/80">Position:</strong> {formatPositionText(tank)}</p>
                                </div>
                            </div>
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
          <DialogHeader><DialogTitle className="font-headline text-destructive">Confirm Deletion</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="font-body">Are you sure you want to delete the caravan: <strong>{deleteDialogState.caravanName}</strong>? This action cannot be undone.</p>
            <p className="font-body mt-2">To confirm, please type "<strong>DELETE</strong>" in the box below.</p>
            <Input type="text" value={deleteDialogState.confirmationText} onChange={(e) => setDeleteDialogState(prev => ({ ...prev, confirmationText: e.target.value }))} placeholder='Type DELETE to confirm' className="mt-2 font-body" disabled={deleteCaravanMutation.isPending}/>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogState({ isOpen: false, caravanId: null, caravanName: null, confirmationText: '' })} className="font-body" disabled={deleteCaravanMutation.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteCaravan} disabled={deleteDialogState.confirmationText !== "DELETE" || deleteCaravanMutation.isPending} className="font-body">
              {deleteCaravanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
