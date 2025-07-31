
'use server';
import 'server-only';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import { getSession } from '@/lib/server-session';
import type { LoggedTrip } from '@/types/tripplanner';
import { ChecklistsPageClient } from '@/components/features/checklists/ChecklistsPageClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function getTripsForChecklists(): Promise<LoggedTrip[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }
  const uid = session.uid;
  const { firestore } = getFirebaseAdmin();
  if (!firestore) {
    throw new Error('Server configuration error, database not available.');
  }

  const tripsSnapshot = await firestore.collection('users').doc(uid).collection('trips').get();
  if (tripsSnapshot.empty) {
    return [];
  }
  return tripsSnapshot.docs.map(doc => doc.data() as LoggedTrip);
}


export default async function ChecklistsPage() {
  try {
    const trips = await getTripsForChecklists();
    return <ChecklistsPageClient serverTrips={trips} />;
  } catch (error: any) {
    return (
       <div className="container mx-auto py-8">
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Trip Data</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
          </Alert>
      </div>
    )
  }
}
