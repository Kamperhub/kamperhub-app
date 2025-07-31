
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import type admin from 'firebase-admin';

const ADMIN_EMAIL = 'info@kamperhub.com';

async function verifyAdminAndGetInstances(req: NextRequest): Promise<{ auth: admin.auth.Auth; firestore: admin.firestore.Firestore; }> {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    throw new Error("Server configuration error: Auth or Firestore not initialized.");
  }

  const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) throw new Error("Unauthorized: Missing token.");

  const decodedToken = await auth.verifyIdToken(idToken);
  if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Forbidden: You do not have permission to perform this action.');
  }
  return { auth, firestore };
}

const handleApiError = (error: any): NextResponse => {
  console.error('API Error in admin/list-users route:', error);
  if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
    return NextResponse.json({ error: 'Forbidden', details: error.message }, { status: 403 });
  }
  if (error.message.includes('Server configuration error')) {
    return NextResponse.json({ error: 'Server configuration error', details: error.message }, { status: 503 });
  }
  return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { auth, firestore } = await verifyAdminAndGetInstances(req);
    
    const listUsersResult = await auth.listUsers(1000);
    const nonAdminUsers = listUsersResult.users.filter(userRecord => userRecord.email && userRecord.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase());

    const usersWithTripCounts = await Promise.all(
      nonAdminUsers.map(async (userRecord) => {
        try {
          const tripsSnapshot = await firestore.collection('users').doc(userRecord.uid).collection('trips').get();
          return {
            uid: userRecord.uid,
            email: userRecord.email,
            tripCount: tripsSnapshot.size,
          };
        } catch (e) {
          console.warn(`Could not fetch trip count for user ${userRecord.uid}`, e);
          return {
            uid: userRecord.uid,
            email: userRecord.email,
            tripCount: 'Error',
          };
        }
      })
    );
    
    return NextResponse.json(usersWithTripCounts, { status: 200 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
