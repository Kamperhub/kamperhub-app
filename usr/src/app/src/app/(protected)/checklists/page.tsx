// src/app/(protected)/checklists/page.tsx
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
    console.log('[ChecklistsPage] No user session found. Returning empty trips array.');
    return [];
  }
  const uid = session.uid;
  
  const { firestore, error } = getFirebaseAdmin();
  if (error || !firestore) {
    console.error('[ChecklistsPage] Firebase Admin SDK error:', error);
    throw new Error('Server configuration error, database not available.');
  }

  try {
    const tripsSnapshot = await firestore.collection('users').doc(uid).collection('trips').get();
    if (tripsSnapshot.empty) {
      return [];
    }
    // IMPORTANT: Sanitize Firestore data before passing to the client component.
    const trips = tripsSnapshot.docs.map(doc => doc.data() as LoggedTrip);
    return JSON.parse(JSON.stringify(trips));
  } catch (err: any) {
      console.error(`[ChecklistsPage] Error fetching trips for user ${uid}:`, err);
      // Re-throw to be caught by the page's error boundary
      throw new Error(`Failed to fetch trip data: ${err.message}`);
  }
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
