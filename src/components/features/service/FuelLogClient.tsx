// src/components/features/service/FuelLogClient.tsx
"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { fetchFuelLogs } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface FuelLogClientProps {
  vehicles: { id: string; name: string }[];
}

export function FuelLogClient({ vehicles }: FuelLogClientProps) {
    const { user } = useAuth();
    const { data: logs, isLoading, error } = useQuery({
        queryKey: ['fuelLogs', user?.uid],
        queryFn: fetchFuelLogs,
        enabled: !!user,
    });

    if (isLoading) {
        return <Skeleton className="h-64 w-full" />;
    }

    if (error) {
        return <p className="text-destructive">Error loading fuel logs: {error.message}</p>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Fuel Log</CardTitle>
                    <Button disabled>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Fuel Entry
                    </Button>
                </div>
                <CardDescription>
                    This feature is under construction. Soon you will be able to log and track your fuel expenses here.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Placeholder for where the fuel log entries will be displayed */}
                <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
                    Fuel Log Entries will appear here.
                </div>
            </CardContent>
        </Card>
    );
}
