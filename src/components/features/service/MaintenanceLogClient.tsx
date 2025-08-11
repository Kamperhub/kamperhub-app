// src/components/features/service/MaintenanceLogClient.tsx
"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchMaintenanceTasks } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MaintenanceLogClientProps {
  vehicles: { id: string; name: string }[];
}

export function MaintenanceLogClient({ vehicles }: MaintenanceLogClientProps) {
    const { user } = useAuth();
    const { data: tasks, isLoading, error } = useQuery({
        queryKey: ['maintenanceTasks', user?.uid],
        queryFn: fetchMaintenanceTasks,
        enabled: !!user,
    });

    if (isLoading) {
        return <Skeleton className="h-64 w-full" />;
    }

    if (error) {
        return <p className="text-destructive">Error loading maintenance tasks: {error.message}</p>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Maintenance Log</CardTitle>
                    <Button disabled>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Maintenance Task
                    </Button>
                </div>
                 <CardDescription>
                    This feature is under construction. Soon you will be able to log and track your service history here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Placeholder for where the maintenance tasks will be displayed */}
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
                    Maintenance Task history will appear here.
                </div>
            </CardContent>
        </Card>
    );
}
