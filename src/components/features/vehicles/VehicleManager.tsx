
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { StoredVehicle, VehicleFormData, VehicleStorageLocation } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { VehicleForm } from './VehicleForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, Fuel, ShieldAlert, Weight, Axe, Car, PackagePlus, MapPin, ArrowLeftRight, ArrowUpDown, Ruler, Backpack } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const VEHICLES_STORAGE_KEY = 'kamperhub_vehicles_list';
const ACTIVE_VEHICLE_ID_KEY = 'kamperhub_active_vehicle_id';
const FREE_TIER_VEHICLE_LIMIT = 1;

export function VehicleManager() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<StoredVehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<StoredVehicle | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const { isSubscribed, isLoading: isSubscriptionLoading } = useSubscription();
  const [deleteDialogState, setDeleteDialogState] = useState<{ isOpen: boolean; vehicleId: string | null; vehicleName: string | null; confirmationText: string }>({
    isOpen: false,
    vehicleId: null,
    vehicleName: null,
    confirmationText: '',
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      try {
        const storedVehicles = localStorage.getItem(VEHICLES_STORAGE_KEY);
        if (storedVehicles) {
          const parsedVehicles: StoredVehicle[] = JSON.parse(storedVehicles);
          // Sanitize data: ensure storageLocations is always an array
          const sanitizedVehicles = parsedVehicles.map(v => ({
            ...v,
            storageLocations: Array.isArray(v.storageLocations) ? v.storageLocations : [],
          }));
          setVehicles(sanitizedVehicles);
        }
        const storedActiveId = localStorage.getItem(ACTIVE_VEHICLE_ID_KEY);
        if (storedActiveId) {
          setActiveVehicleId(storedActiveId);
        }
      } catch (error) {
        console.error("Error loading vehicle data from localStorage:", error);
        toast({ title: "Error Loading Vehicles", variant: "destructive", description: "Could not load vehicle data. Your saved vehicles might not appear." });
      }
    }
  }, [hasMounted, toast]);

  const saveVehiclesToStorage = useCallback((updatedVehicles: StoredVehicle[]) => {
    if (!hasMounted || typeof window === 'undefined') return;
    try {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
    } catch (error) {
      toast({ title: "Error Saving Vehicles", variant: "destructive", description: "Your changes might not be saved." });
    }
  }, [toast, hasMounted]);

  const saveActiveVehicleIdToStorage = useCallback((id: string | null) => {
    if (!hasMounted || typeof window === 'undefined') return;
    try {
      if (id) {
        localStorage.setItem(ACTIVE_VEHICLE_ID_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_VEHICLE_ID_KEY);
      }
    } catch (error) {
      toast({ title: "Error Saving Active Vehicle", variant: "destructive", description: "Active vehicle selection might not be saved." });
    }
  }, [toast, hasMounted]);

  const handleSaveVehicle = (data: VehicleFormData) => {
    if (!isSubscribed && vehicles.length >= FREE_TIER_VEHICLE_LIMIT && !editingVehicle) {
      toast({
        title: "Free Limit Reached",
        description: `You can only add ${FREE_TIER_VEHICLE_LIMIT} vehicle on the free plan. Upgrade to Pro for unlimited vehicles.`,
        variant: "destructive",
      });
      setIsFormOpen(false);
      return;
    }

    let updatedVehicles;
    if (editingVehicle) {
      updatedVehicles = vehicles.map(v => v.id === editingVehicle.id ? { ...editingVehicle, ...data, storageLocations: data.storageLocations || [] } : v);
      toast({ title: "Vehicle Updated", description: `${data.make} ${data.model} updated.` });
    } else {
      const newVehicle: StoredVehicle = { ...data, id: Date.now().toString(), storageLocations: data.storageLocations || [] };
      updatedVehicles = [...vehicles, newVehicle];
      toast({ title: "Vehicle Added", description: `${data.make} ${data.model} added.` });
    }
    setVehicles(updatedVehicles);
    saveVehiclesToStorage(updatedVehicles);
    setIsFormOpen(false);
    setEditingVehicle(null);
  };

  const handleEditVehicle = (vehicle: StoredVehicle) => {
    setEditingVehicle({...vehicle, storageLocations: vehicle.storageLocations || []});
    setIsFormOpen(true);
  };

  const handleDeleteVehicle = (id: string, name: string) => {
    setDeleteDialogState({ isOpen: true, vehicleId: id, vehicleName: name, confirmationText: '' });
  };

  const confirmDeleteVehicle = () => {
    if (deleteDialogState.vehicleId && deleteDialogState.confirmationText === "DELETE") {
      const updatedVehicles = vehicles.filter(v => v.id !== deleteDialogState.vehicleId);
      setVehicles(updatedVehicles);
      saveVehiclesToStorage(updatedVehicles);
      if (activeVehicleId === deleteDialogState.vehicleId) {
        setActiveVehicleId(null);
        saveActiveVehicleIdToStorage(null);
      }
      toast({ title: "Vehicle Deleted", description: `${deleteDialogState.vehicleName} has been removed.` });
    }
    setDeleteDialogState({ isOpen: false, vehicleId: null, vehicleName: null, confirmationText: '' });
  };


  const handleSetActiveVehicle = (id: string) => {
    setActiveVehicleId(id);
    saveActiveVehicleIdToStorage(id);
    const vehicle = vehicles.find(v => v.id === id);
    toast({ title: "Active Vehicle Set", description: `${vehicle?.make} ${vehicle?.model} is now active.` });
  };

  const handleOpenFormForNew = () => {
    if (!isSubscribed && vehicles.length >= FREE_TIER_VEHICLE_LIMIT) {
      toast({
        title: "Upgrade to Pro",
        description: `Manage more than ${FREE_TIER_VEHICLE_LIMIT} vehicle with KamperHub Pro!`,
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

  const formatDimension = (value: number | null | undefined, unit: string = 'mm') => {
    return typeof value === 'number' ? `${value}${unit}` : 'N/A';
  };

  if (!hasMounted || isSubscriptionLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">Tow Vehicles</CardTitle>
            <Skeleton className="h-9 w-[180px]" />
          </div>
          <CardDescription className="font-body">
            Loading vehicle data...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  const canAddMoreVehicles = isSubscribed || vehicles.length < FREE_TIER_VEHICLE_LIMIT;

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
                <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body" disabled={!canAddMoreVehicles && !editingVehicle}>
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
                  />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="font-body">
            Manage your tow vehicles. Select one as active for trip planning.
            {!isSubscribed && ` Free plan: ${FREE_TIER_VEHICLE_LIMIT} vehicle limit.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSubscribed && vehicles.length >= FREE_TIER_VEHICLE_LIMIT && (
            <Alert variant="default" className="bg-primary/10 border-primary/30">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <AlertTitle className="font-headline text-primary">Free Tier Limit Reached</AlertTitle>
              <AlertDescription className="font-body text-primary/80">
                You've reached the maximum of {FREE_TIER_VEHICLE_LIMIT} vehicle for the free plan.
                <Link href="/subscribe" passHref>
                  <Button variant="link" className="p-0 h-auto ml-1 text-primary hover:underline font-body">Upgrade to Pro</Button>
                </Link>
                &nbsp;to add unlimited vehicles.
              </AlertDescription>
            </Alert>
          )}
          {vehicles.length === 0 && hasMounted && (
            <p className="text-muted-foreground text-center font-body py-4">No vehicles added yet. Click "Add New Vehicle" to start.</p>
          )}
          {vehicles.map(vehicle => {
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
                      <span className="flex items-center"><Weight className="w-3 h-3 mr-1 text-primary/70"/> Kerb: {formatDimension(vehicle.kerbWeight, 'kg')}</span>
                      {vehiclePayload !== null && <span className="flex items-center"><Backpack className="w-3 h-3 mr-1 text-primary/70"/> Payload: {vehiclePayload.toFixed(0)}kg</span>}
                      <span className="flex items-center"><Axe className="w-3 h-3 mr-1 text-primary/70 rotate-90"/> F Axle: {formatDimension(vehicle.frontAxleLimit, 'kg')}</span>
                      <span className="flex items-center"><Axe className="w-3 h-3 mr-1 text-primary/70 -rotate-90"/> R Axle: {formatDimension(vehicle.rearAxleLimit, 'kg')}</span>
                      <span className="flex items-center"><Ruler className="w-3 h-3 mr-1 text-primary/70"/> Wheelbase: {formatDimension(vehicle.wheelbase, 'mm')}</span>
                      <span className="flex items-center"><Fuel className="w-3 h-3 mr-1 text-primary/70"/> {vehicle.fuelEfficiency}L/100km</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center self-start sm:self-auto flex-shrink-0 mt-2 sm:mt-0">
                    {activeVehicleId !== vehicle.id && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActiveVehicle(vehicle.id)} className="font-body whitespace-nowrap">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Set Active
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
                {vehicle.storageLocations && vehicle.storageLocations.length > 0 && (
                  <CardFooter className="p-0 pt-3 mt-3 border-t">
                    <div>
                      <h4 className="text-sm font-semibold font-body mb-1.5 text-foreground flex items-center">
                        <PackagePlus className="w-4 h-4 mr-2 text-primary"/>Storage Locations:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                        {vehicle.storageLocations.map(loc => (
                          <Badge key={loc.id} variant="secondary" className="font-normal font-body py-1 px-2 h-auto text-left whitespace-normal">
                            <div className="flex flex-col">
                              <div className="flex items-center font-medium"><MapPin className="w-3 h-3 mr-1.5"/> {loc.name}</div>
                              <div className="pl-[1.125rem] text-muted-foreground/90">
                                Pos: {formatPositionText(loc)}<br/>
                                Capacity: {formatDimension(loc.maxWeightCapacityKg, 'kg')}<br/>
                                <span className="flex items-center"><ArrowLeftRight className="w-2.5 h-2.5 mr-1"/>R.Axle: {formatDimension(loc.distanceFromRearAxleMm)}</span>
                                <span className="flex items-center"><ArrowUpDown className="w-2.5 h-2.5 mr-1"/>Center: {formatDimension(loc.distanceFromCenterlineMm)}</span>
                                <span className="flex items-center"><Ruler className="w-2.5 h-2.5 mr-1"/>Height: {formatDimension(loc.heightFromGroundMm)}</span>
                              </div>
                            </div>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardFooter>
                )}
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
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogState({ isOpen: false, vehicleId: null, vehicleName: null, confirmationText: '' })} className="font-body">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteVehicle}
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

