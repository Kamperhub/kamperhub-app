
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';

const deleteUserSchema = z.object({
  email: z.string().email("A valid user email is required."),
});

const ADMIN_EMAIL = 'info@kamperhub.com';

export async function POST(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error) {
    console.error('API Delete User Error: Firebase Admin SDK not available.', error);
    return NextResponse.json({ error: 'Server configuration error.', details: error.message }, { status: 503 });
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

    const body = await req.json();
    const parsedBody = deleteUserSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }
    
    const { email: targetEmail } = parsedBody.data;

    // Self-deletion safeguard (case-insensitive)
    if (targetEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return NextResponse.json({ error: 'Admin user cannot be deleted.' }, { status: 400 });
    }
    
    let userToDelete;
    try {
      userToDelete = await auth.getUserByEmail(targetEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: `User with email ${targetEmail} not found in Firebase Authentication.` }, { status: 404 });
      }
      throw error; // Re-throw other errors
    }
    
    const userIdToDelete = userToDelete.uid;

    // Delete from Firestore
    const firestoreDocRef = firestore.collection('users').doc(userIdToDelete);
    await firestoreDocRef.delete();
    
    // Delete from Firebase Authentication
    await auth.deleteUser(userIdToDelete);

    return NextResponse.json({ message: `Successfully deleted user ${targetEmail} (UID: ${userIdToDelete}) from Authentication and Firestore.` }, { status: 200 });

  } catch (error: any) {
    console.error('Error in admin delete-user endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
