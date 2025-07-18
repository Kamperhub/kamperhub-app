
"use client";

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StoredCaravan, CaravanFormData } from '@/types/caravan';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CaravanForm } from './CaravanForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, Link2 as LinkIcon, Ruler, PackagePlus, MapPin, Droplet, Weight, Axe, Loader2, Disc, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  createCaravan, 
  updateCaravan, 
  deleteCaravan,
  updateUserPreferences,
} from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from '@/hooks/useSubscription';

interface CaravanManagerProps {
    initialCaravans: StoredCaravan[];
    initialUserPrefs: Partial<UserProfile> | null;
}

export function CaravanManager({ initialCaravans, initialUserPrefs }: CaravanManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasProAccess } = useSubscription();
  const { user } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCaravan, setEditingCaravan] = useState<StoredCaravan | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; caravanId: string | null; caravanName: string | null; confirmationText: string }>({
    isOpen: false,
    caravanId: null,
    caravanName: null,
    confirmationText: '',
  });

  const activeCaravanId = initialUserPrefs?.activeCaravanId;
  
  const invalidateAndRefetch = () => {
    queryClient.invalidateQueries({ queryKey: ['allVehicleData', user?.uid] });
  };

  const saveCaravanMutation = useMutation({
    mutationFn: (caravanData: CaravanFormData) => {
      if (editingCaravan) {
        // We are updating. Ensure the ID is included for the API call.
        const dataToSend: StoredCaravan = {
          ...caravanData,
          id: editingCaravan.id
        }
        return updateCaravan(dataToSend);
      } else {
        // We are creating a new one.
        return createCaravan(caravanData);
      }
    },
    onSuccess: (savedCaravan) => {
      invalidateAndRefetch();
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
    onSuccess: () => {
        invalidateAndRefetch();
        toast({ title: "Caravan Deleted" });
        setDeleteDialogState({ isOpen: false, caravanId: null, caravanName: null, confirmationText: '' });
    },
    onError: (err: Error) => {
        invalidateAndRefetch();
        toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });


  const setActiveCaravanMutation = useMutation({
    mutationFn: (caravanId: string) => updateUserPreferences({ activeCaravanId: caravanId }),
    onSuccess: () => {
      invalidateAndRefetch();
      toast({ title: "Active Caravan Set" });
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

  const formatDimension = (value: number | null | undefined, unit: string = 'mm') => {
    return typeof value === 'number' ? `${value}${unit}` : 'N/A';
  };

  const formatPositionText = (item: { longitudinalPosition: string; lateralPosition: string; }) => {
    const longText = { 'front-of-axles': 'Front', 'over-axles': 'Over Axles', 'rear-of-axles': 'Rear' }[item.longitudinalPosition] || item.longitudinalPosition;
    const latText = { 'left': 'Left', 'center': 'Center', 'right': 'Right' }[item.lateralPosition] || item.lateralPosition;
    return `${longText} / ${latText}`;
  };

  const isAddButtonDisabled = !hasProAccess && initialCaravans.length >= 1;

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
          {initialCaravans.length === 0 && <p className="text-muted-foreground text-center font-body py-4">No caravans added yet.</p>}
          {initialCaravans.map(caravan => {
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
                      <span className="flex items-center"><Axe className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Axle Rating: {caravan.axleGroupRating}kg</span>
                      <span className="flex items-center"><Weight className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Towball: {caravan.maxTowballDownload}kg</span>
                      <span className="flex items-center"><Ruler className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Length: {formatDimension(caravan.overallLength)}</span>
                      <span className="flex items-center"><Ruler className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Height: {formatDimension(caravan.overallHeight)}</span>
                      {caravan.numberOfGasBottles && caravan.gasBottleCapacityKg && <span className="flex items-center"><Flame className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Gas: {caravan.numberOfGasBottles} x {caravan.gasBottleCapacityKg}kg</span>}
                      <span className="flex items-center col-span-full sm:col-span-2 md:col-span-1"><Disc className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> Tyres: {caravan.tyreSize || 'N/A'} @ {caravan.recommendedTyrePressurePsi || 'N/A'} PSI</span>
                      {caravan.wdh && <span className="flex items-center col-span-full sm:col-span-1 md:col-span-1"><LinkIcon className="w-3.5 h-3.5 mr-1.5 text-primary/80"/> WDH: {caravan.wdh.name}</span>}
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

                <CardFooter className="p-0 pt-3 mt-3 border-t flex flex-col items-start space-y-3">
                  {(caravan.storageLocations && caravan.storageLocations.length > 0) && (
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
                  {(caravan.waterTanks && caravan.waterTanks.length > 0) && (
                    <div className="w-full">
                      <h4 className="text-sm font-semibold font-body mb-1.5 text-foreground flex items-center"><Droplet className="w-4 h-4 mr-2 text-primary"/>Water Tanks:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                        {caravan.waterTanks.map(tank => (
                          <div key={tank.id} className="p-3 border rounded-lg bg-card shadow-sm">
                              <h5 className="font-semibold font-body text-base flex items-center mb-1 text-primary"><Droplet className="w-4 h-4 mr-2 text-accent" /> {tank.name}</h5>
                              <div className="space-y-0.5 text-xs font-body text-muted-foreground">
                                  <p><strong className="text-foreground/80">Type:</strong> {tank.type.charAt(0).toUpperCase() + tank.type.slice(1)}</p>
                                  <p><strong className="text-foreground/80">Capacity:</strong> {tank.capacityLitres}L</p>
                                  <p><strong className="text-foreground/80">Position:</strong> {formatPositionText(tank)}</p>
                              </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardFooter>
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
