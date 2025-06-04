
"use client";

import * as React from "react";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { VehicleFormData } from '@/types/vehicle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, XCircle } from 'lucide-react';

const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 2, "Invalid year"),
  gvm: z.coerce.number().positive("GVM must be positive"),
  gcm: z.coerce.number().positive("GCM must be positive"),
  maxTowCapacity: z.coerce.number().positive("Max Towing Capacity must be positive"),
  maxTowballMass: z.coerce.number().positive("Max Towball Mass must be positive"),
  fuelEfficiency: z.coerce.number().min(0.1, "Fuel efficiency must be positive (L/100km)").max(100, "Fuel efficiency seems too high (max 100 L/100km)"),
});

interface VehicleFormProps {
  initialData?: VehicleFormData;
  onSave: (data: VehicleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function VehicleForm({ initialData, onSave, onCancel, isLoading }: VehicleFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: initialData || {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      gvm: 0,
      gcm: 0,
      maxTowCapacity: 0,
      maxTowballMass: 0,
      fuelEfficiency: 10, // Default fuel efficiency
    },
  });

  const onSubmit: SubmitHandler<VehicleFormData> = (data) => {
    onSave(data);
    // reset(); // Reset is handled by dialog close or manager
  };

  // Effect to reset form if initialData changes (e.g. when editing a new item after another)
  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        gvm: 0,
        gcm: 0,
        maxTowCapacity: 0,
        maxTowballMass: 0,
        fuelEfficiency: 10,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Label htmlFor="gvm" className="font-body">Gross Vehicle Mass (GVM) (kg)</Label>
          <Input id="gvm" type="number" {...register("gvm")} placeholder="e.g., 3200" className="font-body" />
          {errors.gvm && <p className="text-sm text-destructive font-body mt-1">{errors.gvm.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gcm" className="font-body">Gross Combined Mass (GCM) (kg)</Label>
          <Input id="gcm" type="number" {...register("gcm")} placeholder="e.g., 6000" className="font-body" />
          {errors.gcm && <p className="text-sm text-destructive font-body mt-1">{errors.gcm.message}</p>}
        </div>
        <div>
          <Label htmlFor="maxTowCapacity" className="font-body">Max Towing Capacity (kg)</Label>
          <Input id="maxTowCapacity" type="number" {...register("maxTowCapacity")} placeholder="e.g., 3500" className="font-body" />
          {errors.maxTowCapacity && <p className="text-sm text-destructive font-body mt-1">{errors.maxTowCapacity.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxTowballMass" className="font-body">Max Towball Mass (kg)</Label>
          <Input id="maxTowballMass" type="number" {...register("maxTowballMass")} placeholder="e.g., 350" className="font-body" />
          {errors.maxTowballMass && <p className="text-sm text-destructive font-body mt-1">{errors.maxTowballMass.message}</p>}
        </div>
        <div>
          <Label htmlFor="fuelEfficiency" className="font-body">Fuel Efficiency (L/100km)</Label>
          <Input id="fuelEfficiency" type="number" step="0.1" {...register("fuelEfficiency")} placeholder="e.g., 12.5" className="font-body" />
          {errors.fuelEfficiency && <p className="text-sm text-destructive font-body mt-1">{errors.fuelEfficiency.message}</p>}
          <p className="text-xs text-muted-foreground font-body mt-1">
            Enter vehicle's EXPECTED efficiency. Towing typically increases consumption by 30-40%.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="font-body">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
          <Save className="mr-2 h-4 w-4" /> Save Vehicle
        </Button>
      </div>
    </form>
  );
}
