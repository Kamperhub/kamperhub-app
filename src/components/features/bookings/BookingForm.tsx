
"use client";

import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { BookingEntry } from '@/types/booking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Save, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

const bookingSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  locationAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  contactWebsite: z.string().url("Must be a valid URL (e.g., https://example.com)").optional().or(z.literal('')),
  confirmationNumber: z.string().optional(),
  checkInDate: z.string().refine(val => isValid(parseISO(val)), { message: "Check-in date is required" }),
  checkOutDate: z.string().refine(val => isValid(parseISO(val)), { message: "Check-out date is required" }),
  notes: z.string().optional(),
}).refine(data => {
    const checkIn = parseISO(data.checkInDate);
    const checkOut = parseISO(data.checkOutDate);
    return checkOut >= checkIn;
}, {
    message: "Check-out date must be on or after check-in date",
    path: ["checkOutDate"],
});

type BookingFormData = Omit<BookingEntry, 'id' | 'timestamp'>;

interface BookingFormProps {
  initialData?: BookingEntry;
  onSave: (data: BookingFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BookingForm({ initialData, onSave, onCancel, isLoading }: BookingFormProps) {
  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: initialData ? {
      ...initialData,
      checkInDate: initialData.checkInDate ? format(parseISO(initialData.checkInDate), 'yyyy-MM-dd') : '',
      checkOutDate: initialData.checkOutDate ? format(parseISO(initialData.checkOutDate), 'yyyy-MM-dd') : '',
    } : {
      siteName: '',
      locationAddress: '',
      contactPhone: '',
      contactWebsite: '',
      confirmationNumber: '',
      checkInDate: '',
      checkOutDate: '',
      notes: '',
    },
  });

  const locationAddressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (
      typeof window.google === 'undefined' ||
      !window.google.maps ||
      !window.google.maps.places ||
      typeof window.google.maps.places.Autocomplete !== 'function' || 
      !locationAddressInputRef.current
    ) {
      console.warn("Google Maps Autocomplete API not ready for BookingForm or input ref not available.");
      return;
    }

    if (autocompleteRef.current && typeof window.google.maps.event !== 'undefined') {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null; 
    }

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(locationAddressInputRef.current, {
        fields: ["formatted_address", "name"], 
        types: ["geocode"], // Changed from ["address"] to ["geocode"]
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          setValue("locationAddress", place.formatted_address, { shouldValidate: true, shouldDirty: true });
        } else if (locationAddressInputRef.current) {
          setValue("locationAddress", locationAddressInputRef.current.value, { shouldValidate: true, shouldDirty: true });
        }
      });
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete for booking address:", error);
    }

    const currentInputRef = locationAddressInputRef.current;
    const onKeyDownPreventSubmit = (event: KeyboardEvent) => {
      const pacContainer = document.querySelector('.pac-container');
      if (event.key === 'Enter' && pacContainer && getComputedStyle(pacContainer).display !== 'none') {
        event.preventDefault();
      }
    };

    if (currentInputRef) {
      currentInputRef.addEventListener('keydown', onKeyDownPreventSubmit);
    }

    return () => {
      if (currentInputRef) {
        currentInputRef.removeEventListener('keydown', onKeyDownPreventSubmit);
      }
      if (autocompleteRef.current && typeof window.google !== 'undefined' && window.google.maps && window.google.maps.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      autocompleteRef.current = null; 
    };
  }, []); 

  const onSubmit: SubmitHandler<BookingFormData> = (data) => {
    onSave(data);
    reset(); 
  };

  const checkInDateValue = watch("checkInDate");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="siteName" className="font-body">Site Name*</Label>
        <Input id="siteName" {...register("siteName")} placeholder="e.g., Big Valley Campsite" className="font-body" />
        {errors.siteName && <p className="text-sm text-destructive font-body mt-1">{errors.siteName.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="checkInDate" className="font-body">Check-in Date*</Label>
          <Controller
            name="checkInDate"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal font-body",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? parseISO(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.checkInDate && <p className="text-sm text-destructive font-body mt-1">{errors.checkInDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="checkOutDate" className="font-body">Check-out Date*</Label>
           <Controller
            name="checkOutDate"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal font-body",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(parseISO(field.value), "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? parseISO(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    disabled={(date) =>
                      checkInDateValue ? date < parseISO(checkInDateValue) : false
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.checkOutDate && <p className="text-sm text-destructive font-body mt-1">{errors.checkOutDate.message}</p>}
        </div>
      </div>
      
      <div>
        <Label htmlFor="locationAddress" className="font-body">Location / Address</Label>
        <Controller
          name="locationAddress"
          control={control}
          render={({ field }) => (
            <Input
              id="locationAddress"
              ref={(el) => {
                field.ref(el);
                locationAddressInputRef.current = el;
              }}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              value={field.value || ''}
              placeholder="e.g., 123 Scenic Route, Nature Town"
              className="font-body"
              autoComplete="off" 
            />
          )}
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
