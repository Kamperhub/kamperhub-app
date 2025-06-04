
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EmergencyContact } from '@/types/importantInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have this
import { PlusCircle } from 'lucide-react';

const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  relationship: z.string().min(1, "Relationship is required"),
  notes: z.string().optional(),
});

type EmergencyContactFormData = Omit<EmergencyContact, 'id'>;

interface EmergencyContactFormProps {
  onSubmit: (data: EmergencyContactFormData) => void;
  initialData?: EmergencyContactFormData; // For editing in future
}

export function EmergencyContactForm({ onSubmit, initialData }: EmergencyContactFormProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EmergencyContactFormData>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: initialData || { name: '', phone: '', relationship: '', notes: '' },
  });

  const handleFormSubmit: SubmitHandler<EmergencyContactFormData> = (data) => {
    onSubmit(data);
    reset(); // Reset form after submission
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="ec-name" className="font-body">Name</Label>
        <Input id="ec-name" {...register("name")} placeholder="e.g., Jane Doe" className="font-body" />
        {errors.name && <p className="text-sm text-destructive font-body mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="ec-phone" className="font-body">Phone Number</Label>
        <Input id="ec-phone" type="tel" {...register("phone")} placeholder="e.g., 0400 123 456" className="font-body" />
        {errors.phone && <p className="text-sm text-destructive font-body mt-1">{errors.phone.message}</p>}
      </div>
      <div>
        <Label htmlFor="ec-relationship" className="font-body">Relationship</Label>
        <Input id="ec-relationship" {...register("relationship")} placeholder="e.g., Partner, Parent" className="font-body" />
        {errors.relationship && <p className="text-sm text-destructive font-body mt-1">{errors.relationship.message}</p>}
      </div>
      <div>
        <Label htmlFor="ec-notes" className="font-body">Notes (Optional)</Label>
        <Textarea id="ec-notes" {...register("notes")} placeholder="e.g., Allergic to penicillin" className="font-body" />
        {errors.notes && <p className="text-sm text-destructive font-body mt-1">{errors.notes.message}</p>}
      </div>
      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-body">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Contact
      </Button>
    </form>
  );
}
