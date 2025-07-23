
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
    
    // This now uses the single, consolidated data fetcher.
    const { data: pageData, isLoading: isLoadingData, error } = useQuery({
        queryKey: ['allVehicleData', user?.uid],
        queryFn: fetchAllVehicleData,
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const isLoading = isAuthLoading || isLoadingData;

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

    return <InventoryPageClient initialData={pageData} />;
}
