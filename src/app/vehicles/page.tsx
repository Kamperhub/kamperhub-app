
import { getSession } from '@/lib/server-session';
import { getVehicles, getCaravans, getUserPreferences } from '@/lib/server-data-fetcher';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeletons for dynamic loading. These are shown while the component's JS is loaded.
const VehicleManagerLoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-9 w-[180px]" />
      </div>
      <Skeleton className="h-4 w-2/3 mt-1" />
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
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-9 w-[190px]" />
      </div>
      <Skeleton className="h-4 w-2/3 mt-1" />
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
    ssr: false, // This is a client component
    loading: () => <VehicleManagerLoadingSkeleton />
  }
);

const CaravanManager = dynamic(
  () => import('@/components/features/vehicles/CaravanManager').then(mod => mod.CaravanManager),
  { 
    ssr: false, // This is a client component
    loading: () => <CaravanManagerLoadingSkeleton />
  }
);

// This is now an async Server Component
export default async function VehiclesPage() {
  const session = await getSession();

  // Redirect to login if no valid server-side session is found.
  if (!session) {
    redirect('/login');
  }

  // Fetch all necessary data on the server in parallel.
  const [vehicles, caravans, userPrefs] = await Promise.all([
    getVehicles(session.uid),
    getCaravans(session.uid),
    getUserPreferences(session.uid),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Vehicle & Caravan Setup</h1>
        <p className="text-muted-foreground font-body mb-6">
          Manage your tow vehicles and caravans. Set one of each as active for use in trip planning and inventory calculations. Weight Distribution Hitch (WDH) details are now part of the caravan setup.
        </p>
      </div>
      <VehicleManager initialVehicles={vehicles} initialUserPrefs={userPrefs} />
      <CaravanManager initialCaravans={caravans} initialUserPrefs={userPrefs} />
    </div>
  );
}
