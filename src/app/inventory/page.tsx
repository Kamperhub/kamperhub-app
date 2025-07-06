
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getSession } from '@/lib/server-session';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { InventoryPageClient } from '@/components/features/inventory/InventoryPageClient';
import type { UserProfile } from '@/types/auth';
import type { StoredVehicle } from '@/types/vehicle';
import type { StoredCaravan } from '@/types/caravan';
import type { LoggedTrip } from '@/types/tripplanner';

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

async function getInventoryPageData(uid: string) {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) {
        throw new Error("Server configuration error, unable to fetch data.");
    }
    try {
        const [vehiclesSnap, caravansSnap, userSnap, tripsSnap] = await Promise.all([
            firestore.collection('users').doc(uid).collection('vehicles').get(),
            firestore.collection('users').doc(uid).collection('caravans').get(),
            firestore.collection('users').doc(uid).get(),
            firestore.collection('users').doc(uid).collection('trips').get()
        ]);

        const data = {
            userProfile: userSnap.exists() ? userSnap.data() as UserProfile : null,
            caravans: caravansSnap.docs.map(doc => doc.data() as StoredCaravan),
            vehicles: vehiclesSnap.docs.map(doc => doc.data() as StoredVehicle),
            trips: tripsSnap.docs.map(doc => doc.data() as LoggedTrip),
        };
        
        return sanitizeData(data);
    } catch (err: any) {
        console.error('API Error in server-side fetch for inventory page:', err);
        throw new Error(`Failed to fetch inventory page data: ${err.message}`);
    }
}

export default async function InventoryPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    try {
        const data = await getInventoryPageData(session.uid);
        return <InventoryPageClient initialData={data} />;
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
