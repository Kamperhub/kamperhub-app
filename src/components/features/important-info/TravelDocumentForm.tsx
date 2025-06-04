
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TravelDocument } from '@/types/importantInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const travelDocumentSchema = z.object({
  type: z.string().min(1, "Document type is required"),
  policyNumber: z.string().min(1, "Policy/Document number is required"),
  provider: z.string().min(1, "Provider/Issuing body is required"),
  expiryDate: z.string().optional().nullable(), // Stored as string, validated if present
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
    if (data.expiryDate) {
        try {
            parseISO(data.expiryDate); // Check if it's a valid ISO date string
            return true;
        } catch {
            return false;
        }
    }
    return true;
}, {
    message: "Invalid expiry date format.",
    path: ["expiryDate"],
});


type TravelDocumentFormData = Omit<TravelDocument, 'id'>;

interface TravelDocumentFormProps {
  onSubmit: (data: TravelDocumentFormData) => void;
  initialData?: TravelDocumentFormData;
}

export function TravelDocumentForm({ onSubmit, initialData }: TravelDocumentFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TravelDocumentFormData>({
    resolver: zodResolver(travelDocumentSchema),
    defaultValues: initialData || { type: '', policyNumber: '', provider: '', expiryDate: undefined, contactPhone: '', notes: '' },
  });

  const expiryDateValue = watch("expiryDate");

  const handleFormSubmit: SubmitHandler<TravelDocumentFormData> = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="td-type" className="font-body">Document Type</Label>
        <Input id="td-type" {...register("type")} placeholder="e.g., Caravan Insurance, Rego" className="font-body" />
        {errors.type && <p className="text-sm text-destructive font-body mt-1">{errors.type.message}</p>}
      </div>
      <div>
        <Label htmlFor="td-policyNumber" className="font-body">Policy/Document Number</Label>
        <Input id="td-policyNumber" {...register("policyNumber")} placeholder="e.g., POL123456789" className="font-body" />
        {errors.policyNumber && <p className="text-sm text-destructive font-body mt-1">{errors.policyNumber.message}</p>}
      </div>
      <div>
        <Label htmlFor="td-provider" className="font-body">Provider/Issuing Body</Label>
        <Input id="td-provider" {...register("provider")} placeholder="e.g., Allianz, Service NSW" className="font-body" />
        {errors.provider && <p className="text-sm text-destructive font-body mt-1">{errors.provider.message}</p>}
      </div>
      <div>
        <Label htmlFor="td-expiryDate" className="font-body">Expiry Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal font-body",
                !expiryDateValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expiryDateValue ? format(parseISO(expiryDateValue), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={expiryDateValue ? parseISO(expiryDateValue) : undefined}
              onSelect={(date) => setValue("expiryDate", date ? date.toISOString() : undefined)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.expiryDate && <p className="text-sm text-destructive font-body mt-1">{errors.expiryDate.message}</p>}
      </div>
      <div>
        <Label htmlFor="td-contactPhone" className="font-body">Contact Phone (Optional)</Label>
        <Input id="td-contactPhone" type="tel" {...register("contactPhone")} placeholder="e.g., 1300 123 456 (for claims)" className="font-body" />
        {errors.contactPhone && <p className="text-sm text-destructive font-body mt-1">{errors.contactPhone.message}</p>}
      </div>
      <div>
        <Label htmlFor="td-notes" className="font-body">Notes (Optional)</Label>
        <Textarea id="td-notes" {...register("notes")} placeholder="e.g., Roadside assistance number, website" className="font-body" />
        {errors.notes && <p className="text-sm text-destructive font-body mt-1">{errors.notes.message}</p>}
      </div>
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-body">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Document
      </Button>
    </form>
  );
}
