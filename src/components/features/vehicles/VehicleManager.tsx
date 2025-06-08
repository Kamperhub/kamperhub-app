
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { StoredVehicle, VehicleFormData } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { VehicleForm } from './VehicleForm';
import { PlusCircle, Edit3, Trash2, CheckCircle, Fuel, ShieldAlert, Weight, Axe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscription } from '@/hooks/useSubscription'; 
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      try {
        const storedVehicles = localStorage.getItem(VEHICLES_STORAGE_KEY);
        if (storedVehicles) {
          setVehicles(JSON.parse(storedVehicles));
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
      updatedVehicles = vehicles.map(v => v.id === editingVehicle.id ? { ...editingVehicle, ...data } : v);
      toast({ title: "Vehicle Updated", description: `${data.make} ${data.model} updated.` });
    } else {
      const newVehicle: StoredVehicle = { ...data, id: Date.now().toString() };
      updatedVehicles = [...vehicles, newVehicle];
      toast({ title: "Vehicle Added", description: `${data.make} ${data.model} added.` });
    }
    setVehicles(updatedVehicles);
    saveVehiclesToStorage(updatedVehicles);
    setIsFormOpen(false);
    setEditingVehicle(null);
  };

  const handleEditVehicle = (vehicle: StoredVehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDeleteVehicle = (id: string) => {
    const vehicleToDelete = vehicles.find(v => v.id === id);
    if (window.confirm(`Are you sure you want to delete ${vehicleToDelete?.make} ${vehicleToDelete?.model}?`)) {
      const updatedVehicles = vehicles.filter(v => v.id !== id);
      setVehicles(updatedVehicles);
      saveVehiclesToStorage(updatedVehicles);
      if (activeVehicleId === id) {
        setActiveVehicleId(null);
        saveActiveVehicleIdToStorage(null);
      }
      toast({ title: "Vehicle Deleted" });
    }
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
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle className="font-headline">{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
              </DialogHeader>
              <VehicleForm
                initialData={editingVehicle || undefined}
                onSave={handleSaveVehicle}
                onCancel={() => { setIsFormOpen(false); setEditingVehicle(null); }}
              />
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
        {vehicles.map(vehicle => (
          <Card key={vehicle.id} className={`p-4 ${activeVehicleId === vehicle.id ? 'border-primary shadow-md' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold font-body text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                <div className="text-sm text-muted-foreground font-body grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                  <span>GVM: {vehicle.gvm}kg</span>
                  <span>GCM: {vehicle.gcm}kg</span>
                  <span>Tow: {vehicle.maxTowCapacity}kg</span>
                  <span>Towball: {vehicle.maxTowballMass}kg</span>
                  <span className="flex items-center"><Weight className="w-3 h-3 mr-1 text-primary/70"/> Kerb: { (typeof vehicle.kerbWeight === 'number' && vehicle.kerbWeight > 0) ? `${vehicle.kerbWeight}kg` : 'N/A'}</span>
                  <span className="flex items-center"><Axe className="w-3 h-3 mr-1 text-primary/70 rotate-90"/> F Axle: { (typeof vehicle.frontAxleLimit === 'number' && vehicle.frontAxleLimit > 0) ? `${vehicle.frontAxleLimit}kg` : 'N/A'}</span>
                  <span className="flex items-center"><Axe className="w-3 h-3 mr-1 text-primary/70 -rotate-90"/> R Axle: { (typeof vehicle.rearAxleLimit === 'number' && vehicle.rearAxleLimit > 0) ? `${vehicle.rearAxleLimit}kg` : 'N/A'}</span>
                  <span className="flex items-center"><Fuel className="w-3 h-3 mr-1 text-primary/70"/> {vehicle.fuelEfficiency}L/100km</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center flex-shrink-0">
                {activeVehicleId !== vehicle.id && (
                  <Button variant="outline" size="sm" onClick={() => handleSetActiveVehicle(vehicle.id)} className="font-body whitespace-nowrap">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Set Active
                  </Button>
                )}
                 {activeVehicleId === vehicle.id && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-300 flex items-center font-body whitespace-nowrap">
                    <CheckCircle className="mr-1 h-4 w-4" /> Active
                  </span>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleEditVehicle(vehicle)}>
                  <Edit3 className="h-5 w-5 text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteVehicle(vehicle.id)}>
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

