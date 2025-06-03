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

export function VehicleForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  const onSubmit: SubmitHandler<VehicleFormData> = async (data) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Tow Vehicle Data:", data);
    toast({
      title: "Vehicle Data Saved",
      description: `${data.make} ${data.model} details have been updated.`,
    });
    setIsLoading(false);
    // reset(); // Optionally reset form
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Tow Vehicle Specifications</CardTitle>
        <CardDescription className="font-body">Enter the details of your tow vehicle.</CardDescription>
      </CardHeader>
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
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
            {isLoading ? 'Saving...' : 'Save Vehicle Data'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
