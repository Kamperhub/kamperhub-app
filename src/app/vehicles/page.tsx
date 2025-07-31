
'use server';
import 'server-only';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/server-session';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import type { UserProfile } from '@/types/auth';
import { VehicleManager } from '@/components/features/vehicles/VehicleManager';
import { CaravanManager } from '@/components/features/vehicles/CaravanManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// This function now includes the critical sanitization step
async function getVehiclePageData() {
  const session = await getSession();
  if (!session) {
    return { vehicles: [], caravans: [], userProfile: null };
  }
  
  const uid = session.uid;
  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    throw new Error("Server configuration error: Firestore not available.");
  }

  const [vehiclesSnapshot, caravansSnapshot, userDocSnap] = await Promise.all([
    firestore.collection('users').doc(uid).collection('vehicles').get(),
    firestore.collection('users').doc(uid).collection('caravans').get(),
    firestore.collection('users').doc(uid).get(),
  ]);

  const vehicles = vehiclesSnapshot.docs.map(doc => doc.data() as StoredVehicle);
  const caravans = caravansSnapshot.docs.map(doc => doc.data() as StoredCaravan);
  const userProfile = userDocSnap.exists ? userDocSnap.data() as UserProfile : null;

  // CRITICAL FIX: Convert Firestore data types (like Timestamps) to plain JSON
  // This is necessary before passing data from a Server Component to a Client Component.
  return JSON.parse(JSON.stringify({ vehicles, caravans, userProfile }));
}

export default async function VehiclesPage() {
  try {
    const { vehicles, caravans, userProfile } = await getVehiclePageData();

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline mb-6 text-primary">Vehicle & Caravan Setup</h1>
          <p className="text-muted-foreground font-body mb-6">
            Manage your tow vehicles and caravans. Set one of each as active for use in trip planning and inventory calculations. Weight Distribution Hitch (WDH) details are now part of the caravan setup.
          </p>
        </div>
        <VehicleManager 
          initialVehicles={vehicles} 
          initialUserPrefs={userProfile}
        />
        <CaravanManager 
          initialCaravans={caravans} 
          initialUserPrefs={userProfile}
        />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Page Data</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }
}
