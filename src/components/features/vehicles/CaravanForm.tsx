
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CaravanFormData, StorageLocation, WaterTank } from '@/types/caravan';
import type { StoredWDH } from '@/types/wdh';
import { WDHS_STORAGE_KEY } from '@/types/wdh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, XCircle, PlusCircle, Trash2, Droplet, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const storageLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Location name is required"),
  longitudinalPosition: z.enum(['front-of-axles', 'over-axles', 'rear-of-axles'], { required_error: "Longitudinal position is required" }),
  lateralPosition: z.enum(['left', 'center', 'right'], { required_error: "Lateral position is required" }),
  distanceFromAxleCenterMm: z.coerce.number().optional().nullable(),
  distanceFromCenterlineMm: z.coerce.number().optional().nullable(),
  heightFromGroundMm: z.coerce.number().optional().nullable(),
  maxWeightCapacityKg: z.coerce.number().optional().nullable(),
});

const waterTankSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tank name is required"),
  type: z.enum(['fresh', 'grey', 'black'], { required_error: "Tank type is required" }),
  capacityLiters: z.coerce.number().positive("Capacity must be a positive number"),
  longitudinalPosition: z.enum(['front-of-axles', 'over-axles', 'rear-of-axles'], { required_error: "Longitudinal position is required" }),
  lateralPosition: z.enum(['left', 'center', 'right'], { required_error: "Lateral position is required" }),
  distanceFromAxleCenterMm: z.coerce.number().optional().nullable(),
});

const caravanSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 2, "Invalid year"),
  tareMass: z.coerce.number().positive("Tare Mass must be positive"),
  atm: z.coerce.number().positive("ATM must be positive"),
  gtm: z.coerce.number().positive("GTM must be positive"),
  maxTowballDownload: z.coerce.number().positive("Max Towball Download must be positive"),
  numberOfAxles: z.coerce.number().int().min(1, "Must have at least 1 axle").max(4, "Number of axles seems high (max 4)"),
  associatedWdhId: z.string().nullable().optional(),
  overallLength: z.coerce.number().min(1, "Overall length must be positive (mm)").optional().nullable(),
  bodyLength: z.coerce.number().min(1, "Body length must be positive (mm)").optional().nullable(),
  overallHeight: z.coerce.number().min(1, "Overall height must be positive (mm)").optional().nullable(),
  hitchToAxleCenterDistance: z.coerce.number().min(1, "Distance must be positive (mm)").optional().nullable(),
  interAxleSpacing: z.coerce.number().min(1, "Spacing must be positive (mm)").optional().nullable(),
  storageLocations: z.array(storageLocationSchema).optional(),
  waterTanks: z.array(waterTankSchema).optional(),
}).refine(data => {
    if (data.bodyLength && data.overallLength && data.bodyLength > data.overallLength) {
        return false;
    }
    return true;
}, {
    message: "Body length cannot be greater than overall length.",
    path: ["bodyLength"],
}).refine(data => data.atm >= data.tareMass, {
  message: "ATM must be greater than or equal to Tare Mass.",
  path: ["atm"],
});

interface CaravanFormProps {
  initialData?: CaravanFormData;
  onSave: (data: CaravanFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CaravanForm({ initialData, onSave, onCancel, isLoading }: CaravanFormProps) {
  const [availableWdhs, setAvailableWdhs] = useState<StoredWDH[]>([]);
  
  const defaultFormValues: CaravanFormData = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    tareMass: 0,
    atm: 0,
    gtm: 0,
    maxTowballDownload: 0,
    numberOfAxles: 1,
    associatedWdhId: null,
    overallLength: null,
    bodyLength: null,
    overallHeight: null,
    hitchToAxleCenterDistance: null,
    interAxleSpacing: null,
    storageLocations: [],
    waterTanks: [],
  };
  
  const { control, register, handleSubmit, formState: { errors }, reset, watch } = useForm<CaravanFormData>({
    resolver: zodResolver(caravanSchema),
    defaultValues: initialData 
      ? { ...defaultFormValues, ...initialData, storageLocations: initialData.storageLocations || [], waterTanks: initialData.waterTanks || [] } 
      : defaultFormValues,
  });

  const { fields: storageLocationFields, append: appendStorageLocation, remove: removeStorageLocation } = useFieldArray({
    control,
    name: "storageLocations",
  });

  const { fields: waterTankFields, append: appendWaterTank, remove: removeWaterTank } = useFieldArray({
    control,
    name: "waterTanks",
  });

  const numberOfAxles = watch("numberOfAxles");
  const watchedAtm = watch("atm");
  const watchedTareMass = watch("tareMass");

  const potentialGrossPayload = useMemo(() => {
    const atm = Number(watchedAtm);
    const tare = Number(watchedTareMass);
    if (!isNaN(atm) && !isNaN(tare) && atm > 0 && tare > 0 && atm >= tare) {
      return atm - tare;
    }
    return null;
  }, [watchedAtm, watchedTareMass]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedWdhs = localStorage.getItem(WDHS_STORAGE_KEY);
      if (storedWdhs) {
        setAvailableWdhs(JSON.parse(storedWdhs));
      }
    }
  }, []);
  
  useEffect(() => {
    const currentDefaultValues = initialData 
    ? { ...defaultFormValues, ...initialData, storageLocations: initialData.storageLocations || [], waterTanks: initialData.waterTanks || [], associatedWdhId: initialData.associatedWdhId || null } 
    : defaultFormValues;
    reset(currentDefaultValues);
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<CaravanFormData> = (data) => {
    const processedData: CaravanFormData = {
      ...data,
      overallLength: data.overallLength ? Number(data.overallLength) : null,
      bodyLength: data.bodyLength ? Number(data.bodyLength) : null,
      overallHeight: data.overallHeight ? Number(data.overallHeight) : null,
      hitchToAxleCenterDistance: data.hitchToAxleCenterDistance ? Number(data.hitchToAxleCenterDistance) : null,
      interAxleSpacing: data.interAxleSpacing ? Number(data.interAxleSpacing) : null,
      storageLocations: data.storageLocations?.map(loc => ({
        ...loc,
        distanceFromAxleCenterMm: loc.distanceFromAxleCenterMm ? Number(loc.distanceFromAxleCenterMm) : null,
        distanceFromCenterlineMm: loc.distanceFromCenterlineMm ? Number(loc.distanceFromCenterlineMm) : null,
        heightFromGroundMm: loc.heightFromGroundMm ? Number(loc.heightFromGroundMm) : null,
        maxWeightCapacityKg: loc.maxWeightCapacityKg ? Number(loc.maxWeightCapacityKg) : null,
      })) || [],
      waterTanks: data.waterTanks?.map(tank => ({
        ...tank,
        capacityLiters: Number(tank.capacityLiters),
        distanceFromAxleCenterMm: tank.distanceFromAxleCenterMm ? Number(tank.distanceFromAxleCenterMm) : null,
      })) || [],
    };
    onSave(processedData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <h3 className="text-lg font-medium font-headline text-primary">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="caravanMake" className="font-body">Make</Label>
          <Input id="caravanMake" {...register("make")} placeholder="e.g., Jayco" className="font-body" />
          {errors.make && <p className="text-sm text-destructive font-body mt-1">{errors.make.message}</p>}
        </div>
        <div>
          <Label htmlFor="caravanModel" className="font-body">Model</Label>
          <Input id="caravanModel" {...register("model")} placeholder="e.g., Starcraft" className="font-body" />
          {errors.model && <p className="text-sm text-destructive font-body mt-1">{errors.model.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="caravanYear" className="font-body">Year</Label>
          <Input id="caravanYear" type="number" {...register("year")} placeholder="e.g., 2021" className="font-body" />
          {errors.year && <p className="text-sm text-destructive font-body mt-1">{errors.year.message}</p>}
        </div>
        <div>
          <Label htmlFor="numberOfAxles" className="font-body">Number of Axles</Label>
          <Input id="numberOfAxles" type="number" {...register("numberOfAxles")} placeholder="e.g., 1 or 2" className="font-body" />
          {errors.numberOfAxles && <p className="text-sm text-destructive font-body mt-1">{errors.numberOfAxles.message}</p>}
        </div>
      </div>

      {/* Weight Specifications */}
      <h3 className="text-lg font-medium font-headline text-primary pt-2">Weight Specifications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tareMass" className="font-body">Tare Mass (kg)</Label>
          <Input id="tareMass" type="number" {...register("tareMass")} placeholder="e.g., 1800" className="font-body" />
          {errors.tareMass && <p className="text-sm text-destructive font-body mt-1">{errors.tareMass.message}</p>}
        </div>
        <div>
          <Label htmlFor="atm" className="font-body">ATM (kg)</Label>
          <Input id="atm" type="number" {...register("atm")} placeholder="e.g., 2500" className="font-body" />
          {errors.atm && <p className="text-sm text-destructive font-body mt-1">{errors.atm.message}</p>}
        </div>
        <div>
          <Label htmlFor="gtm" className="font-body">GTM (kg)</Label>
          <Input id="gtm" type="number" {...register("gtm")} placeholder="e.g., 2350" className="font-body" />
          {errors.gtm && <p className="text-sm text-destructive font-body mt-1">{errors.gtm.message}</p>}
        </div>
        <div>
          <Label htmlFor="maxTowballDownload" className="font-body">Max Towball Download (kg)</Label>
          <Input id="maxTowballDownload" type="number" {...register("maxTowballDownload")} placeholder="e.g., 250" className="font-body" />
          {errors.maxTowballDownload && <p className="text-sm text-destructive font-body mt-1">{errors.maxTowballDownload.message}</p>}
        </div>
      </div>
       {potentialGrossPayload !== null && (
        <Alert variant="default" className="mt-2 bg-primary/10 border-primary/30">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="font-body text-primary">Calculated Gross Payload</AlertTitle>
          <AlertDescription className="font-body text-primary/80">
            Based on ATM and Tare entered: <strong>{potentialGrossPayload.toFixed(0)} kg</strong> available for water, gas, items, etc.
          </AlertDescription>
        </Alert>
      )}


      {/* Dimensions (Optional) */}
      <h3 className="text-lg font-medium font-headline text-primary pt-2">Dimensions (Optional)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="overallLength" className="font-body">Overall Length (mm)</Label>
          <Input id="overallLength" type="number" {...register("overallLength")} placeholder="Incl. drawbar" className="font-body" />
          {errors.overallLength && <p className="text-sm text-destructive font-body mt-1">{errors.overallLength.message}</p>}
        </div>
        <div>
          <Label htmlFor="bodyLength" className="font-body">Body Length (mm)</Label>
          <Input id="bodyLength" type="number" {...register("bodyLength")} placeholder="Caravan body only" className="font-body" />
          {errors.bodyLength && <p className="text-sm text-destructive font-body mt-1">{errors.bodyLength.message}</p>}
        </div>
        <div>
          <Label htmlFor="overallHeight" className="font-body">Overall Height (mm)</Label>
          <Input id="overallHeight" type="number" {...register("overallHeight")} placeholder="Ground to highest point" className="font-body" />
          {errors.overallHeight && <p className="text-sm text-destructive font-body mt-1">{errors.overallHeight.message}</p>}
        </div>
         <div>
          <Label htmlFor="hitchToAxleCenterDistance" className="font-body">Hitch to Axle Center (mm)</Label>
          <Input id="hitchToAxleCenterDistance" type="number" {...register("hitchToAxleCenterDistance")} placeholder="Coupling to axle(s) center" className="font-body" />
          {errors.hitchToAxleCenterDistance && <p className="text-sm text-destructive font-body mt-1">{errors.hitchToAxleCenterDistance.message}</p>}
        </div>
      </div>
      {Number(numberOfAxles) > 1 && (
        <div>
            <Label htmlFor="interAxleSpacing" className="font-body">Inter-Axle Spacing (mm)</Label>
            <Input id="interAxleSpacing" type="number" {...register("interAxleSpacing")} placeholder="Distance between axles" className="font-body" />
            {errors.interAxleSpacing && <p className="text-sm text-destructive font-body mt-1">{errors.interAxleSpacing.message}</p>}
        </div>
      )}

      {/* WDH Association */}
      <h3 className="text-lg font-medium font-headline text-primary pt-2">WDH Association (Optional)</h3>
       <div>
        <Controller
            name="associatedWdhId"
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                value={field.value || "none"}
                disabled={availableWdhs.length === 0}
              >
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select an associated WDH" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableWdhs.map(wdh => (
                    <SelectItem key={wdh.id} value={wdh.id}>
                      {wdh.name} ({wdh.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        {availableWdhs.length === 0 && <p className="text-xs text-muted-foreground font-body mt-1">No WDHs added yet. Add one in the WDH section first.</p>}
        {errors.associatedWdhId && <p className="text-sm text-destructive font-body mt-1">{errors.associatedWdhId.message}</p>}
      </div>

      {/* Storage Locations */}
      <Separator className="my-6" />
      <h3 className="text-lg font-medium font-headline text-primary">Storage Locations</h3>
      <div className="space-y-4">
        {storageLocationFields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/30">
            <div className="flex justify-between items-center">
                <Label className="font-body font-medium">Location {index + 1}</Label>
                <Button type="button" variant="ghost" onClick={() => removeStorageLocation(index)} className="text-destructive hover:bg-destructive/10 self-end sm:col-start-2 sm:justify-self-end p-2">
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <Label htmlFor={`storageLocations.${index}.name`} className="text-xs font-body">Name*</Label>
                    <Input 
                        {...register(`storageLocations.${index}.name`)} 
                        placeholder="e.g., Front Boot, Kitchen Cupboard"
                        className="font-body bg-background"
                    />
                    {errors.storageLocations?.[index]?.name && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.name?.message}</p>}
                </div>
                 <div>
                    <Label htmlFor={`storageLocations.${index}.maxWeightCapacityKg`} className="text-xs font-body">Max Capacity (kg) (Optional)</Label>
                    <Input 
                        {...register(`storageLocations.${index}.maxWeightCapacityKg`)} 
                        type="number" 
                        placeholder="e.g., 50"
                        className="font-body bg-background"
                    />
                    {errors.storageLocations?.[index]?.maxWeightCapacityKg && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.maxWeightCapacityKg?.message}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`storageLocations.${index}.longitudinalPosition`} className="text-xs font-body">Longitudinal Position*</Label>
                <Controller
                  name={`storageLocations.${index}.longitudinalPosition`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                      <SelectTrigger className="font-body bg-background"><SelectValue placeholder="Select longitudinal position" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="front-of-axles">Front of Axle(s)</SelectItem>
                        <SelectItem value="over-axles">Over Axle(s)</SelectItem>
                        <SelectItem value="rear-of-axles">Rear of Axle(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.storageLocations?.[index]?.longitudinalPosition && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.longitudinalPosition?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`storageLocations.${index}.lateralPosition`} className="text-xs font-body">Lateral Position*</Label>
                 <Controller
                  name={`storageLocations.${index}.lateralPosition`}
                  control={control}
                  render={({ field: controllerField }) => (
                    <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                      <SelectTrigger className="font-body bg-background"><SelectValue placeholder="Select lateral position" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.storageLocations?.[index]?.lateralPosition && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.lateralPosition?.message}</p>}
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <Label htmlFor={`storageLocations.${index}.distanceFromAxleCenterMm`} className="text-xs font-body">Dist. from Axle Center (mm) (Opt.)</Label>
                    <Input 
                        {...register(`storageLocations.${index}.distanceFromAxleCenterMm`)} 
                        type="number" 
                        placeholder="e.g., 1500 (front), -1000 (rear)"
                        className="font-body bg-background"
                    />
                    <p className="text-xs text-muted-foreground font-body mt-0.5">Relative to axle(s) center. +ve towards hitch.</p>
                    {errors.storageLocations?.[index]?.distanceFromAxleCenterMm && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.distanceFromAxleCenterMm?.message}</p>}
                </div>
                 <div>
                    <Label htmlFor={`storageLocations.${index}.distanceFromCenterlineMm`} className="text-xs font-body">Dist. from Centerline (mm) (Opt.)</Label>
                    <Input 
                        {...register(`storageLocations.${index}.distanceFromCenterlineMm`)} 
                        type="number" 
                        placeholder="e.g., -300 (left), 300 (right)"
                        className="font-body bg-background"
                    />
                     <p className="text-xs text-muted-foreground font-body mt-0.5">Relative to van centerline. +ve right.</p>
                    {errors.storageLocations?.[index]?.distanceFromCenterlineMm && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.distanceFromCenterlineMm?.message}</p>}
                </div>
                 <div>
                    <Label htmlFor={`storageLocations.${index}.heightFromGroundMm`} className="text-xs font-body">Height from Ground (mm) (Opt.)</Label>
                    <Input 
                        {...register(`storageLocations.${index}.heightFromGroundMm`)} 
                        type="number" 
                        placeholder="e.g., 500"
                        className="font-body bg-background"
                    />
                     <p className="text-xs text-muted-foreground font-body mt-0.5">Est. center of mass height for location.</p>
                    {errors.storageLocations?.[index]?.heightFromGroundMm && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.heightFromGroundMm?.message}</p>}
                </div>
            </div>
          </div>
        ))}
        <Button 
            type="button" 
            variant="outline" 
            onClick={() => appendStorageLocation({ id: Date.now().toString(), name: '', longitudinalPosition: 'over-axles', lateralPosition: 'center', distanceFromAxleCenterMm: null, distanceFromCenterlineMm: null, heightFromGroundMm: null, maxWeightCapacityKg: null } as StorageLocation)}
            className="font-body"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Storage Location
        </Button>
         {errors.storageLocations && typeof errors.storageLocations === 'object' && !Array.isArray(errors.storageLocations) && (errors.storageLocations as any).message && (
            <p className="text-sm text-destructive font-body mt-1">{(errors.storageLocations as any).message}</p>
         )}
      </div>

      {/* Water Tanks */}
      <Separator className="my-6" />
      <h3 className="text-lg font-medium font-headline text-primary">Water Tanks</h3>
      <div className="space-y-4">
        {waterTankFields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/30">
            <div className="flex justify-between items-center">
                <Label className="font-body font-medium">Water Tank {index + 1}</Label>
                <Button type="button" variant="ghost" onClick={() => removeWaterTank(index)} className="text-destructive hover:bg-destructive/10 self-end p-2">
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label htmlFor={`waterTanks.${index}.name`} className="text-xs font-body">Name*</Label>
                <Input {...register(`waterTanks.${index}.name`)} placeholder="e.g., Front Fresh Tank" className="font-body bg-background"/>
                {errors.waterTanks?.[index]?.name && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.name?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`waterTanks.${index}.type`} className="text-xs font-body">Type*</Label>
                <Controller
                  name={`waterTanks.${index}.type`}
                  control={control}
                  render={({ field: ctrlField }) => (
                    <Select onValueChange={ctrlField.onChange} defaultValue={ctrlField.value}>
                      <SelectTrigger className="font-body bg-background"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fresh">Fresh Water</SelectItem>
                        <SelectItem value="grey">Grey Water</SelectItem>
                        <SelectItem value="black">Black Water</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.waterTanks?.[index]?.type && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.type?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`waterTanks.${index}.capacityLiters`} className="text-xs font-body">Capacity (Liters)*</Label>
                <Input type="number" {...register(`waterTanks.${index}.capacityLiters`)} placeholder="e.g., 80" className="font-body bg-background"/>
                {errors.waterTanks?.[index]?.capacityLiters && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.capacityLiters?.message}</p>}
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`waterTanks.${index}.longitudinalPosition`} className="text-xs font-body">Longitudinal Position*</Label>
                <Controller
                  name={`waterTanks.${index}.longitudinalPosition`}
                  control={control}
                  render={({ field: ctrlField }) => (
                    <Select onValueChange={ctrlField.onChange} defaultValue={ctrlField.value}>
                      <SelectTrigger className="font-body bg-background"><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="front-of-axles">Front of Axle(s)</SelectItem>
                        <SelectItem value="over-axles">Over Axle(s)</SelectItem>
                        <SelectItem value="rear-of-axles">Rear of Axle(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.waterTanks?.[index]?.longitudinalPosition && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.longitudinalPosition?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`waterTanks.${index}.lateralPosition`} className="text-xs font-body">Lateral Position*</Label>
                <Controller
                  name={`waterTanks.${index}.lateralPosition`}
                  control={control}
                  render={({ field: ctrlField }) => (
                    <Select onValueChange={ctrlField.onChange} defaultValue={ctrlField.value}>
                      <SelectTrigger className="font-body bg-background"><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.waterTanks?.[index]?.lateralPosition && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.lateralPosition?.message}</p>}
              </div>
            </div>
            <div>
                <Label htmlFor={`waterTanks.${index}.distanceFromAxleCenterMm`} className="text-xs font-body">Dist. from Axle Center (mm) (Opt.)</Label>
                <Input 
                    {...register(`waterTanks.${index}.distanceFromAxleCenterMm`)} 
                    type="number" 
                    placeholder="e.g., 1200 (front), -800 (rear)"
                    className="font-body bg-background"
                />
                <p className="text-xs text-muted-foreground font-body mt-0.5">Relative to axle(s) center. +ve towards hitch.</p>
                {errors.waterTanks?.[index]?.distanceFromAxleCenterMm && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.distanceFromAxleCenterMm?.message}</p>}
            </div>
          </div>
        ))}
        <Button 
            type="button" 
            variant="outline" 
            onClick={() => appendWaterTank({ id: Date.now().toString(), name: '', type: 'fresh', capacityLiters: 80, longitudinalPosition: 'over-axles', lateralPosition: 'center', distanceFromAxleCenterMm: null } as WaterTank)}
            className="font-body"
        >
          <Droplet className="mr-2 h-4 w-4" /> Add Water Tank
        </Button>
        {errors.waterTanks && typeof errors.waterTanks === 'object' && !Array.isArray(errors.waterTanks) && (errors.waterTanks as any).message && (
            <p className="text-sm text-destructive font-body mt-1">{(errors.waterTanks as any).message}</p>
        )}
      </div>


      <Separator className="my-6"/>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="font-body">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
          <Save className="mr-2 h-4 w-4" /> {initialData ? 'Update Caravan' : 'Save Caravan'}
        </Button>
      </div>
    </form>
  );
}

