
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

const CARAVAN_DATA_STORAGE_KEY = 'kamperhub_caravan_data';

export function CaravanForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentCaravan, setCurrentCaravan] = useState<CaravanFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CaravanFormData>({
    resolver: zodResolver(caravanSchema),
    defaultValues: currentCaravan || {},
  });

  useEffect(() => {
    setIsLocalStorageReady(true);
  }, []);

  useEffect(() => {
    if (isLocalStorageReady) {
      try {
        const storedData = localStorage.getItem(CARAVAN_DATA_STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setCurrentCaravan(parsedData);
          reset(parsedData);
          setIsEditing(false);
        } else {
          setIsEditing(true); // No data, start in edit mode
        }
      } catch (error) {
        console.error("Error reading caravan data from localStorage:", error);
        toast({
          title: "Error Loading Data",
          description: "Could not load saved caravan data.",
          variant: "destructive",
        });
        setIsEditing(true); // Error loading, default to edit mode
      }
    }
  }, [reset, toast, isLocalStorageReady]);

  const onSubmit: SubmitHandler<CaravanFormData> = async (data) => {
    if (!isLocalStorageReady) return;
    setIsLoading(true);
    try {
      localStorage.setItem(CARAVAN_DATA_STORAGE_KEY, JSON.stringify(data));
      setCurrentCaravan(data);
      setIsEditing(false);
      toast({
        title: "Caravan Data Saved",
        description: `${data.make} ${data.model} details have been updated.`,
      });
    } catch (error) {
      console.error("Error saving caravan data to localStorage:", error);
      toast({
        title: "Error Saving Data",
        description: "Could not save caravan data. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };
  
  if (!isLocalStorageReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Caravan Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-body">Loading caravan data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Caravan Specifications</CardTitle>
        {!isEditing && currentCaravan && (
          <CardDescription className="font-body">
            Currently viewing: {currentCaravan.year} {currentCaravan.make} {currentCaravan.model}. Click "Edit" to make changes.
          </CardDescription>
        )}
         {isEditing && (
           <CardDescription className="font-body">
            {currentCaravan ? `Editing ${currentCaravan.year} ${currentCaravan.make} ${currentCaravan.model}` : "Enter the details of your caravan."}
          </CardDescription>
        )}
      </CardHeader>

      {!isEditing && currentCaravan ? (
        <>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 font-body">
              <p><strong>Make:</strong> {currentCaravan.make}</p>
              <p><strong>Model:</strong> {currentCaravan.model}</p>
              <p><strong>Year:</strong> {currentCaravan.year}</p>
              <p><strong>Tare Mass (kg):</strong> {currentCaravan.tareMass}</p>
              <p><strong>ATM (kg):</strong> {currentCaravan.atm}</p>
              <p><strong>GTM (kg):</strong> {currentCaravan.gtm}</p>
              <p><strong>Max Towball Download (kg):</strong> {currentCaravan.maxTowballDownload}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsEditing(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground font-body">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Caravan Data
            </Button>
          </CardFooter>
        </>
      ) : (
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
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
               <Save className="mr-2 h-4 w-4" /> {currentCaravan ? 'Update Caravan Data' : 'Save Caravan Data'}
            </Button>
            {isEditing && currentCaravan && (
              <Button variant="outline" onClick={() => { reset(currentCaravan); setIsEditing(false); }} disabled={isLoading} className="font-body">
                Cancel
              </Button>
            )}
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

    