
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { WDHFormData } from '@/types/wdh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, XCircle } from 'lucide-react';
import React from 'react';

const wdhSchema = z.object({
  name: z.string().min(1, "WDH Name/Model is required"),
  type: z.string().min(1, "WDH Type is required (e.g., Round Bar, Trunnion)"),
  maxCapacityKg: z.coerce.number().positive("Max Tow Ball Capacity must be a positive number"),
  minCapacityKg: z.coerce.number().min(0, "Min Tow Ball Capacity cannot be negative").optional().nullable(),
  hasIntegratedSwayControl: z.boolean().default(false),
  swayControlType: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(data => {
  if (data.minCapacityKg && data.maxCapacityKg && data.minCapacityKg > data.maxCapacityKg) {
    return false;
  }
  return true;
}, {
  message: "Min Tow Ball Capacity cannot be greater than Max Capacity.",
  path: ["minCapacityKg"],
});

interface WDHFormProps {
  initialData?: WDHFormData;
  onSave: (data: WDHFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WDHForm({ initialData, onSave, onCancel, isLoading }: WDHFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, control, watch } = useForm<WDHFormData>({
    resolver: zodResolver(wdhSchema),
    defaultValues: initialData || {
      name: '',
      type: '',
      maxCapacityKg: 0,
      minCapacityKg: null,
      hasIntegratedSwayControl: false,
      swayControlType: null,
      notes: null,
    },
  });

  const hasIntegratedSway = watch("hasIntegratedSwayControl");

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: '',
        type: '',
        maxCapacityKg: 0,
        minCapacityKg: null,
        hasIntegratedSwayControl: false,
        swayControlType: null,
        notes: null,
      });
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<WDHFormData> = (data) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="wdhName" className="font-body">Name / Model</Label>
          <Input id="wdhName" {...register("name")} placeholder="e.g., Eaz-Lift Recurve R3" className="font-body" />
          {errors.name && <p className="text-sm text-destructive font-body mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="wdhType" className="font-body">Type</Label>
          <Input id="wdhType" {...register("type")} placeholder="e.g., Round Bar, Trunnion" className="font-body" />
          {errors.type && <p className="text-sm text-destructive font-body mt-1">{errors.type.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="maxCapacityKg" className="font-body">Max Tow Ball Capacity (kg)</Label>
          <Input id="maxCapacityKg" type="number" {...register("maxCapacityKg")} placeholder="e.g., 350" className="font-body" />
          {errors.maxCapacityKg && <p className="text-sm text-destructive font-body mt-1">{errors.maxCapacityKg.message}</p>}
        </div>
        <div>
          <Label htmlFor="minCapacityKg" className="font-body">Min Tow Ball Capacity (kg) (Optional)</Label>
          <Input id="minCapacityKg" type="number" {...register("minCapacityKg")} placeholder="e.g., 150" className="font-body" />
          {errors.minCapacityKg && <p className="text-sm text-destructive font-body mt-1">{errors.minCapacityKg.message}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasIntegratedSwayControl"
            {...control.register("hasIntegratedSwayControl")}
            checked={hasIntegratedSway}
            onCheckedChange={(checked) => control.setValue("hasIntegratedSwayControl", !!checked)}
          />
          <Label htmlFor="hasIntegratedSwayControl" className="font-body">Has Integrated Sway Control?</Label>
        </div>
        {errors.hasIntegratedSwayControl && <p className="text-sm text-destructive font-body mt-1">{errors.hasIntegratedSwayControl.message}</p>}
      </div>

      {!hasIntegratedSway && (
        <div>
          <Label htmlFor="swayControlType" className="font-body">Separate Sway Control Type (Optional)</Label>
          <Input id="swayControlType" {...register("swayControlType")} placeholder="e.g., Friction Bar, Dual Cam Add-on" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">If WDH doesn't have integrated sway control, describe any add-on sway control used.</p>
          {errors.swayControlType && <p className="text-sm text-destructive font-body mt-1">{errors.swayControlType.message}</p>}
        </div>
      )}
      
      <div>
        <Label htmlFor="wdhNotes" className="font-body">Notes (Optional)</Label>
        <Textarea id="wdhNotes" {...register("notes")} placeholder="e.g., Number of chain links used, setup details..." className="font-body" />
        {errors.notes && <p className="text-sm text-destructive font-body mt-1">{errors.notes.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="font-body">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
          <Save className="mr-2 h-4 w-4" /> {initialData ? 'Update WDH' : 'Save WDH'}
        </Button>
      </div>
    </form>
  );
}
