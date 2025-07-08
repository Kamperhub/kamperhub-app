
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

// Helper function to ensure Timestamps are JSON-serializable
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

async function getVehiclesPageData(uid: string) {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) {
        throw new Error("Server configuration error, unable to fetch data.");
    }

    try {
        const [vehiclesSnap, caravansSnap, userSnap] = await Promise.all([
            firestore.collection('users').doc(uid).collection('vehicles').get(),
            firestore.collection('users').doc(uid).collection('caravans').get(),
            firestore.collection('users').doc(uid).get()
        ]);

        const data = {
            vehicles: vehiclesSnap.docs.map(doc => doc.data() as StoredVehicle),
            caravans: caravansSnap.docs.map(doc => doc.data() as StoredCaravan),
            userProfile: userSnap.exists ? userSnap.data() as UserProfile : null
        };
        
        // Sanitize the data to make it safe to pass from Server to Client Component
        return sanitizeData(data);

    } catch (err: any) {
        console.error('API Error in server-side fetch for vehicles page:', err);
        // Throw a more specific error to be caught by the page's error boundary
        throw new Error(`Failed to fetch vehicles page data: ${err.message}`);
    }
}


export default async function VehiclesPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    try {
        const data = await getVehiclesPageData(session.uid);

        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-headline mb-6 text-primary">Vehicle & Caravan Setup</h1>
                    <p className="text-muted-foreground font-body mb-6">
                    Manage your tow vehicles and caravans. Set one of each as active for use in trip planning and inventory calculations. Weight Distribution Hitch (WDH) details are now part of the caravan setup.
                    </p>
                </div>
                <VehicleManager 
                    initialVehicles={data.vehicles} 
                    initialUserPrefs={data.userProfile}
                />
                <CaravanManager 
                    initialCaravans={data.caravans} 
                    initialUserPrefs={data.userProfile}
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
