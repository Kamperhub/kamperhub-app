
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserCog, ShieldAlert, AlertTriangle, Loader2, Send, Mail, UserX, Trash2, Info, RefreshCw } from 'lucide-react';
import type { SubscriptionTier } from '@/types/auth';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllUsers } from '@/lib/api-client';

const ADMIN_EMAIL = 'info@kamperhub.com';

const updateSubscriptionFormSchema = z.object({
  targetUserEmail: z.string().email("Please enter a valid email address for the target user."),
  newTier: z.enum(["free", "pro", "trialing"], {
    required_error: "New subscription tier is required.",
  }),
});

const deleteUserFormSchema = z.object({
  deleteUserEmail: z.string().email("Please select a valid user email to delete."),
  confirmationText: z.string().refine(val => val === "DELETE", {
    message: "You must type DELETE to confirm.",
  }),
});

type UpdateSubscriptionFormData = z.infer<typeof updateSubscriptionFormSchema>;
type DeleteUserFormData = z.infer<typeof deleteUserFormSchema>;

export default function AdminPage() {
  const { user: currentUser, isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['allUsers', currentUser?.uid],
    queryFn: fetchAllUsers,
    enabled: !!currentUser && currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (email: string) => {
        const idToken = await currentUser!.getIdToken(true);
        const response = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}`},
            body: JSON.stringify({ email }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete user.');
        }
        return result;
    },
    onSuccess: (result) => {
        toast({ title: "User Deleted", description: result.message });
        queryClient.invalidateQueries({ queryKey: ['allUsers', currentUser?.uid] });
        deleteForm.reset();
    },
    onError: (error: Error) => {
        toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
    }
  });


  const updateForm = useForm<UpdateSubscriptionFormData>({
    resolver: zodResolver(updateSubscriptionFormSchema),
    defaultValues: {
      targetUserEmail: '', newTier: 'free',
    },
  });

  const deleteForm = useForm<DeleteUserFormData>({
    resolver: zodResolver(deleteUserFormSchema),
    defaultValues: { deleteUserEmail: '', confirmationText: '' },
  });

  useEffect(() => {
    if (!isAuthLoading && (!currentUser || currentUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())) {
      router.push('/login');
    }
  }, [currentUser, isAuthLoading, router]);

  const onUpdateSubmit: SubmitHandler<UpdateSubscriptionFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const idToken = await currentUser!.getIdToken(true);
      const payload = {
        targetUserEmail: data.targetUserEmail,
        newTier: data.newTier,
      };
      
      const response = await fetch('/api/admin/update-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: result.message || "Subscription updated." });
        updateForm.reset();
      } else {
        toast({ title: "Error Updating Subscription", description: result.error || result.message || "An error occurred.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Client-Side Error", description: error.message || "Failed to send request.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteSubmit: SubmitHandler<DeleteUserFormData> = (data) => {
    deleteUserMutation.mutate(data.deleteUserEmail);
  };
  
  const handleRefreshUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['allUsers', currentUser?.uid] });
    toast({ title: "User List Refreshed" });
  };

  if (isAuthLoading || (currentUser && isLoadingUsers && !allUsers.length && !usersError)) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (!currentUser || currentUser.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-headline text-destructive mb-2">Access Denied</h1>
        <p className="text-lg text-muted-foreground font-body">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-6 font-body">Go to Dashboard</Button>
      </div>
    );
  }
  
  if (usersError) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error loading users</AlertTitle>
                <AlertDescription>{usersError.message}</AlertDescription>
            </Alert>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary flex items-center"><UserCog className="mr-3 h-7 w-7" /> Admin - User Subscription Management</CardTitle>
          <CardDescription className="font-body">Update subscription details for a specific user by their email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6"><AlertTriangle className="h-4 w-4" /><AlertTitle className="font-headline">Important: Admin Action</AlertTitle><AlertDescription className="font-body">Changes made here directly modify user data. Proceed with caution.</AlertDescription></Alert>
          <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="targetUserEmail" className="font-body">Target User Email Address</Label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="targetUserEmail" {...updateForm.register("targetUserEmail")} placeholder="Enter user's email" className="font-body pl-10" disabled={isSubmitting} type="email"/></div>
              {updateForm.formState.errors.targetUserEmail && <p className="text-sm text-destructive mt-1 font-body">{updateForm.formState.errors.targetUserEmail.message}</p>}
            </div>
            <div>
              <Label htmlFor="newTier" className="font-body">New Subscription Tier</Label>
              <Controller name="newTier" control={updateForm.control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}><SelectTrigger className="font-body"><SelectValue placeholder="Select new tier" /></SelectTrigger><SelectContent>{(["free", "pro", "trialing"] as SubscriptionTier[]).map(tier => (<SelectItem key={tier} value={tier} className="font-body">{tier.charAt(0).toUpperCase() + tier.slice(1).replace('_', ' ')}</SelectItem>))}</SelectContent></Select>)} />
              {updateForm.formState.errors.newTier && <p className="text-sm text-destructive mt-1 font-body">{updateForm.formState.errors.newTier.message}</p>}
            </div>
            <Button type="submit" className="w-full font-body bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{isSubmitting ? 'Updating...' : 'Update Subscription'}</Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="max-w-2xl mx-auto shadow-xl border-destructive">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-destructive flex items-center"><UserX className="mr-3 h-7 w-7" /> Admin - Delete User</CardTitle>
          <CardDescription className="font-body">Permanently delete a user from Authentication and Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6"><AlertTriangle className="h-4 w-4" /><AlertTitle className="font-headline">DANGER ZONE</AlertTitle><AlertDescription className="font-body">This action is irreversible. The user and all their data will be permanently deleted.</AlertDescription></Alert>
            
            {!isLoadingUsers && allUsers.length === 0 && (
                <Alert variant="default" className="mb-4 bg-muted/50 border-border">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="font-headline">No Other Users Found</AlertTitle>
                    <AlertDescription className="font-body">
                        The dropdown list is empty because no other user accounts were found in the system. Your own admin account is automatically excluded from this list to prevent accidental self-deletion.
                    </AlertDescription>
                </Alert>
            )}

            <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="deleteUserEmail" className="font-body">User Email to Delete</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshUsers}
                        disabled={isLoadingUsers}
                        className="font-body"
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingUsers && "animate-spin")} />
                        Refresh List
                    </Button>
                </div>
                <Controller
                    name="deleteUserEmail"
                    control={deleteForm.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={deleteUserMutation.isPending || isLoadingUsers}
                      >
                        <SelectTrigger className="font-body pl-10 relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <SelectValue placeholder="Select a user to delete..." />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>Loading users...</SelectItem>
                          ) : allUsers.length > 0 ? (
                            allUsers.map(u => (
                              <SelectItem key={u.uid} value={u.email!}>
                                {u.email}
                              </SelectItem>
                            ))
                          ) : (
                             <SelectItem value="none" disabled>No users available to delete</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                {deleteForm.formState.errors.deleteUserEmail && <p className="text-sm text-destructive mt-1 font-body">{deleteForm.formState.errors.deleteUserEmail.message}</p>}
              </div>
              <div>
                <Label htmlFor="confirmationText" className="font-body">Type "DELETE" to confirm</Label>
                <Input id="confirmationText" {...register("confirmationText")} placeholder='Type DELETE here' disabled={deleteUserMutation.isPending}/>
                {deleteForm.formState.errors.confirmationText && <p className="text-sm text-destructive mt-1 font-body">{deleteForm.formState.errors.confirmationText.message}</p>}
              </div>
              <Button type="submit" variant="destructive" className="w-full font-body" disabled={deleteUserMutation.isPending || allUsers.length === 0}>
                {deleteUserMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                {deleteUserMutation.isPending ? 'Deleting User...' : 'Delete User Permanently'}
              </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}

