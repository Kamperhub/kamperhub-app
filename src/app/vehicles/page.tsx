
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getSession } from '@/lib/server-session';
import { redirect } from 'next/navigation';
import { VehicleManager } from '@/components/features/vehicles/VehicleManager';
import { CaravanManager } from '@/components/features/vehicles/CaravanManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { UserProfile } from '@/types/auth';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';

// This helper is needed to convert Firestore Timestamps to strings
const firestoreTimestampReplacer = (key: any, value: any) => {
    if (value && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
    }
    return value;
};

const sanitizeData = (data: any) => {
    try {
        const jsonString = JSON.stringify(data, firestoreTimestampReplacer);
        return JSON.parse(jsonString);
    } catch (error: any) {
        console.error('Error in sanitizeData:', error);
        throw new Error(`Failed to serialize data: ${error.message}`);
    }
};

async function getAllVehicleData(uid: string) {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) {
        console.error("Server-side fetch failed: Firebase Admin not initialized.", error?.message);
        throw new Error("Server configuration error, unable to fetch data.");
    }

    try {
        const [vehiclesSnapshot, caravansSnapshot, userDocSnap] = await Promise.all([
            firestore.collection('users').doc(uid).collection('vehicles').get(),
            firestore.collection('users').doc(uid).collection('caravans').get(),
            firestore.collection('users').doc(uid).get()
        ]);

        const vehicles = vehiclesSnapshot.docs.map(doc => doc.data() as StoredVehicle);
        const caravans = caravansSnapshot.docs.map(doc => doc.data() as StoredCaravan);
        const userProfile = userDocSnap.exists() ? userDocSnap.data() as UserProfile : null;

        const data = {
            vehicles,
            caravans,
            userProfile,
        };
        
        // Sanitize the data to make it serializable for client components
        return sanitizeData(data);
    } catch (err: any) {
        console.error('API Error in server-side fetch for vehicles page:', err);
        throw new Error(`Failed to fetch vehicle data: ${err.message}`);
    }
}


export default async function VehiclesPage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    try {
        const data = await getAllVehicleData(session.uid);

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
    } catch (error: any) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Vehicle Data</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }
}
