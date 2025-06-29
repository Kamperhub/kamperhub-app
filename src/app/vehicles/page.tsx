"use client"; // Keep client directive if page itself needs client-side hooks, or remove if only components are client-side

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // For skeleton styling

const VehicleManagerLoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/3" /> {/* Title */}
        <Skeleton className="h-9 w-[180px]" /> {/* Add button */}
      </div>
      <Skeleton className="h-4 w-2/3 mt-1" /> {/* Description */}
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </CardContent>
  </Card>
);

const CaravanManagerLoadingSkeleton = () => (
 <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/3" /> {/* Title */}
        <Skeleton className="h-9 w-[190px]" /> {/* Add button */}
      </div>
      <Skeleton className="h-4 w-2/3 mt-1" /> {/* Description */}
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </CardContent>
  </Card>
);

const VehicleManager = dynamic(
  () => import('@/components/features/vehicles/VehicleManager').then(mod => mod.VehicleManager),
  { 
    ssr: false,
    loading: () => <VehicleManagerLoadingSkeleton />
  }
);

const CaravanManager = dynamic(
  () => import('@/components/features/vehicles/CaravanManager').then(mod => mod.CaravanManager),
  { 
    ssr: false,
    loading: () => <CaravanManagerLoadingSkeleton />
  }
);

export default function VehiclesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Vehicle & Caravan Setup</h1>
        <p className="text-muted-foreground font-body mb-6">
          Manage your tow vehicles and caravans. Set one of each as active for use in trip planning and inventory calculations. Weight Distribution Hitch (WDH) details are now part of the caravan setup.
        </p>
      </div>
      <VehicleManager />
      <CaravanManager />
    </div>
  );
}
