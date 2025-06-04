
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CaravanFormData } from '@/types/caravan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, XCircle } from 'lucide-react';

const caravanSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 2, "Invalid year"),
  tareMass: z.coerce.number().positive("Tare Mass must be positive"),
  atm: z.coerce.number().positive("ATM must be positive"),
  gtm: z.coerce.number().positive("GTM must be positive"),
  maxTowballDownload: z.coerce.number().positive("Max Towball Download must be positive"),
});

interface CaravanFormProps {
  initialData?: CaravanFormData;
  onSave: (data: CaravanFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CaravanForm({ initialData, onSave, onCancel, isLoading }: CaravanFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CaravanFormData>({
    resolver: zodResolver(caravanSchema),
    defaultValues: initialData || {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      tareMass: 0,
      atm: 0,
      gtm: 0,
      maxTowballDownload: 0,
    },
  });

  const onSubmit: SubmitHandler<CaravanFormData> = (data) => {
    onSave(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Label htmlFor="tareMass" className="font-body">Tare Mass (kg)</Label>
          <Input id="tareMass" type="number" {...register("tareMass")} placeholder="e.g., 1800" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Weight of the empty caravan (no water, gas, payload).</p>
          {errors.tareMass && <p className="text-sm text-destructive font-body mt-1">{errors.tareMass.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="atm" className="font-body">Aggregate Trailer Mass (ATM) (kg)</Label>
          <Input id="atm" type="number" {...register("atm")} placeholder="e.g., 2500" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Max total weight of the loaded caravan (uncoupled).</p>
          {errors.atm && <p className="text-sm text-destructive font-body mt-1">{errors.atm.message}</p>}
        </div>
        <div>
          <Label htmlFor="gtm" className="font-body">Gross Trailer Mass (GTM) (kg)</Label>
          <Input id="gtm" type="number" {...register("gtm")} placeholder="e.g., 2350" className="font-body" />
          <p className="text-xs text-muted-foreground font-body mt-1">Max weight on caravan axles (when coupled).</p>
          {errors.gtm && <p className="text-sm text-destructive font-body mt-1">{errors.gtm.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="maxTowballDownload" className="font-body">Max Towball Download (kg)</Label>
        <Input id="maxTowballDownload" type="number" {...register("maxTowballDownload")} placeholder="e.g., 250" className="font-body" />
        <p className="text-xs text-muted-foreground font-body mt-1">Max weight the caravan can put on the towball.</p>
        {errors.maxTowballDownload && <p className="text-sm text-destructive font-body mt-1">{errors.maxTowballDownload.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="font-body">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
          <Save className="mr-2 h-4 w-4" /> Save Caravan
        </Button>
      </div>
    </form>
  );
}
