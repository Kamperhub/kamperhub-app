
"use client";

import { useQuery } from '@tanstack/react-query';
import { VehicleManager } from '@/components/features/vehicles/VehicleManager';
import { CaravanManager } from '@/components/features/vehicles/CaravanManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchVehiclePageData } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function VehiclesPage() {
    const { user, isAuthLoading } = useAuth();
    
    const { data, isLoading, error } = useQuery({
        queryKey: ['vehiclePageData', user?.uid],
        queryFn: fetchVehiclePageData,
        enabled: !!user,
    });

    const isLoadingPage = isAuthLoading || isLoading;

    if (isLoadingPage) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-1/3 mb-4"/>
                    <Skeleton className="h-4 w-2/3"/>
                </div>
                <Card><CardHeader><Skeleton className="h-6 w-1/4"/></CardHeader><CardContent><Skeleton className="h-24 w-full"/></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-1/4"/></CardHeader><CardContent><Skeleton className="h-24 w-full"/></CardContent></Card>
            </div>
        );
    }

    if (error) {
        return (
             <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Page Data</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
            </div>
        )
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
