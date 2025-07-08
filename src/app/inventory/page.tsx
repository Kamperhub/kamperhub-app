
"use client";

import { useQuery } from '@tanstack/react-query';
import { InventoryPageClient } from '@/components/features/inventory/InventoryPageClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchAllVehicleData } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export default function InventoryPage() {
    const { user, isAuthLoading } = useAuth();
    
    const { data, isLoading, error } = useQuery({
        queryKey: ['allVehicleData', user?.uid],
        queryFn: fetchAllVehicleData,
        enabled: !!user,
    });

    const isLoadingPage = isAuthLoading || isLoading;

    if (isLoadingPage) {
        return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
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

    const inventoryPageData = {
        userProfile: data?.userProfile || null,
        caravans: data?.caravans || [],
        vehicles: data?.vehicles || [],
        trips: data?.trips || [],
    };

    return <InventoryPageClient initialData={inventoryPageData} />;
}
