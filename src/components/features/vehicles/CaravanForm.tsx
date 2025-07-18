
"use client";

import React, { useEffect, useMemo } from 'react';
import { useForm, type SubmitHandler, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CaravanFormData, StorageLocation, WaterTank, WDHFormData } from '@/types/caravan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, XCircle, PlusCircle, Trash2, Droplet, Info, Flame, Weight, Ruler, Link2, Axe, Disc } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

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
  capacityLitres: z.coerce.number().positive("Capacity must be a positive number"),
  longitudinalPosition: z.enum(['front-of-axles', 'over-axles', 'rear-of-axles'], { required_error: "Longitudinal position is required" }),
  lateralPosition: z.enum(['left', 'center', 'right'], { required_error: "Lateral position is required" }),
  distanceFromAxleCenterMm: z.coerce.number().optional().nullable(),
});

const wdhSchema = z.object({
  name: z.string().min(1, "WDH Name/Model is required"),
  type: z.string().min(1, "WDH Type is required (e.g., Round Bar, Trunnion)"),
  maxCapacityKg: z.coerce.number().positive("Max Tow Ball Capacity must be a positive number"),
  minCapacityKg: z.coerce.number().min(0, "Min Tow Ball Capacity cannot be negative").optional().nullable(),
  hasIntegratedSwayControl: z.boolean().default(false),
  swayControlType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(data => {
  if (data.minCapacityKg != null && data.maxCapacityKg != null && data.minCapacityKg > data.maxCapacityKg) {
    return false;
  }
  return true;
}, {
  message: "Min Tow Ball Capacity cannot be greater than Max Capacity.",
  path: ["minCapacityKg"],
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
  axleGroupRating: z.coerce.number().positive("Axle Group Rating must be positive"),
  numberOfGasBottles: z.coerce.number().int().min(0, "Must be a non-negative number.").optional().nullable(),
  gasBottleCapacityKg: z.coerce.number().min(0, "Capacity must be non-negative.").optional().nullable(),
  tyreSize: z.string().optional().nullable(),
  tyreLoadRating: z.coerce.number().min(0).optional().nullable(),
  tyreSpeedRating: z.string().optional().nullable(),
  recommendedTyrePressurePsi: z.coerce.number().min(0, "Pressure must be positive").optional().nullable(),
  overallLength: z.coerce.number().min(1, "Overall length must be positive (mm)").optional().nullable(),
  bodyLength: z.coerce.number().min(1, "Body length must be positive (mm)").optional().nullable(),
  overallHeight: z.coerce.number().min(1, "Overall height must be positive (mm)").optional().nullable(),
  hitchToAxleCenterDistance: z.coerce.number().min(1, "Distance must be positive (mm)").optional().nullable(),
  interAxleSpacing: z.coerce.number().min(1, "Spacing must be positive (mm)").optional().nullable(),
  storageLocations: z.array(storageLocationSchema).optional(),
  waterTanks: z.array(waterTankSchema).optional(),
  wdh: wdhSchema.nullable().optional(),
});


// Add hasWdh to form data type for UI control, but it won't be in the final saved data
type CaravanFormInternalData = CaravanFormData & { hasWdh: boolean };

interface CaravanFormProps {
  initialData?: CaravanFormData;
  onSave: (data: CaravanFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CaravanForm({ initialData, onSave, onCancel, isLoading }: CaravanFormProps) {
  
  const defaultFormValues: CaravanFormInternalData = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    tareMass: 0,
    atm: 0,
    gtm: 0,
    maxTowballDownload: 0,
    numberOfAxles: 1,
    axleGroupRating: 0,
    numberOfGasBottles: 2,
    gasBottleCapacityKg: 9,
    tyreSize: null,
    tyreLoadRating: null,
    tyreSpeedRating: null,
    recommendedTyrePressurePsi: null,
    overallLength: null,
    bodyLength: null,
    overallHeight: null,
    hitchToAxleCenterDistance: null,
    interAxleSpacing: null,
    storageLocations: [],
    waterTanks: [],
    wdh: null,
    hasWdh: false,
  };
  
  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<CaravanFormInternalData>({
    resolver: zodResolver(caravanSchema.extend({ hasWdh: z.boolean() })),
    defaultValues: initialData 
      ? { ...defaultFormValues, ...initialData, hasWdh: !!initialData.wdh } 
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
  const hasWdh = watch("hasWdh");
  const hasIntegratedSway = watch("wdh.hasIntegratedSwayControl");
  
  const watchedForm = watch();

  const { potentialGrossPayload, totalAllocatedWeight } = useMemo(() => {
    const atm = Number(watchedForm.atm);
    const tare = Number(watchedForm.tareMass);
    const payload = (!isNaN(atm) && !isNaN(tare) && atm > tare) ? atm - tare : 0;

    const storage = (watchedForm.storageLocations || []).reduce((sum, loc) => {
        const capacity = Number(loc.maxWeightCapacityKg);
        return sum + (isNaN(capacity) ? 0 : capacity);
    }, 0);

    const water = (watchedForm.waterTanks || []).reduce((sum, tank) => {
        const capacity = Number(tank.capacityLitres);
        return sum + (isNaN(capacity) ? 0 : capacity);
    }, 0);
    
    const numBottles = Number(watchedForm.numberOfGasBottles);
    const bottleCapacity = Number(watchedForm.gasBottleCapacityKg);
    const gas = (!isNaN(numBottles) && !isNaN(bottleCapacity) && numBottles > 0 && bottleCapacity > 0)
        ? numBottles * bottleCapacity
        : 0;

    return { 
      potentialGrossPayload: payload, 
      totalAllocatedWeight: { storage, water, gas, total: storage + water + gas }
    };
  }, [watchedForm]);

  
  useEffect(() => {
    const currentDefaultValues = initialData 
      ? { ...defaultFormValues, ...initialData, hasWdh: !!initialData.wdh } 
      : defaultFormValues;
    reset(currentDefaultValues);
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<CaravanFormInternalData> = (data) => {
    const { hasWdh: hasWdhUIFlag, ...caravanDataToSave } = data;
    
    if (!hasWdhUIFlag) {
        caravanDataToSave.wdh = null;
    }

    const processedData: CaravanFormData = {
      ...caravanDataToSave,
      overallLength: data.overallLength ? Number(data.overallLength) : null,
      bodyLength: data.bodyLength ? Number(data.bodyLength) : null,
      overallHeight: data.overallHeight ? Number(data.overallHeight) : null,
      hitchToAxleCenterDistance: data.hitchToAxleCenterDistance ? Number(data.hitchToAxleCenterDistance) : null,
      interAxleSpacing: data.interAxleSpacing ? Number(data.interAxleSpacing) : null,
      numberOfGasBottles: data.numberOfGasBottles ? Number(data.numberOfGasBottles) : null,
      gasBottleCapacityKg: data.gasBottleCapacityKg ? Number(data.gasBottleCapacityKg) : null,
      storageLocations: data.storageLocations?.map(loc => ({
        ...loc,
        distanceFromAxleCenterMm: loc.distanceFromAxleCenterMm ? Number(loc.distanceFromAxleCenterMm) : null,
        distanceFromCenterlineMm: loc.distanceFromCenterlineMm ? Number(loc.distanceFromCenterlineMm) : null,
        heightFromGroundMm: loc.heightFromGroundMm ? Number(loc.heightFromGroundMm) : null,
        maxWeightCapacityKg: loc.maxWeightCapacityKg ? Number(loc.maxWeightCapacityKg) : null,
      })) || [],
      waterTanks: data.waterTanks?.map(tank => ({
        ...tank,
        capacityLitres: Number(tank.capacityLitres),
        distanceFromAxleCenterMm: tank.distanceFromAxleCenterMm ? Number(tank.distanceFromAxleCenterMm) : null,
      })) || [],
    };
    onSave(processedData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="p-4 border rounded-md space-y-4 bg-muted/30">
        <h3 className="text-lg font-medium font-headline text-primary flex items-center"><Info className="mr-2 h-5 w-5" /> Basic Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="caravanMake" className="font-body">Make</Label>
            <Input id="caravanMake" {...register("make")} placeholder="e.g., Jayco" className="font-body" />
            {errors.make && <p className="text-sm text-destructive font-body mt-1">{errors.make.message}</p>}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="caravanModel" className="font-body">Model</Label>
            <Input id="caravanModel" {...register("model")} placeholder="e.g., Starcraft" className="font-body" />
            {errors.model && <p className="text-sm text-destructive font-body mt-1">{errors.model.message}</p>}
          </div>
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
      </div>

      <div className="p-4 border rounded-md space-y-4 bg-muted/30">
        <h3 className="text-lg font-medium font-headline text-primary flex items-center"><Weight className="mr-2 h-5 w-5" /> Weight Specifications</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <Label htmlFor="maxTowballDownload" className="font-body">Max Towball (kg)</Label>
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
      </div>

      <div className="p-4 border rounded-md space-y-4 bg-muted/30">
        <h3 className="text-lg font-medium font-headline text-primary flex items-center"><Axe className="mr-2 h-5 w-5" /> Axle, Gas & Tyre Specifications</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="axleGroupRating" className="font-body">Axle Group Rating (kg)</Label>
            <Input id="axleGroupRating" type="number" {...register("axleGroupRating")} placeholder="e.g., 2400" className="font-body" />
            {errors.axleGroupRating && <p className="text-sm text-destructive font-body mt-1">{errors.axleGroupRating.message}</p>}
          </div>
          <div>
            <Label htmlFor="numberOfGasBottles" className="font-body"><Flame className="inline h-4 w-4 mr-1"/> # Gas Bottles</Label>
            <Input id="numberOfGasBottles" type="number" {...register("numberOfGasBottles")} placeholder="e.g., 2" className="font-body" />
            {errors.numberOfGasBottles && <p className="text-sm text-destructive font-body mt-1">{errors.numberOfGasBottles.message}</p>}
          </div>
          <div>
            <Label htmlFor="gasBottleCapacityKg" className="font-body">Capacity/Bottle (kg)</Label>
            <Input id="gasBottleCapacityKg" type="number" {...register("gasBottleCapacityKg")} placeholder="e.g., 9" className="font-body" />
            {errors.gasBottleCapacityKg && <p className="text-sm text-destructive font-body mt-1">{errors.gasBottleCapacityKg.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="tyreSize" className="font-body"><Disc className="inline h-4 w-4 mr-1"/> Tyre Size (Opt.)</Label>
            <Input id="tyreSize" {...register("tyreSize")} placeholder="e.g., 235/75R15" className="font-body" />
            {errors.tyreSize && <p className="text-sm text-destructive font-body mt-1">{errors.tyreSize.message}</p>}
          </div>
          <div>
            <Label htmlFor="tyreLoadRating" className="font-body">Load Rating (Opt.)</Label>
            <Input id="tyreLoadRating" type="number" {...register("tyreLoadRating")} placeholder="e.g., 109" className="font-body" />
            {errors.tyreLoadRating && <p className="text-sm text-destructive font-body mt-1">{errors.tyreLoadRating.message}</p>}
          </div>
          <div>
            <Label htmlFor="recommendedTyrePressurePsi" className="font-body">Rec. Tyre PSI (Opt.)</Label>
            <Input id="recommendedTyrePressurePsi" type="number" {...register("recommendedTyrePressurePsi")} placeholder="e.g., 55" className="font-body" />
            {errors.recommendedTyrePressurePsi && <p className="text-sm text-destructive font-body mt-1">{errors.recommendedTyrePressurePsi.message}</p>}
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-md space-y-4 bg-muted/30">
        <h3 className="text-lg font-medium font-headline text-primary flex items-center"><Ruler className="mr-2 h-5 w-5" /> Dimensions (Optional)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
           <div className="col-span-2 md:col-span-3">
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
      </div>

      <div className="p-4 border rounded-md space-y-4 bg-muted/30">
        <div className="flex items-center space-x-2">
          <Controller name="hasWdh" control={control} render={({ field }) => ( <Checkbox id="hasWdh" checked={field.value} onCheckedChange={field.onChange}/> )}/>
          <Label htmlFor="hasWdh" className="font-body font-medium text-lg text-primary flex items-center"><Link2 className="mr-2 h-5 w-5"/> A Weight Distribution Hitch is used</Label>
        </div>
        {hasWdh && (
            <div className="p-4 border rounded-md bg-background space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wdhName" className="font-body">Name / Model</Label>
                      <Input id="wdhName" {...register("wdh.name")} placeholder="e.g., Eaz-Lift Recurve R3" className="font-body" />
                      {errors.wdh?.name && <p className="text-sm text-destructive font-body mt-1">{errors.wdh.name.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="wdhType" className="font-body">Type</Label>
                      <Input id="wdhType" {...register("wdh.type")} placeholder="e.g., Round Bar, Trunnion" className="font-body" />
                      {errors.wdh?.type && <p className="text-sm text-destructive font-body mt-1">{errors.wdh.type.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wdhMax" className="font-body">Max Tow Ball Capacity (kg)</Label>
                      <Input id="wdhMax" type="number" {...register("wdh.maxCapacityKg")} placeholder="e.g., 350" className="font-body" />
                      {errors.wdh?.maxCapacityKg && <p className="text-sm text-destructive font-body mt-1">{errors.wdh.maxCapacityKg.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="wdhMin" className="font-body">Min Tow Ball Capacity (kg) (Optional)</Label>
                      <Input id="wdhMin" type="number" {...register("wdh.minCapacityKg")} placeholder="e.g., 150" className="font-body" />
                      {errors.wdh?.minCapacityKg && <p className="text-sm text-destructive font-body mt-1">{errors.wdh.minCapacityKg.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                       <Controller name="wdh.hasIntegratedSwayControl" control={control} render={({ field }) => <Checkbox id="hasSway" checked={field.value} onCheckedChange={field.onChange} />} />
                      <Label htmlFor="hasSway" className="font-body">Has Integrated Sway Control?</Label>
                    </div>
                  </div>
                  {!hasIntegratedSway && (
                    <div>
                      <Label htmlFor="swayType" className="font-body">Separate Sway Control Type (Optional)</Label>
                      <Input id="swayType" {...register("wdh.swayControlType")} placeholder="e.g., Friction Bar" className="font-body" />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="wdhNotes" className="font-body">Notes (Optional)</Label>
                    <Textarea id="wdhNotes" {...register("wdh.notes")} placeholder="e.g., Number of chain links used..." className="font-body" />
                  </div>
            </div>
        )}
      </div>

      <Separator />
      <h3 className="text-lg font-medium font-headline text-primary">Storage Locations</h3>
      <div className="space-y-4">
        {storageLocationFields.map((field, index) => {
          const currentItemCapacity = Number(watchedForm.storageLocations?.[index]?.maxWeightCapacityKg) || 0;
          const otherAllocatedStorage = totalAllocatedWeight.storage - currentItemCapacity;
          const payloadAllocatedElsewhere = otherAllocatedStorage + totalAllocatedWeight.water + totalAllocatedWeight.gas;
          const remainingPayloadForThisLocation = potentialGrossPayload - payloadAllocatedElsewhere;

          return (
            <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/30">
              <div className="flex justify-between items-center">
                  <Label className="font-body font-medium">Location {index + 1}</Label>
                  <Button type="button" variant="ghost" onClick={() => removeStorageLocation(index)} className="text-destructive hover:bg-destructive/10 self-end sm:col-start-2 sm:justify-self-end p-2 h-8">
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                      <Label htmlFor={`storageLocations.${index}.name`} className="text-xs font-body">Name*</Label>
                      <Input {...register(`storageLocations.${index}.name`)} placeholder="e.g., Front Boot, Kitchen Cupboard" className="font-body bg-background"/>
                      {errors.storageLocations?.[index]?.name && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.name?.message}</p>}
                  </div>
                   <div>
                      <Label htmlFor={`storageLocations.${index}.maxWeightCapacityKg`} className="text-xs font-body">Max Capacity (kg) (Optional)</Label>
                      <Input {...register(`storageLocations.${index}.maxWeightCapacityKg`)} type="number" placeholder="e.g., 50" className="font-body bg-background"/>
                      {errors.storageLocations?.[index]?.maxWeightCapacityKg && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.maxWeightCapacityKg?.message}</p>}
                      {potentialGrossPayload > 0 && (
                          <Alert variant="default" className="mt-2 text-xs p-2 bg-background">
                              <Info className="h-3 w-3" />
                              <AlertDescription>Suggestion: You have approx. <strong>{Math.max(0, remainingPayloadForThisLocation).toFixed(0)} kg</strong> of payload remaining to allocate.</AlertDescription>
                          </Alert>
                      )}
                  </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`storageLocations.${index}.longitudinalPosition`} className="text-xs font-body">Longitudinal Position*</Label>
                  <Controller name={`storageLocations.${index}.longitudinalPosition`} control={control} render={({ field: controllerField }) => (<Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}><SelectTrigger className="font-body bg-background"><SelectValue placeholder="Select longitudinal position" /></SelectTrigger><SelectContent><SelectItem value="front-of-axles">Front of Axle(s)</SelectItem><SelectItem value="over-axles">Over Axle(s)</SelectItem><SelectItem value="rear-of-axles">Rear of Axle(s)</SelectItem></SelectContent></Select>)}/>
                  {errors.storageLocations?.[index]?.longitudinalPosition && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.longitudinalPosition?.message}</p>}
                </div>
                <div>
                  <Label htmlFor={`storageLocations.${index}.lateralPosition`} className="text-xs font-body">Lateral Position*</Label>
                   <Controller name={`storageLocations.${index}.lateralPosition`} control={control} render={({ field: controllerField }) => (<Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}><SelectTrigger className="font-body bg-background"><SelectValue placeholder="Select lateral position" /></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent></Select>)}/>
                  {errors.storageLocations?.[index]?.lateralPosition && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.lateralPosition?.message}</p>}
                </div>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                      <Label htmlFor={`storageLocations.${index}.distanceFromAxleCenterMm`} className="text-xs font-body">Dist. from Axle Center (mm)</Label>
                      <Input {...register(`storageLocations.${index}.distanceFromAxleCenterMm`)} type="number" placeholder="e.g., 1500 (front)" className="font-body bg-background"/>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">Relative to axle(s) center. +ve towards hitch.</p>
                      {errors.storageLocations?.[index]?.distanceFromAxleCenterMm && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.distanceFromAxleCenterMm?.message}</p>}
                  </div>
                   <div>
                      <Label htmlFor={`storageLocations.${index}.distanceFromCenterlineMm`} className="text-xs font-body">Dist. from Centerline (mm)</Label>
                      <Input {...register(`storageLocations.${index}.distanceFromCenterlineMm`)} type="number" placeholder="e.g., -300 (left)" className="font-body bg-background"/>
                       <p className="text-xs text-muted-foreground font-body mt-0.5">Relative to van centerline. +ve right.</p>
                      {errors.storageLocations?.[index]?.distanceFromCenterlineMm && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.distanceFromCenterlineMm?.message}</p>}
                  </div>
                   <div>
                      <Label htmlFor={`storageLocations.${index}.heightFromGroundMm`} className="text-xs font-body">Height from Ground (mm)</Label>
                      <Input {...register(`storageLocations.${index}.heightFromGroundMm`)} type="number" placeholder="e.g., 500" className="font-body bg-background"/>
                       <p className="text-xs text-muted-foreground font-body mt-0.5">Est. center of mass height.</p>
                      {errors.storageLocations?.[index]?.heightFromGroundMm && <p className="text-sm text-destructive font-body mt-1">{errors.storageLocations[index]?.heightFromGroundMm?.message}</p>}
                  </div>
              </div>
            </div>
          );
        })}
        <Button type="button" variant="outline" onClick={() => appendStorageLocation({ id: Date.now().toString(), name: '', longitudinalPosition: 'over-axles', lateralPosition: 'center', distanceFromAxleCenterMm: null, distanceFromCenterlineMm: null, heightFromGroundMm: null, maxWeightCapacityKg: null } as StorageLocation)} className="font-body">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Storage Location
        </Button>
         {errors.storageLocations && typeof errors.storageLocations === 'object' && !Array.isArray(errors.storageLocations) && (errors.storageLocations as any).message && (
            <p className="text-sm text-destructive font-body mt-1">{(errors.storageLocations as any).message}</p>
         )}
      </div>

      <Separator />
      <h3 className="text-lg font-medium font-headline text-primary">Water Tanks</h3>
      <div className="space-y-4">
        {waterTankFields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-md space-y-3 bg-muted/30">
            <div className="flex justify-between items-center">
                <Label className="font-body font-medium">Water Tank {index + 1}</Label>
                <Button type="button" variant="ghost" onClick={() => removeWaterTank(index)} className="text-destructive hover:bg-destructive/10 self-end p-2 h-8">
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
                <Controller name={`waterTanks.${index}.type`} control={control} render={({ field: ctrlField }) => (<Select onValueChange={ctrlField.onChange} defaultValue={ctrlField.value}><SelectTrigger className="font-body bg-background"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="fresh">Fresh Water</SelectItem><SelectItem value="grey">Grey Water</SelectItem><SelectItem value="black">Black Water</SelectItem></SelectContent></Select>)}/>
                {errors.waterTanks?.[index]?.type && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.type?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`waterTanks.${index}.capacityLitres`} className="text-xs font-body">Capacity (Litres)*</Label>
                <Input type="number" {...register(`waterTanks.${index}.capacityLitres`)} placeholder="e.g., 80" className="font-body bg-background"/>
                {errors.waterTanks?.[index]?.capacityLitres && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.capacityLitres?.message}</p>}
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <Label htmlFor={`waterTanks.${index}.longitudinalPosition`} className="text-xs font-body">Longitudinal Pos.*</Label>
                <Controller name={`waterTanks.${index}.longitudinalPosition`} control={control} render={({ field: ctrlField }) => (<Select onValueChange={ctrlField.onChange} defaultValue={ctrlField.value}><SelectTrigger className="font-body bg-background"><SelectValue placeholder="Position" /></SelectTrigger><SelectContent><SelectItem value="front-of-axles">Front</SelectItem><SelectItem value="over-axles">Over Axles</SelectItem><SelectItem value="rear-of-axles">Rear</SelectItem></SelectContent></Select>)}/>
                {errors.waterTanks?.[index]?.longitudinalPosition && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.longitudinalPosition?.message}</p>}
              </div>
              <div>
                <Label htmlFor={`waterTanks.${index}.lateralPosition`} className="text-xs font-body">Lateral Pos.*</Label>
                <Controller name={`waterTanks.${index}.lateralPosition`} control={control} render={({ field: ctrlField }) => (<Select onValueChange={ctrlField.onChange} defaultValue={ctrlField.value}><SelectTrigger className="font-body bg-background"><SelectValue placeholder="Position" /></SelectTrigger><SelectContent><SelectItem value="left">Left</SelectItem><SelectItem value="center">Center</SelectItem><SelectItem value="right">Right</SelectItem></SelectContent></Select>)}/>
                {errors.waterTanks?.[index]?.lateralPosition && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.lateralPosition?.message}</p>}
              </div>
               <div>
                <Label htmlFor={`waterTanks.${index}.distanceFromAxleCenterMm`} className="text-xs font-body">Dist. from Axle (mm)</Label>
                <Input {...register(`waterTanks.${index}.distanceFromAxleCenterMm`)} type="number" placeholder="e.g., 1200" className="font-body bg-background"/>
                {errors.waterTanks?.[index]?.distanceFromAxleCenterMm && <p className="text-sm text-destructive font-body mt-1">{errors.waterTanks[index]?.distanceFromAxleCenterMm?.message}</p>}
              </div>
            </div>
             <p className="text-xs text-muted-foreground font-body -mt-2">For Distance from Axle, a positive number is towards the hitch.</p>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendWaterTank({ id: Date.now().toString(), name: '', type: 'fresh', capacityLitres: 80, longitudinalPosition: 'over-axles', lateralPosition: 'center', distanceFromAxleCenterMm: null } as WaterTank)} className="font-body">
          <Droplet className="mr-2 h-4 w-4" /> Add Water Tank
        </Button>
        {errors.waterTanks && typeof errors.waterTanks === 'object' && !Array.isArray(errors.waterTanks) && (errors.waterTanks as any).message && (
            <p className="text-sm text-destructive font-body mt-1">{(errors.waterTanks as any).message}</p>
        )}
      </div>

      <Separator />

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
