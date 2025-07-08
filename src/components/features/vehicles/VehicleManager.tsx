
"use client";

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StoredVehicle, VehicleFormData, VehicleStorageLocation } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { VehicleForm } from './VehicleForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, Fuel, Weight, Axe, Car, PackagePlus, MapPin, ArrowLeftRight, ArrowUpDown, Ruler, Backpack, Loader2, Disc, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  updateUserPreferences,
} from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types/auth';
import { useSubscription } from '@/hooks/useSubscription';

interface VehicleManagerProps {
    initialVehicles: StoredVehicle[];
    initialUserPrefs: Partial<UserProfile> | null;
}

export function VehicleManager({ initialVehicles, initialUserPrefs }: VehicleManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasProAccess } = useSubscription();
  const { user } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<StoredVehicle | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; vehicleId: string | null; vehicleName: string | null; confirmationText: string }>({
    isOpen: false,
    vehicleId: null,
    vehicleName: null,
    confirmationText: '',
  });

  const activeVehicleId = initialUserPrefs?.activeVehicleId;

  const invalidateAndRefetch = () => {
    // Instead of refetching, we can update the client cache for a faster UI response.
    // For simplicity and robustness, invalidation is fine here.
    queryClient.invalidateQueries({ queryKey: ['allVehicleData', user?.uid] });
  };
  
  const saveVehicleMutation = useMutation({
    mutationFn: (vehicleData: VehicleFormData | StoredVehicle) => {
      const dataToSend = editingVehicle ? { ...editingVehicle, ...vehicleData } : vehicleData;
      return 'id' in dataToSend && dataToSend.id ? updateVehicle(dataToSend as StoredVehicle) : createVehicle(dataToSend as VehicleFormData);
    },
    onSuccess: () => {
      invalidateAndRefetch();
      toast({
        title: editingVehicle ? "Vehicle Updated" : "Vehicle Added",
        description: `Vehicle details have been saved.`,
      });
      setIsFormOpen(false);
      setEditingVehicle(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Could not save the vehicle.",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
        invalidateAndRefetch();
        toast({ title: "Vehicle Deleted" });
        setDeleteDialogState({ isOpen: false, vehicleId: null, vehicleName: null, confirmationText: '' });
    },
    onError: (err: Error) => {
      invalidateAndRefetch();
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    },
  });

  const setActiveVehicleMutation = useMutation({
    mutationFn: (vehicleId: string) => updateUserPreferences({ activeVehicleId: vehicleId }),
    onSuccess: () => {
      invalidateAndRefetch();
      toast({ title: "Active Vehicle Set" });
    },
    onError: (error: Error) => {
       toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveVehicle = (data: VehicleFormData) => {
    saveVehicleMutation.mutate(data);
  };

  const handleEditVehicle = (vehicle: StoredVehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };
  
  const handleDeleteVehicle = (id: string, name: string) => {
    setDeleteDialogState({ isOpen: true, vehicleId: id, vehicleName: name, confirmationText: '' });
  };
  
  const confirmDeleteVehicle = () => {
    if (deleteDialogState.vehicleId && deleteDialogState.confirmationText === "DELETE") {
      deleteVehicleMutation.mutate(deleteDialogState.vehicleId);
    } else {
       setDeleteDialogState({ isOpen: false, vehicleId: null, vehicleName: null, confirmationText: '' });
    }
  };

  const handleSetActiveVehicle = (id: string) => {
    setActiveVehicleMutation.mutate(id);
  };
  
  const handleOpenFormForNew = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };
  
  const formatPositionText = (loc: VehicleStorageLocation) => {
    const longText = {
      'front-of-front-axle': 'Front of F.Axle',
      'between-axles': 'Between Axles',
      'rear-of-rear-axle': 'Rear of R.Axle',
      'roof-center': 'Roof Center'
    }[loc.longitudinalPosition];
    const latText = {
      'left': 'Left',
      'center': 'Center',
      'right': 'Right'
    }[loc.lateralPosition];
    return `${longText || loc.longitudinalPosition} / ${latText || loc.lateralPosition}`;
  };

  const formatDimension = (value: number | null | undefined, unit: string = 'kg') => {
    return typeof value === 'number' ? `${value}${unit}` : 'N/A';
  };

  const isAddButtonDisabled = !hasProAccess && initialVehicles.length >= 1;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">Tow Vehicles</CardTitle>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
              setIsFormOpen(isOpen);
              if (!isOpen) setEditingVehicle(null);
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={isAddButtonDisabled}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                  <DialogTitle className="font-headline">{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                  <VehicleForm
                    initialData={editingVehicle || undefined}
                    onSave={handleSaveVehicle}
                    onCancel={() => { setIsFormOpen(false); setEditingVehicle(null); }}
                    isLoading={saveVehicleMutation.isPending}
                  />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="font-body">
            Manage your tow vehicles. Select one as active for trip planning.
            {!hasProAccess && " (Free tier limit: 1)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {initialVehicles.length === 0 && <p className="text-muted-foreground text-center font-body py-4">No vehicles added yet. Click "Add New Vehicle" to start.</p>}
          {initialVehicles.map(vehicle => {
            const vehiclePayload = (typeof vehicle.gvm === 'number' && typeof vehicle.kerbWeight === 'number' && vehicle.gvm > 0 && vehicle.kerbWeight > 0 && vehicle.gvm >= vehicle.kerbWeight) ? vehicle.gvm - vehicle.kerbWeight : null;
            return (
              <Card key={vehicle.id} className={`p-4 ${activeVehicleId === vehicle.id ? 'border-primary shadow-md' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                  <div className="flex-grow">
                    <h3 className="font-semibold font-body text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <div className="text-sm text-muted-foreground font-body grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                      <span>GVM: {vehicle.gvm}kg</span>
                      <span>GCM: {vehicle.gcm}kg</span>
                      <span>Tow: {vehicle.maxTowCapacity}kg</span>
                      <span>Towball: {vehicle.maxTowballMass}kg</span>
                      <span className="flex items-center"><Weight className="w-3 h-3 mr-1 text-primary/70"/> Kerb: {formatDimension(vehicle.kerbWeight)}</span>
                      {vehiclePayload !== null && <span className="flex items-center"><Backpack className="w-3 h-3 mr-1 text-primary/70"/> Payload: {vehiclePayload.toFixed(0)}kg</span>}
                      <span className="flex items-center"><Axe className="w-3 h-3 mr-1 text-primary/70 rotate-90"/> F Axle: {formatDimension(vehicle.frontAxleLimit)}</span>
                      <span className="flex items-center"><Axe className="w-3 h-3 mr-1 text-primary/70 -rotate-90"/> R Axle: {formatDimension(vehicle.rearAxleLimit)}</span>
                      <span className="flex items-center"><Ruler className="w-3 h-3 mr-1 text-primary/70"/> Wheelbase: {formatDimension(vehicle.wheelbase, 'mm')}</span>
                      <span className="flex items-center"><Ruler className="w-3 h-3 mr-1 text-primary/70"/> Height: {formatDimension(vehicle.overallHeight, 'mm')}</span>
                      <span className="flex items-center"><Fuel className="w-3 h-3 mr-1 text-primary/70"/> {vehicle.fuelEfficiency} Litres/100km</span>
                      <span className="flex items-center col-span-full sm:col-span-2"><Disc className="w-3 h-3 mr-1 text-primary/70"/> Tyre PSI: {vehicle.recommendedTyrePressureUnladenPsi ?? 'N/A'} (Unladen) / {vehicle.recommendedTyrePressureLadenPsi ?? 'N/A'} (Laden)</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center self-start sm:self-auto flex-shrink-0 mt-2 sm:mt-0">
                    {activeVehicleId !== vehicle.id && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActiveVehicle(vehicle.id)} className="font-body whitespace-nowrap" disabled={setActiveVehicleMutation.isPending}>
                        {setActiveVehicleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4 text-green-500" />} Set Active
                      </Button>
                    )}
                     {activeVehicleId === vehicle.id && (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs h-8 w-full sm:w-auto flex items-center justify-center">
                        <CheckCircle className="mr-1 h-4 w-4" /> Active
                      </Badge>
                    )}
                    <div className="flex gap-1 w-full sm:w-auto">
                      <Button variant="ghost" size="sm" onClick={() => handleEditVehicle(vehicle)} className="font-body flex-grow sm:flex-grow-0">
                        <Edit3 className="h-4 w-4 sm:mr-1" /><span className="sm:hidden ml-1">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteVehicle(vehicle.id, `${vehicle.year} ${vehicle.make} ${vehicle.model}`)} className="font-body text-destructive hover:text-destructive hover:bg-destructive/10 flex-grow sm:flex-grow-0">
                        <Trash2 className="h-4 w-4 sm:mr-1" /><span className="sm:hidden ml-1">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <CardFooter className="p-0 pt-3 mt-3 border-t flex flex-col items-start space-y-3">
                  {vehicle.brakeControllerNotes && (
                    <div className="w-full">
                      <h4 className="text-sm font-semibold font-body mb-1 flex items-center"><Settings className="w-4 h-4 mr-2 text-primary"/>Brake Controller Notes:</h4>
                      <p className="text-xs font-body text-muted-foreground whitespace-pre-wrap pl-6">{vehicle.brakeControllerNotes}</p>
                    </div>
                  )}
                  {vehicle.storageLocations && vehicle.storageLocations.length > 0 && (
                  <div className="w-full">
                    <h4 className="text-sm font-semibold font-body mb-1.5 text-foreground flex items-center">
                      <PackagePlus className="w-4 h-4 mr-2 text-primary"/>Storage Locations:
                    </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                      {vehicle.storageLocations.map(loc => (
                        <div key={loc.id} className="p-3 border rounded-lg bg-card shadow-sm">
                          <h5 className="font-semibold font-body text-base flex items-center mb-1 text-primary">
                            <MapPin className="w-4 h-4 mr-2 text-accent" /> {loc.name}
                          </h5>
                          <div className="space-y-0.5 text-xs font-body text-muted-foreground">
                            <p><strong className="text-foreground/80">Position:</strong> {formatPositionText(loc)}</p>
                            <p><strong className="text-foreground/80">Max Capacity:</strong> {formatDimension(loc.maxWeightCapacityKg)}</p>
                            <p className="flex items-center"><ArrowLeftRight className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Dist. from Rear Axle:</strong>&nbsp;{formatDimension(loc.distanceFromRearAxleMm, 'mm')}</p>
                            <p className="flex items-center"><ArrowUpDown className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Dist. from Centerline:</strong>&nbsp;{formatDimension(loc.distanceFromCenterlineMm, 'mm')}</p>
                            <p className="flex items-center"><Ruler className="w-3 h-3 mr-1.5 text-primary/70" /> <strong className="text-foreground/80">Height from Ground:</strong>&nbsp;{formatDimension(loc.heightFromGroundMm, 'mm')}</p>
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
          <DialogHeader>
            <DialogTitle className="font-headline text-destructive">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="font-body">
              Are you sure you want to delete the vehicle: <strong>{deleteDialogState.vehicleName}</strong>?
              This action cannot be undone.
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
              disabled={deleteVehicleMutation.isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogState({ isOpen: false, vehicleId: null, vehicleName: null, confirmationText: '' })} className="font-body" disabled={deleteVehicleMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteVehicle}
              disabled={deleteDialogState.confirmationText !== "DELETE" || deleteVehicleMutation.isPending}
              className="font-body"
            >
              {deleteVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
