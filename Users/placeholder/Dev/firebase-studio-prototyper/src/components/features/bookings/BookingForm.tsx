
"use client";

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { BookingEntry } from '@/types/booking';
import type { LoggedTrip } from '@/types/tripplanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Save, XCircle, DollarSign, Route } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useState } from 'react';

const bookingSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  locationAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  contactWebsite: z.string().url("Must be a valid URL (e.g., https://example.com)").optional().or(z.literal('')),
  confirmationNumber: z.string().optional(),
  dateRange: z.object({
    from: z.date({ required_error: "Check-in date is required." }),
    to: z.date({ required_error: "Check-out date is required." }),
  }),
  notes: z.string().optional(),
  budgetedCost: z.coerce.number().min(0, "Budgeted cost must be non-negative").optional().nullable(),
  assignedTripId: z.string().nullable().optional(),
}).refine(data => new Date(data.checkOutDate) >= new Date(data.checkInDate), {
    message: "Check-out date must be on or after check-in date",
    path: ["checkOutDate"],
});

// The form data type is slightly different from the saved type due to the dateRange object
type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  initialData?: BookingEntry;
  onSave: (data: Omit<BookingEntry, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
  trips: LoggedTrip[];
}

export function BookingForm({ initialData, onSave, onCancel, isLoading, trips }: BookingFormProps) {
  // THIS is the state that was missing and causing the issue.
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  const { control, register, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      siteName: initialData?.siteName || '',
      locationAddress: initialData?.locationAddress || '',
      contactPhone: initialData?.contactPhone || '',
      contactWebsite: initialData?.contactWebsite || '',
      confirmationNumber: initialData?.confirmationNumber || '',
      dateRange: {
        from: initialData?.checkInDate && isValid(parseISO(initialData.checkInDate)) ? parseISO(initialData.checkInDate) : undefined,
        to: initialData?.checkOutDate && isValid(parseISO(initialData.checkOutDate)) ? parseISO(initialData.checkOutDate) : undefined,
      },
      notes: initialData?.notes || '',
      budgetedCost: initialData?.budgetedCost ?? null,
      assignedTripId: initialData?.assignedTripId ?? null,
    },
  });

  const onSubmit: SubmitHandler<BookingFormData> = (data) => {
    // Transform dateRange back to checkInDate and checkOutDate ISO strings for saving
    const dataToSave = {
        ...data,
        checkInDate: data.dateRange.from.toISOString(),
        checkOutDate: data.dateRange.to.toISOString(),
    };
    // We don't want to save the `dateRange` object itself
    delete (dataToSave as any).dateRange;

    onSave(dataToSave);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="siteName" className="font-body">Site Name*</Label>
        <Input id="siteName" {...register("siteName")} placeholder="e.g., Big Valley Campsite" className="font-body" />
        {errors.siteName && <p className="text-sm text-destructive font-body mt-1">{errors.siteName.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="dateRange" className="font-body">Check-in / Check-out Dates*</Label>
           <Controller name="dateRange" control={control} render={({ field }) => (
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button id="dateRange" variant={"outline"} className={cn("w-full justify-start text-left font-normal font-body", !field.value?.from && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value?.from ? (field.value.to ? `${format(field.value.from, "LLL dd, yyyy")} - ${format(field.value.to, "LLL dd, yyyy")}` : format(field.value.from, "LLL dd, yyyy")) : <span>Pick a date range</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    initialFocus 
                    mode="range" 
                    defaultMonth={field.value?.from} 
                    selected={field.value as DateRange | undefined} 
                    onSelect={(range) => {
                      field.onChange(range);
                      // THIS is the critical logic that closes the popover after selection.
                      if (range?.from && range?.to) {
                        setIsDatePopoverOpen(false);
                      }
                    }}
                    numberOfMonths={2} 
                  />
                </PopoverContent>
              </Popover>
            )} />
          {(errors.dateRange || errors.dateRange?.from || errors.dateRange?.to) && <p className="text-sm text-destructive font-body mt-1">{errors.dateRange?.message || errors.dateRange?.from?.message || errors.dateRange?.to?.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budgetedCost" className="font-body flex items-center"><DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />Budgeted Cost (Optional)</Label>
            <Input id="budgetedCost" type="number" step="0.01" {...register('budgetedCost')} placeholder="e.g., 250.00" className="font-body"/>
            {errors.budgetedCost && <p className="text-sm text-destructive font-body mt-1">{errors.budgetedCost.message}</p>}
          </div>
          <div>
            <Label htmlFor="assignedTripId" className="font-body flex items-center"><Route className="mr-1 h-4 w-4 text-muted-foreground" />Assign to Trip (Optional)</Label>
            <Controller
                name="assignedTripId"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={v => field.onChange(v === 'none' ? null : v)} value={field.value || 'none'}>
                        <SelectTrigger className="font-body"><SelectValue placeholder="Select a trip..."/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">-- No Trip --</SelectItem>
                            {trips.map(trip => <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.assignedTripId && <p className="text-sm text-destructive font-body mt-1">{errors.assignedTripId.message}</p>}
          </div>
      </div>

      <div>
        <Label htmlFor="locationAddress" className="font-body">Location / Address</Label>
        <Input 
            id="locationAddress" 
            {...register("locationAddress")} 
            placeholder="e.g., 123 Scenic Route, Nature Town" 
            className="font-body" 
        />
        {errors.locationAddress && <p className="text-sm text-destructive font-body mt-1">{errors.locationAddress.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPhone" className="font-body">Contact Phone</Label>
          <Input id="contactPhone" {...register("contactPhone")} placeholder="e.g., (08) 9876 5432" className="font-body" />
          {errors.contactPhone && <p className="text-sm text-destructive font-body mt-1">{errors.contactPhone.message}</p>}
        </div>
        <div>
          <Label htmlFor="contactWebsite" className="font-body">Contact Website</Label>
          <Input id="contactWebsite" {...register("contactWebsite")} placeholder="e.g., https://www.bigvalley.com.au" className="font-body" />
          {errors.contactWebsite && <p className="text-sm text-destructive font-body mt-1">{errors.contactWebsite.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="confirmationNumber" className="font-body">Confirmation Number</Label>
        <Input id="confirmationNumber" {...register("confirmationNumber")} placeholder="e.g., BKNG12345XYZ" className="font-body" />
        {errors.confirmationNumber && <p className="text-sm text-destructive font-body mt-1">{errors.confirmationNumber.message}</p>}
      </div>

      <div>
        <Label htmlFor="notes" className="font-body">Notes</Label>
        <Textarea id="notes" {...register("notes")} placeholder="e.g., Request site near amenities, late arrival info" className="font-body" />
        {errors.notes && <p className="text-sm text-destructive font-body mt-1">{errors.notes.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="font-body">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
          <Save className="mr-2 h-4 w-4" /> {initialData ? 'Update Booking' : 'Save Booking'}
        </Button>
      </div>
    </form>
  );
}
