
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getSession } from '@/lib/server-session';
import { redirect } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { LoggedTrip } from '@/types/tripplanner';
import { ChecklistsPageClient } from '@/components/features/checklists/ChecklistsPageClient';

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

async function getTrips(uid: string): Promise<LoggedTrip[]> {
    const { firestore, error } = getFirebaseAdmin();
    if (error || !firestore) {
        throw new Error("Server configuration error, unable to fetch data.");
    }
    const tripsSnapshot = await firestore.collection('users').doc(uid).collection('trips').get();
    return tripsSnapshot.docs.map(doc => doc.data() as LoggedTrip);
}

export default async function ChecklistsPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    try {
        const trips = await getTrips(session.uid);
        return <ChecklistsPageClient initialTrips={sanitizeData(trips)} />;
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
