
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const ADMIN_EMAIL = 'info@kamperhub.com';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('Error getting Firebase Admin instances:', adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }
  
  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];

    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }
    
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
    console.error('Error in admin list-users endpoint:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
