
"use client";

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, XCircle, Mail, User, MapPin, Building, Globe, UserCircle as UserCircleIcon } from 'lucide-react';
import type { UserProfile } from '@/types/auth';

// Schema for the fields that can be edited
export const editProfileSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  displayName: z.string()
    .min(3, "Username must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, underscores, hyphens, and periods."),
  email: z.string().email("Please enter a valid email address"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State / Region is required"),
  country: z.string().min(1, "Country is required"),
});

export type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileFormProps {
  initialData: Partial<EditProfileFormData>;
  onSave: (data: EditProfileFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EditProfileForm({ initialData, onSave, onCancel, isLoading }: EditProfileFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      displayName: initialData.displayName || '',
      email: initialData.email || '',
      city: initialData.city || '',
      state: initialData.state || '',
      country: initialData.country || '',
    }
  });

  const onSubmit: SubmitHandler<EditProfileFormData> = async (data) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editFirstName" className="font-body">First Name*</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="editFirstName" {...register("firstName")} placeholder="e.g., Jane" className="font-body pl-10" />
              </div>
              {errors.firstName && <p className="text-xs text-destructive font-body mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label htmlFor="editLastName" className="font-body">Last Name*</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="editLastName" {...register("lastName")} placeholder="e.g., Doe" className="font-body pl-10" />
              </div>
              {errors.lastName && <p className="text-xs text-destructive font-body mt-1">{errors.lastName.message}</p>}
            </div>
        </div>
      <div>
          <Label htmlFor="editDisplayName" className="font-body">Username (Display Name)*</Label>
          <div className="relative">
            <UserCircleIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="editDisplayName"
              {...register("displayName")}
              placeholder="e.g., CamperPro123"
              disabled={isLoading}
              className="font-body pl-10"
            />
          </div>
          {errors.displayName && <p className="text-xs text-destructive font-body mt-1">{errors.displayName.message}</p>}
        </div>
      <div>
        <Label htmlFor="editEmail" className="font-body">Email Address*</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="editEmail"
            type="email"
            {...register("email")}
            placeholder="e.g., your.email@example.com"
            disabled={isLoading}
            className="font-body pl-10"
          />
        </div>
        {errors.email && <p className="text-xs text-destructive font-body mt-1">{errors.email.message}</p>}
      </div>
      
      <h3 className="font-headline text-md text-primary pt-2 border-t mt-4">Location Details*</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="editCity" className="font-body">City*</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="editCity" {...register("city")} placeholder="e.g., Perth" disabled={isLoading} className="font-body pl-10" />
          </div>
          {errors.city && <p className="text-xs text-destructive font-body mt-1">{errors.city.message}</p>}
        </div>
        <div>
          <Label htmlFor="editState" className="font-body">State / Region*</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="editState" {...register("state")} placeholder="e.g., WA" disabled={isLoading} className="font-body pl-10" />
          </div>
          {errors.state && <p className="text-xs text-destructive font-body mt-1">{errors.state.message}</p>}
        </div>
        <div>
          <Label htmlFor="editCountry" className="font-body">Country*</Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="editCountry" {...register("country")} placeholder="e.g., Australia" disabled={isLoading} className="font-body pl-10" />
          </div>
          {errors.country && <p className="text-xs text-destructive font-body mt-1">{errors.country.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="font-body">
          <XCircle className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-body">
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>
    </form>
  );
}
