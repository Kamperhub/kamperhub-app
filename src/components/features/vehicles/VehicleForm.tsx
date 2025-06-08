
"use client";

import * as React from "react";
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { VehicleFormData, VehicleStorageLocation } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, XCircle, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const vehicleStorageLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Location name is required"),
  longitudinalPosition: z.enum(['front-of-front-axle', 'between-axles', 'rear-of-rear-axle', 'roof-center'], { required_error: "Longitudinal position is required" }),
  lateralPosition: z.enum(['left', 'center', 'right'], { required_error: "Lateral position is required" }),
});

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 2, "Invalid year"),
  gvm: z.coerce.number().positive("GVM must be positive"),
  gcm: z.coerce.number().positive("GCM must be positive"),
  maxTowCapacity: z.coerce.number().positive("Max Towing Capacity must be positive"),
  maxTowballMass: z.coerce.number().positive("Max Towball Mass must be positive"),
  fuelEfficiency: z.coerce.number().min(0.1, "Fuel efficiency must be positive (L/100km)").max(100, "Fuel efficiency seems too high (max 100 L/100km)"),
  kerbWeight: z.coerce.number().min(1, "Kerb Weight must be a positive number").optional().nullable(),
  frontAxleLimit: z.coerce.number().min(1, "Front Axle Limit must be a positive number").optional().nullable(),
  rearAxleLimit: z.coerce.number().min(1, "Rear Axle Limit must be a positive number").optional().nullable(),
  wheelbase: z.coerce.number().min(1000, "Wheelbase seems too short (min 1000mm)").optional().nullable(),
  storageLocations: z.array(vehicleStorageLocationSchema).optional(),
});

interface VehicleFormProps {
  initialData?: VehicleFormData;
  onSave: (data: VehicleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VehicleForm({ initialData, onSave, onCancel, isLoading }: VehicleFormProps) {
  const defaultFormValues: VehicleFormData = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    gvm: 0,
    gcm: 0,
    maxTowCapacity: 0,
    maxTowballMass: 0,
    fuelEfficiency: 10,
    kerbWeight: null,
    frontAxleLimit: null,
    rearAxleLimit: null,
    wheelbase: null,
    storageLocations: [],
  };

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: initialData ? { ...defaultFormValues, ...initialData, storageLocations: initialData.storageLocations || [] } : defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "storageLocations",
  });

  React.useEffect(() => {
    reset(initialData ? { ...defaultFormValues, ...initialData, storageLocations: initialData.storageLocations || [] } : defaultFormValues);
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<VehicleFormData> = (data) => {
    const processedData = {
        ...data,
        kerbWeight: data.kerbWeight ? Number(data.kerbWeight) : null,
        frontAxleLimit: data.frontAxleLimit ? Number(data.frontAxleLimit) : null,
        rearAxleLimit: data.rearAxleLimit ? Number(data.rearAxleLimit) : null,
        wheelbase: data.wheelbase ? Number(data.wheelbase) : null,
        storageLocations: data.storageLocations || [],
    };
    onSave(processedData as VehicleFormData);
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Basic Info */}
      <h3 className="text-sm font-medium font-headline text-primary">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="make" className="font-body">Make</Label>
          <Input id="make" {...register("make")} placeholder="e.g., Ford" className="font-body" />
          {errors.make && <p className="text-sm text-destructive font-body mt-1">{errors.make.message}</p>}
        </div>
        <div>
          <Label htmlFor="model" className="font-body">Model</Label>
          <Input id="model" {...register("model")} placeholder="e.g., Ranger" className="font-body" />
          {errors.model && <p className="text-sm text-destructive font-body mt-1">{errors.model.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year" className="font-body">Year</Label>
          <Input id="year" type="number" {...register("year")} placeholder="e.g., 2022" className="font-body" />
          {errors.year && <p className="text-sm text-destructive font-body mt-1">{errors.year.message}</p>}
        </div>
        <div>
          <Label htmlFor="kerbWeight" className="font-body">Kerb Weight (kg) (Optional)</Label>
          <Input id="kerbWeight" type="number" {...register("kerbWeight")} placeholder="e.g., 2200" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Weight of empty vehicle with full fuel tank.</p>
          {errors.kerbWeight && <p className="text-sm text-destructive font-body mt-1">{errors.kerbWeight.message}</p>}
        </div>
      </div>

      {/* Weight Specs */}
      <h3 className="text-sm font-medium font-headline text-primary pt-1">Weight Specifications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gvm" className="font-body">Gross Vehicle Mass (GVM) (kg)</Label>
          <Input id="gvm" type="number" {...register("gvm")} placeholder="e.g., 3200" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Max operating weight of the vehicle.</p>
          {errors.gvm && <p className="text-sm text-destructive font-body mt-1">{errors.gvm.message}</p>}
        </div>
        <div>
          <Label htmlFor="gcm" className="font-body">Gross Combined Mass (GCM) (kg)</Label>
          <Input id="gcm" type="number" {...register("gcm")} placeholder="e.g., 6000" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Max combined weight of vehicle and trailer.</p>
          {errors.gcm && <p className="text-sm text-destructive font-body mt-1">{errors.gcm.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxTowCapacity" className="font-body">Max Towing Capacity (kg)</Label>
          <Input id="maxTowCapacity" type="number" {...register("maxTowCapacity")} placeholder="e.g., 3500" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Max trailer ATM vehicle can tow.</p>
          {errors.maxTowCapacity && <p className="text-sm text-destructive font-body mt-1">{errors.maxTowCapacity.message}</p>}
        </div>
        <div>
          <Label htmlFor="maxTowballMass" className="font-body">Max Towball Mass (kg)</Label>
          <Input id="maxTowballMass" type="number" {...register("maxTowballMass")} placeholder="e.g., 350" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Max weight vehicle's towbar can support.</p>
          {errors.maxTowballMass && <p className="text-sm text-destructive font-body mt-1">{errors.maxTowballMass.message}</p>}
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="frontAxleLimit" className="font-body">Front Axle Limit (kg) (Optional)</Label>
          <Input id="frontAxleLimit" type="number" {...register("frontAxleLimit")} placeholder="e.g., 1500" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Max load on front axle.</p>
          {errors.frontAxleLimit && <p className="text-sm text-destructive font-body mt-1">{errors.frontAxleLimit.message}</p>}
        </div>
        <div>
          <Label htmlFor="rearAxleLimit" className="font-body">Rear Axle Limit (kg) (Optional)</Label>
          <Input id="rearAxleLimit" type="number" {...register("rearAxleLimit")} placeholder="e.g., 1800" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Max load on rear axle.</p>
          {errors.rearAxleLimit && <p className="text-sm text-destructive font-body mt-1">{errors.rearAxleLimit.message}</p>}
        </div>
      </div>

      {/* Dimensions & Fuel */}
      <h3 className="text-sm font-medium font-headline text-primary pt-1">Dimensions & Fuel</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="wheelbase" className="font-body">Wheelbase (mm) (Optional)</Label>
          <Input id="wheelbase" type="number" {...register("wheelbase")} placeholder="e.g., 3220" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Distance between front and rear axles.</p>
          {errors.wheelbase && <p className="text-sm text-destructive font-body mt-1">{errors.wheelbase.message}</p>}
        </div>
        <div>
          <Label htmlFor="fuelEfficiency" className="font-body">Fuel Efficiency (L/100km)</Label>
          <Input id="fuelEfficiency" type="number" step="0.1" {...register("fuelEfficiency")} placeholder="e.g., 12.5" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">
            Expected efficiency (towing typically increases consumption).
          </p>
          {errors.fuelEfficiency && <p className="text-sm text-destructive font-body mt-1">{errors.fuelEfficiency.message}</p>}
        </div>
      </div>

      {/* Storage Locations */}
      <Separator className="my-4" />
      <h3 className="text-sm font-medium font-headline text-primary">Storage Locations (Optional)</h3>
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="p-3 border rounded-md space-y-2 bg-muted/30">
            <div className="flex justify-between items-center">
                <Label className="font-body font-medium text-sm">Location {index + 1}</Label>
                <Button type="button" variant="ghost" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 h-7 px-2 py-1 text-xs">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-3">
                    <Label htmlFor={`storageLocations.${index}.name`} className="text-xs font-body">Name</Label>
                    <Input 
                        {...register(`storageLocations.${index}.name`)} 
                        placeholder="e.g., Boot, Roof Box, Rear Seat Floor"
                        className="font-body bg-background text-sm h-9"
                    />
                    {errors.storageLocations?.[index]?.name && <p className="text-xs text-destructive font-body mt-1">{errors.storageLocations[index]?.name?.message}</p>}
                </div>
                 <div>
                    <Label htmlFor={`storageLocations.${index}.longitudinalPosition`} className="text-xs font-body">Longitudinal</Label>
                    <Controller
                      name={`storageLocations.${index}.longitudinalPosition`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                          <SelectTrigger className="font-body bg-background text-sm h-9"><SelectValue placeholder="Select position" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="front-of-front-axle">Front of Front Axle</SelectItem>
                            <SelectItem value="between-axles">Between Axles</SelectItem>
                            <SelectItem value="rear-of-rear-axle">Rear of Rear Axle</SelectItem>
                            <SelectItem value="roof-center">Roof (Centered)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.storageLocations?.[index]?.longitudinalPosition && <p className="text-xs text-destructive font-body mt-1">{errors.storageLocations[index]?.longitudinalPosition?.message}</p>}
                </div>
                <div>
                    <Label htmlFor={`storageLocations.${index}.lateralPosition`} className="text-xs font-body">Lateral</Label>
                    <Controller
                      name={`storageLocations.${index}.lateralPosition`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                          <SelectTrigger className="font-body bg-background text-sm h-9"><SelectValue placeholder="Select position" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.storageLocations?.[index]?.lateralPosition && <p className="text-xs text-destructive font-body mt-1">{errors.storageLocations[index]?.lateralPosition?.message}</p>}
                </div>
            </div>
          </div>
        ))}
        <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => append({ id: Date.now().toString(), name: '', longitudinalPosition: 'between-axles', lateralPosition: 'center' } as VehicleStorageLocation)}
            className="font-body text-xs"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle Storage Location
        </Button>
         {errors.storageLocations && typeof errors.storageLocations === 'object' && !Array.isArray(errors.storageLocations) && (errors.storageLocations as any).message && (
            <p className="text-sm text-destructive font-body mt-1">{(errors.storageLocations as any).message}</p>
         )}
      </div>
      <Separator className="my-4"/>


      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="font-body">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
          <Save className="mr-2 h-4 w-4" /> {initialData ? 'Update Vehicle' : 'Save Vehicle'}
        </Button>
      </div>
    </form>
  );
}
