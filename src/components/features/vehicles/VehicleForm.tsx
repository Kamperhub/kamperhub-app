
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Edit3, Save } from 'lucide-react';

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  gvm: z.coerce.number().positive("GVM must be positive"), // Gross Vehicle Mass
  gcm: z.coerce.number().positive("GCM must be positive"), // Gross Combined Mass
  maxTowCapacity: z.coerce.number().positive("Max Towing Capacity must be positive"),
  maxTowballMass: z.coerce.number().positive("Max Towball Mass must be positive"),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

const VEHICLE_DATA_STORAGE_KEY = 'kamperhub_vehicle_data';

export function VehicleForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<VehicleFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: currentVehicle || {},
  });

  useEffect(() => {
    setIsLocalStorageReady(true);
  }, []);

  useEffect(() => {
    if (isLocalStorageReady) {
      try {
        const storedData = localStorage.getItem(VEHICLE_DATA_STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setCurrentVehicle(parsedData);
          reset(parsedData);
          setIsEditing(false); 
        } else {
          setIsEditing(true); // No data, start in edit mode
        }
      } catch (error) {
        console.error("Error reading vehicle data from localStorage:", error);
        toast({
          title: "Error Loading Data",
          description: "Could not load saved vehicle data.",
          variant: "destructive",
        });
        setIsEditing(true); // Error loading, default to edit mode
      }
    }
  }, [reset, toast, isLocalStorageReady]);

  const onSubmit: SubmitHandler<VehicleFormData> = async (data) => {
    if (!isLocalStorageReady) return;
    setIsLoading(true);
    try {
      localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
      setCurrentVehicle(data);
      setIsEditing(false);
      toast({
        title: "Vehicle Data Saved",
        description: `${data.make} ${data.model} details have been updated.`,
      });
    } catch (error) {
      console.error("Error saving vehicle data to localStorage:", error);
      toast({
        title: "Error Saving Data",
        description: "Could not save vehicle data. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
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
        <CardTitle className="font-headline">Tow Vehicle Specifications</CardTitle>
        {!isEditing && currentVehicle && (
          <CardDescription className="font-body">
            Currently viewing: {currentVehicle.year} {currentVehicle.make} {currentVehicle.model}. Click "Edit" to make changes.
          </CardDescription>
        )}
        {isEditing && (
           <CardDescription className="font-body">
            {currentVehicle ? `Editing ${currentVehicle.year} ${currentVehicle.make} ${currentVehicle.model}` : "Enter the details of your tow vehicle."}
          </CardDescription>
        )}
      </CardHeader>
      
      {!isEditing && currentVehicle ? (
        <>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 font-body">
              <p><strong>Make:</strong> {currentVehicle.make}</p>
              <p><strong>Model:</strong> {currentVehicle.model}</p>
              <p><strong>Year:</strong> {currentVehicle.year}</p>
              <p><strong>GVM (kg):</strong> {currentVehicle.gvm}</p>
              <p><strong>GCM (kg):</strong> {currentVehicle.gcm}</p>
              <p><strong>Max Tow Capacity (kg):</strong> {currentVehicle.maxTowCapacity}</p>
              <p><strong>Max Towball Mass (kg):</strong> {currentVehicle.maxTowballMass}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsEditing(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Vehicle Data
            </Button>
          </CardFooter>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="make" className="font-body">Make</Label>
                <Input id="make" {...register("make")} placeholder="e.g., Ford" className="font-body" />
                {errors.make && <p className="text-sm text-destructive font-body">{errors.make.message}</p>}
              </div>
              <div>
                <Label htmlFor="model" className="font-body">Model</Label>
                <Input id="model" {...register("model")} placeholder="e.g., Ranger" className="font-body" />
                {errors.model && <p className="text-sm text-destructive font-body">{errors.model.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year" className="font-body">Year</Label>
                <Input id="year" type="number" {...register("year")} placeholder="e.g., 2022" className="font-body" />
                {errors.year && <p className="text-sm text-destructive font-body">{errors.year.message}</p>}
              </div>
              <div>
                <Label htmlFor="gvm" className="font-body">Gross Vehicle Mass (GVM) (kg)</Label>
                <Input id="gvm" type="number" {...register("gvm")} placeholder="e.g., 3200" className="font-body" />
                {errors.gvm && <p className="text-sm text-destructive font-body">{errors.gvm.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gcm" className="font-body">Gross Combined Mass (GCM) (kg)</Label>
                <Input id="gcm" type="number" {...register("gcm")} placeholder="e.g., 6000" className="font-body" />
                {errors.gcm && <p className="text-sm text-destructive font-body">{errors.gcm.message}</p>}
              </div>
              <div>
                <Label htmlFor="maxTowCapacity" className="font-body">Max Towing Capacity (kg)</Label>
                <Input id="maxTowCapacity" type="number" {...register("maxTowCapacity")} placeholder="e.g., 3500" className="font-body" />
                {errors.maxTowCapacity && <p className="text-sm text-destructive font-body">{errors.maxTowCapacity.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="maxTowballMass" className="font-body">Max Towball Mass (kg)</Label>
              <Input id="maxTowballMass" type="number" {...register("maxTowballMass")} placeholder="e.g., 350" className="font-body" />
              {errors.maxTowballMass && <p className="text-sm text-destructive font-body">{errors.maxTowballMass.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
              <Save className="mr-2 h-4 w-4" /> {currentVehicle ? 'Update Vehicle Data' : 'Save Vehicle Data'}
            </Button>
            {isEditing && currentVehicle && (
              <Button variant="outline" onClick={() => { reset(currentVehicle); setIsEditing(false); }} disabled={isLoading} className="font-body">
                Cancel
              </Button>
            )}
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

    