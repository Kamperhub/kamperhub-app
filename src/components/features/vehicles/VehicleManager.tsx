
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { StoredVehicle, VehicleFormData } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { VehicleForm } from './VehicleForm';
import { PlusCircle, Edit3, Trash2, CheckCircle } from 'lucide-react';

const VEHICLES_STORAGE_KEY = 'kamperhub_vehicles_list';
const ACTIVE_VEHICLE_ID_KEY = 'kamperhub_active_vehicle_id';

export function VehicleManager() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<StoredVehicle[]>([]);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<StoredVehicle | null>(null);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);

  useEffect(() => {
    setIsLocalStorageReady(true);
    if (typeof window !== 'undefined') {
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
        toast({ title: "Error Loading Vehicles", variant: "destructive" });
      }
    }
  }, [toast]);

  const saveVehiclesToStorage = useCallback((updatedVehicles: StoredVehicle[]) => {
    if (!isLocalStorageReady) return;
    try {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
    } catch (error) {
      toast({ title: "Error Saving Vehicles", variant: "destructive" });
    }
  }, [toast, isLocalStorageReady]);

  const saveActiveVehicleIdToStorage = useCallback((id: string | null) => {
    if (!isLocalStorageReady) return;
    try {
      if (id) {
        localStorage.setItem(ACTIVE_VEHICLE_ID_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_VEHICLE_ID_KEY);
      }
    } catch (error) {
      toast({ title: "Error Saving Active Vehicle", variant: "destructive" });
    }
  }, [toast, isLocalStorageReady]);

  const handleSaveVehicle = (data: VehicleFormData) => {
    let updatedVehicles;
    if (editingVehicle) {
      updatedVehicles = vehicles.map(v => v.id === editingVehicle.id ? { ...v, ...data } : v);
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
    setEditingVehicle(null);
    setIsFormOpen(true);
  };
  
  if (!isLocalStorageReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Tow Vehicle Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-body">Loading vehicle data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline">Tow Vehicles</CardTitle>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenFormForNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
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
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {vehicles.length === 0 && (
          <p className="text-muted-foreground text-center font-body py-4">No vehicles added yet. Click "Add New Vehicle" to start.</p>
        )}
        {vehicles.map(vehicle => (
          <Card key={vehicle.id} className={`p-4 ${activeVehicleId === vehicle.id ? 'border-primary shadow-md' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold font-body text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                <div className="text-sm text-muted-foreground font-body grid grid-cols-2 gap-x-4">
                  <span>GVM: {vehicle.gvm}kg</span>
                  <span>GCM: {vehicle.gcm}kg</span>
                  <span>Tow Capacity: {vehicle.maxTowCapacity}kg</span>
                  <span>Towball Mass: {vehicle.maxTowballMass}kg</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                {activeVehicleId !== vehicle.id && (
                  <Button variant="outline" size="sm" onClick={() => handleSetActiveVehicle(vehicle.id)} className="font-body">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Set Active
                  </Button>
                )}
                 {activeVehicleId === vehicle.id && (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-300 flex items-center font-body">
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
