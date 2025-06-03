"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const caravanSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  tareMass: z.coerce.number().positive("Tare Mass must be positive"), // Empty weight
  atm: z.coerce.number().positive("ATM must be positive"), // Aggregate Trailer Mass
  gtm: z.coerce.number().positive("GTM must be positive"), // Gross Trailer Mass
  maxTowballDownload: z.coerce.number().positive("Max Towball Download must be positive"),
});

type CaravanFormData = z.infer<typeof caravanSchema>;

export function CaravanForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CaravanFormData>({
    resolver: zodResolver(caravanSchema),
  });

  const onSubmit: SubmitHandler<CaravanFormData> = async (data) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Caravan Data:", data);
    toast({
      title: "Caravan Data Saved",
      description: `${data.make} ${data.model} details have been updated.`,
    });
    setIsLoading(false);
    // reset(); // Optionally reset form
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Caravan Specifications</CardTitle>
        <CardDescription className="font-body">Enter the details of your caravan.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caravanMake" className="font-body">Make</Label>
              <Input id="caravanMake" {...register("make")} placeholder="e.g., Jayco" className="font-body" />
              {errors.make && <p className="text-sm text-destructive font-body">{errors.make.message}</p>}
            </div>
            <div>
              <Label htmlFor="caravanModel" className="font-body">Model</Label>
              <Input id="caravanModel" {...register("model")} placeholder="e.g., Starcraft" className="font-body" />
              {errors.model && <p className="text-sm text-destructive font-body">{errors.model.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caravanYear" className="font-body">Year</Label>
              <Input id="caravanYear" type="number" {...register("year")} placeholder="e.g., 2021" className="font-body" />
              {errors.year && <p className="text-sm text-destructive font-body">{errors.year.message}</p>}
            </div>
            <div>
              <Label htmlFor="tareMass" className="font-body">Tare Mass (kg)</Label>
              <Input id="tareMass" type="number" {...register("tareMass")} placeholder="e.g., 1800" className="font-body" />
              {errors.tareMass && <p className="text-sm text-destructive font-body">{errors.tareMass.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="atm" className="font-body">Aggregate Trailer Mass (ATM) (kg)</Label>
              <Input id="atm" type="number" {...register("atm")} placeholder="e.g., 2500" className="font-body" />
              {errors.atm && <p className="text-sm text-destructive font-body">{errors.atm.message}</p>}
            </div>
            <div>
              <Label htmlFor="gtm" className="font-body">Gross Trailer Mass (GTM) (kg)</Label>
              <Input id="gtm" type="number" {...register("gtm")} placeholder="e.g., 2350" className="font-body" />
              {errors.gtm && <p className="text-sm text-destructive font-body">{errors.gtm.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="maxTowballDownload" className="font-body">Max Towball Download (kg)</Label>
            <Input id="maxTowballDownload" type="number" {...register("maxTowballDownload")} placeholder="e.g., 250" className="font-body" />
            {errors.maxTowballDownload && <p className="text-sm text-destructive font-body">{errors.maxTowballDownload.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
            {isLoading ? 'Saving...' : 'Save Caravan Data'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
