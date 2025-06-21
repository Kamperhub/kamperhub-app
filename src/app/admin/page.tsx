
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UserCog, ShieldAlert, CalendarIcon, AlertTriangle, Loader2, Send, Mail } from 'lucide-react';
import type { SubscriptionTier } from '@/types/auth';

const ADMIN_EMAIL = 'info@kamperhub.com';

const updateSubscriptionFormSchema = z.object({
  targetUserEmail: z.string().email("Please enter a valid email address for the target user."),
  newTier: z.enum(["free", "pro", "trialing", "trial_expired"], {
    required_error: "New subscription tier is required.",
  }),
  newStatus: z.string().optional(),
  newTrialEndsAt: z.date().nullable().optional(),
  newCurrentPeriodEnd: z.date().nullable().optional(),
});

type UpdateSubscriptionFormData = z.infer<typeof updateSubscriptionFormSchema>;

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<UpdateSubscriptionFormData>({
    resolver: zodResolver(updateSubscriptionFormSchema),
    defaultValues: {
      targetUserEmail: '',
      newTier: 'free', // Default to 'free'
      newStatus: '',
      newTrialEndsAt: null,
      newCurrentPeriodEnd: null,
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user && user.email !== ADMIN_EMAIL) {
        // Non-admin user, handled in render
      } else if (!user) {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const onSubmit: SubmitHandler<UpdateSubscriptionFormData> = async (data) => {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      toast({ title: "Error", description: "Unauthorized action.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const idToken = await currentUser.getIdToken(true);
      const payload: any = {
        targetUserEmail: data.targetUserEmail,
        newTier: data.newTier,
      };
      if (data.newStatus) payload.newStatus = data.newStatus;
      if (data.newTrialEndsAt) payload.newTrialEndsAt = data.newTrialEndsAt.toISOString();
      if (data.newCurrentPeriodEnd) payload.newCurrentPeriodEnd = data.newCurrentPeriodEnd.toISOString();
      
      const response = await fetch('/api/admin/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "Success", description: result.message || "Subscription updated successfully." });
        reset();
      } else {
        toast({
          title: "Error Updating Subscription",
          description: result.error || result.message || "An unknown error occurred.",
          variant: "destructive",
          duration: 7000,
        });
        if (result.details) {
            console.error("API Error Details:", result.details);
        }
      }
    } catch (error: any) {
      toast({
        title: "Client-Side Error",
        description: error.message || "Failed to send request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isAuthLoading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-headline text-destructive mb-2">Access Denied</h1>
        <p className="text-lg text-muted-foreground font-body">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-6 font-body">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center">
            <UserCog className="mr-3 h-7 w-7" /> Admin - User Subscription Management
          </CardTitle>
          <CardDescription className="font-body">
            Update subscription details for a specific user by their email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="font-headline">Important: Admin Action</AlertTitle>
            <AlertDescription className="font-body">
              Changes made here directly modify user data and subscription status. Proceed with caution.
              These changes bypass standard Stripe webhook flows for immediate effect.
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="targetUserEmail" className="font-body">Target User Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="targetUserEmail"
                  {...register("targetUserEmail")}
                  placeholder="Enter the email address of the user"
                  className="font-body pl-10"
                  disabled={isSubmitting}
                  type="email"
                />
              </div>
              {errors.targetUserEmail && <p className="text-sm text-destructive mt-1 font-body">{errors.targetUserEmail.message}</p>}
            </div>

            <div>
              <Label htmlFor="newTier" className="font-body">New Subscription Tier</Label>
              <Controller
                name="newTier"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                    <SelectTrigger className="font-body">
                      <SelectValue placeholder="Select new tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {(["free", "pro", "trialing", "trial_expired"] as SubscriptionTier[]).map(tier => (
                        <SelectItem key={tier} value={tier} className="font-body">
                          {tier.charAt(0).toUpperCase() + tier.slice(1).replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.newTier && <p className="text-sm text-destructive mt-1 font-body">{errors.newTier.message}</p>}
            </div>

            <div>
              <Label htmlFor="newStatus" className="font-body">New Status (Optional)</Label>
              <Input
                id="newStatus"
                {...register("newStatus")}
                placeholder="e.g., active, trialing, canceled"
                className="font-body"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1 font-body">Usually corresponds to Stripe's subscription status.</p>
              {errors.newStatus && <p className="text-sm text-destructive mt-1 font-body">{errors.newStatus.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="newTrialEndsAt" className="font-body">New Trial Ends At (Optional)</Label>
                    <Controller
                        name="newTrialEndsAt"
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
                                disabled={isSubmitting}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date (or leave blank)</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date) => field.onChange(date || null)}
                                initialFocus
                                disabled={isSubmitting}
                            />
                            </PopoverContent>
                        </Popover>
                        )}
                    />
                    <p className="text-xs text-muted-foreground mt-1 font-body">Set to clear or update trial end date.</p>
                    {errors.newTrialEndsAt && <p className="text-sm text-destructive mt-1 font-body">{errors.newTrialEndsAt.message}</p>}
                </div>
                <div>
                    <Label htmlFor="newCurrentPeriodEnd" className="font-body">New Current Period End (Optional)</Label>
                     <Controller
                        name="newCurrentPeriodEnd"
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
                                disabled={isSubmitting}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date (or leave blank)</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date) => field.onChange(date || null)}
                                initialFocus
                                disabled={isSubmitting}
                            />
                            </PopoverContent>
                        </Popover>
                        )}
                    />
                    <p className="text-xs text-muted-foreground mt-1 font-body">Set to update subscription renewal/end date.</p>
                    {errors.newCurrentPeriodEnd && <p className="text-sm text-destructive mt-1 font-body">{errors.newCurrentPeriodEnd.message}</p>}
                </div>
            </div>
            
            <Button type="submit" className="w-full font-body bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Updating...' : 'Update User Subscription'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

    