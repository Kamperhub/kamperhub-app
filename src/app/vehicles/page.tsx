
"use client";

import { useQuery } from '@tanstack/react-query';
import { fetchAllVehicleData } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { VehicleManager } from '@/components/features/vehicles/VehicleManager';
import { CaravanManager } from '@/components/features/vehicles/CaravanManager';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const PageSkeleton = () => (
    <div className="space-y-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    </div>
);

export default function VehiclesPage() {
    const { user, isAuthLoading } = useAuth();
    
    const { data, isLoading, error } = useQuery({
        queryKey: ['allVehicleData', user?.uid],
        queryFn: fetchAllVehicleData,
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const isPageLoading = isLoading || isAuthLoading;

    if (isPageLoading) {
        return <PageSkeleton />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Vehicle Data</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-headline mb-6 text-primary">Vehicle & Caravan Setup</h1>
                <p className="text-muted-foreground font-body mb-6">
                    Manage your tow vehicles and caravans. Set one of each as active for use in trip planning and inventory calculations. Weight Distribution Hitch (WDH) details are now part of the caravan setup.
                </p>
            </div>
            <VehicleManager 
                initialVehicles={data?.vehicles || []} 
                initialUserPrefs={data?.userProfile || null}
            />
            <CaravanManager 
                initialCaravans={data?.caravans || []} 
                initialUserPrefs={data?.userProfile || null}
            />
        </div>
    );
}
