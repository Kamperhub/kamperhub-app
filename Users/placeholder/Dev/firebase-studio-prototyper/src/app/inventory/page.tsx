
"use client";

import { useQuery } from '@tanstack/react-query';
import { InventoryPageClient } from '@/components/features/inventory/InventoryPageClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchVehiclePageData, fetchTrips } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export default function InventoryPage() {
    const { user, isAuthLoading } = useAuth();
    
    // Reverted to two separate, stable queries instead of the single faulty one.
    const { data: vehiclePageData, isLoading: isLoadingVehicleData, error: vehicleError } = useQuery({
        queryKey: ['vehiclePageData', user?.uid],
        queryFn: fetchVehiclePageData,
        enabled: !!user,
    });

    const { data: trips = [], isLoading: isLoadingTrips, error: tripsError } = useQuery({
        queryKey: ['trips', user?.uid],
        queryFn: fetchTrips,
        enabled: !!user,
    });

    const isLoading = isAuthLoading || isLoadingVehicleData || isLoadingTrips;
    const error = vehicleError || tripsError;

    if (isLoading) {
        return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
    }

    if (error) {
        return (
             <div className="container mx-auto py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Page Data</AlertTitle>
                    <AlertDescription>{(error as Error).message}</AlertDescription>
                </Alert>
            </div>
        )
    }

    // Combine the data from the two queries into the single structure the client component expects.
    const inventoryPageData = {
        userProfile: vehiclePageData?.userProfile || null,
        caravans: vehiclePageData?.caravans || [],
        vehicles: vehiclePageData?.vehicles || [],
        trips: trips || [],
    };

    return <InventoryPageClient initialData={inventoryPageData} />;
}
