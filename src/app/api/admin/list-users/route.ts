
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const ADMIN_EMAIL = 'info@kamperhub.com';

export async function GET(req: NextRequest) {
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
    
    // Check if the caller is the specific admin user (case-insensitive)
    if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }
    
    // --- CHANGE: Fetch users from Firestore collection instead of Auth ---
    const usersSnapshot = await firestore.collection('users').get();
    const users = usersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          uid: data.uid || doc.id, // Prefer UID field, fallback to doc ID
          email: data.email,
        };
      })
      .filter(user => user.email && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()); // Filter out admin (case-insensitive) and users without email

    return NextResponse.json(users, { status: 200 });

  } catch (error: any) {
    console.error('Error in admin list-users endpoint:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
