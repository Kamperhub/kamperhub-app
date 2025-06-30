
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { FuelLogEntry } from '@/types/service';
import type { StoredVehicle } from '@/types/vehicle';
import { fetchFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog, fetchVehicles } from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit, Trash2, Car, Info, Loader2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';


const fuelLogFormSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  odometer: z.coerce.number().positive("Odometer must be a positive number."),
  totalCost: z.coerce.number().positive("Total cost must be a positive number."),
  pricePerLitre: z.coerce.number().positive("Price per litre must be positive."),
  location: z.string().optional(),
  notes: z.string().optional(),
});
type FuelLogFormData = z.infer<typeof fuelLogFormSchema>;

export function FuelLogClient() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<FuelLogEntry | null>(null);

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<StoredVehicle[]>({
    queryKey: ['vehicles', user?.uid],
    queryFn: fetchVehicles,
    enabled: !!user,
  });

  const { data: fuelLogs = [], isLoading: isLoadingFuelLogs } = useQuery<FuelLogEntry[]>({
    queryKey: ['fuelLogs', selectedVehicleId],
    queryFn: () => fetchFuelLogs(selectedVehicleId!),
    enabled: !!selectedVehicleId,
  });
  
  const { control, register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FuelLogFormData>({
    resolver: zodResolver(fuelLogFormSchema),
  });

  React.useEffect(() => {
    if (isFormOpen) {
      if (editingLog) {
        setValue('date', parseISO(editingLog.date));
        setValue('odometer', editingLog.odometer);
        setValue('totalCost', editingLog.totalCost);
        setValue('pricePerLitre', editingLog.pricePerLitre);
        setValue('location', editingLog.location);
        setValue('notes', editingLog.notes);
      } else {
        reset({ date: new Date(), odometer: undefined, totalCost: undefined, pricePerLitre: undefined, location: '', notes: '' });
      }
    }
  }, [editingLog, isFormOpen, setValue, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: { vehicleId: string; logData: FuelLogEntry | Omit<FuelLogEntry, 'id' | 'timestamp'> }) => {
      if ('id' in data.logData) {
        return updateFuelLog(data.logData as FuelLogEntry);
      }
      return createFuelLog(data.logData as Omit<FuelLogEntry, 'id' | 'timestamp'>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelLogs', selectedVehicleId] });
      toast({ title: editingLog ? "Log Updated" : "Log Added" });
      setIsFormOpen(false);
      setEditingLog(null);
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (logId: string) => deleteFuelLog(selectedVehicleId!, logId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['fuelLogs', selectedVehicleId] });
        toast({ title: "Log Deleted" });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleSaveLog: SubmitHandler<FuelLogFormData> = (data) => {
    if (!selectedVehicleId) return;

    const litres = data.totalCost / data.pricePerLitre;

    const logData = {
        ...data,
        litres,
        vehicleId: selectedVehicleId,
        date: data.date.toISOString(),
    };

    if (editingLog) {
        saveMutation.mutate({ vehicleId: selectedVehicleId, logData: { ...editingLog, ...logData, totalCost: data.totalCost } });
    } else {
        saveMutation.mutate({ vehicleId: selectedVehicleId, logData });
    }
  };

  const handleEditLog = (log: FuelLogEntry) => {
    setEditingLog(log);
    setIsFormOpen(true);
  };
  
  if (isLoadingVehicles) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Fuel Log</CardTitle>
            <CardDescription>Track fuel consumption for your vehicles.</CardDescription>
          </div>
           <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => setEditingLog(null)} disabled={!selectedVehicleId}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Fuel Entry
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingLog ? "Edit" : "Add"} Fuel Entry</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleSaveLog)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date">Date</Label>
                             <Controller name="date" control={control} render={({ field }) => (
                                <Popover><PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4"/>
                                        {field.value ? format(field.value, "PP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/></PopoverContent></Popover>
                            )} />
                            {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="odometer">Odometer (km)</Label>
                            <Input id="odometer" type="number" {...register('odometer')} />
                            {errors.odometer && <p className="text-destructive text-sm mt-1">{errors.odometer.message}</p>}
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="totalCost">Total Cost ($)</Label>
                            <Input id="totalCost" type="number" step="0.01" {...register('totalCost')} />
                            {errors.totalCost && <p className="text-destructive text-sm mt-1">{errors.totalCost.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="pricePerLitre">Price / Litre</Label>
                            <Input id="pricePerLitre" type="number" step="0.001" {...register('pricePerLitre')} />
                            {errors.pricePerLitre && <p className="text-destructive text-sm mt-1">{errors.pricePerLitre.message}</p>}
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="location">Location (Optional)</Label>
                        <Input id="location" {...register('location')} />
                    </div>
                    <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea id="notes" {...register('notes')} />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save Entry</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {vehicles.length > 0 ? (
           <div className="max-w-xs">
             <Label htmlFor="vehicle-select">Select Vehicle</Label>
             <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId ?? ''}>
                 <SelectTrigger id="vehicle-select">
                     <SelectValue placeholder="Choose a vehicle..." />
                 </SelectTrigger>
                 <SelectContent>
                     {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}
                 </SelectContent>
             </Select>
           </div>
        ) : (
            <Alert>
                <Car className="h-4 w-4" />
                <AlertTitle>No Vehicles Found</AlertTitle>
                <AlertDescription>Please add a vehicle in the 'Vehicle & Caravan Setup' section to start logging fuel.</AlertDescription>
            </Alert>
        )}

        {isLoadingFuelLogs && selectedVehicleId && <p>Loading logs...</p>}

        {selectedVehicleId && !isLoadingFuelLogs && fuelLogs.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No fuel logs for this vehicle yet.</p>
        )}

        {selectedVehicleId && !isLoadingFuelLogs && fuelLogs.length > 0 && (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Odometer</TableHead>
                        <TableHead className="text-right">Litres</TableHead>
                        <TableHead className="text-right">$/Litre</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fuelLogs.map(log => (
                        <TableRow key={log.id}>
                            <TableCell>{format(parseISO(log.date), 'PP')}</TableCell>
                            <TableCell>{log.odometer} km</TableCell>
                            <TableCell className="text-right">{log.litres.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${log.pricePerLitre.toFixed(3)}</TableCell>
                            <TableCell className="text-right">${log.totalCost.toFixed(2)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleEditLog(log)}><Edit className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(log.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}
