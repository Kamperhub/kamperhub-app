
import { NextRequest, NextResponse } from 'next/server';
import { auth, firestore } from '@/lib/firebase-admin';
import { z } from 'zod';

const deleteUserSchema = z.object({
  email: z.string().email("A valid user email is required."),
});

const ADMIN_EMAIL = 'info@kamperhub.com';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsedBody = deleteUserSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }
    
    const { email: targetEmail } = parsedBody.data;

    if (targetEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return NextResponse.json({ error: 'Admin user cannot be deleted.' }, { status: 400 });
    }

    // --- CHANGE: Fetch all users and filter in-memory to avoid needing an index ---
    const usersRef = firestore.collection('users');
    const allUsersSnapshot = await usersRef.get();
    
    const userDoc = allUsersSnapshot.docs.find(doc => doc.data().email === targetEmail);

    if (!userDoc) {
        return NextResponse.json({ error: `User with email ${targetEmail} not found in Firestore database.` }, { status: 404 });
    }

    const userIdToDelete = userDoc.id; // The document ID is the UID

    // 1. Delete from Firestore (ensures data is gone even if Auth fails)
    await userDoc.ref.delete();
    
    // 2. Attempt to delete from Firebase Authentication, but don't fail if they don't exist
    try {
      await auth.deleteUser(userIdToDelete);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        // This is expected for orphaned records, log it but don't treat it as an error.
        console.log(`Info: User with UID ${userIdToDelete} was not found in Firebase Auth (already deleted or orphaned), but their Firestore data has been removed.`);
      } else {
        // For other auth errors, we should report them.
        console.error(`Error deleting user ${userIdToDelete} from Firebase Auth:`, authError);
        // We don't re-throw here because the primary goal (deleting Firestore data) succeeded.
        // We can return a partial success message.
        return NextResponse.json({ message: `Successfully deleted Firestore data for ${targetEmail}. However, an error occurred while removing them from Authentication: ${authError.message}` }, { status: 207 }); // 207 Multi-Status
      }
    }

    return NextResponse.json({ message: `Successfully deleted user ${targetEmail} (UID: ${userIdToDelete}) from Firestore and Authentication (if they existed there).` }, { status: 200 });

  } catch (error: any) {
    console.error('Error in admin delete-user endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
