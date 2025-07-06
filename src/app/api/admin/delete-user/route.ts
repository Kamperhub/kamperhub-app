
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z } from 'zod';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });
} else {
  console.error("Stripe secret key is not configured for user deletion.");
}


const deleteUserSchema = z.object({
  email: z.string().email("A valid user email is required."),
});

const ADMIN_EMAIL = 'info@kamperhub.com';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsedBody = deleteUserSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }
    
    const { email: targetEmail } = parsedBody.data;

    if (targetEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return NextResponse.json({ error: 'Admin user cannot be deleted.' }, { status: 400 });
    }

    const usersQuery = firestore.collection('users').where('email', '==', targetEmail).limit(1);
    const userQuerySnapshot = await usersQuery.get();

    if (userQuerySnapshot.empty) {
        return NextResponse.json({ error: `User with email ${targetEmail} not found in Firestore database.` }, { status: 404 });
    }
    
    const userDoc = userQuerySnapshot.docs[0];
    const userData = userDoc.data();
    const userIdToDelete = userDoc.id;
    const stripeSubscriptionId = userData?.stripeSubscriptionId;

    let stripeMessage = '';
    // --- NEW: Cancel Stripe Subscription ---
    if (stripeSubscriptionId && stripe) {
      try {
        await stripe.subscriptions.cancel(stripeSubscriptionId);
        stripeMessage = `Stripe subscription ${stripeSubscriptionId} was successfully canceled.`;
        console.log(`[Admin Delete] ${stripeMessage}`);
      } catch (stripeError: any) {
        // Don't block deletion if Stripe fails (e.g., sub already canceled)
        stripeMessage = `Warning: Could not cancel Stripe subscription ${stripeSubscriptionId}. It may have already been canceled. Error: ${stripeError.message}`;
        console.warn(`[Admin Delete] ${stripeMessage}`);
      }
    }
    // --- END NEW ---

    await userDoc.ref.delete();
    
    try {
      await auth.deleteUser(userIdToDelete);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`Info: User with UID ${userIdToDelete} was not found in Firebase Auth (already deleted or orphaned), but their Firestore data has been removed.`);
      } else {
        console.error(`Error deleting user ${userIdToDelete} from Firebase Auth:`, authError);
        const finalMessage = `Successfully deleted Firestore data for ${targetEmail}. However, an error occurred while removing them from Authentication: ${authError.message}. ${stripeMessage}`;
        return NextResponse.json({ message: finalMessage }, { status: 207 }); // 207 Multi-Status
      }
    }

    const successMessage = `Successfully deleted user ${targetEmail} from Firestore and Auth. ${stripeMessage}`;
    return NextResponse.json({ message: successMessage }, { status: 200 });

  } catch (error: any) {
    console.error('Error in admin delete-user endpoint:', error);
    let errorTitle = 'Internal Server Error';
    let errorDetails = error.message;

    if (error.code === 16 || (error.message && error.message.toLowerCase().includes('unauthenticated'))) {
      errorTitle = `16 UNAUTHENTICATED: Server not authorized`;
      errorDetails = `The server's credentials (GOOGLE_APPLICATION_CREDENTIALS_JSON) are invalid or lack IAM permissions. Please follow the setup checklist to verify your service account role and Firestore rules, then restart the server. Original Error: ${error.message}`;
    } else if (error.code === 5 || (error.message && error.message.toLowerCase().includes('not_found'))) {
      errorTitle = `DATABASE NOT FOUND`;
      errorDetails = `The server could not find the Firestore database 'kamperhubv2'. Please verify it has been created in your Firebase project. Original Error: ${error.message}`;
    }
    
    return NextResponse.json({ error: errorTitle, details: errorDetails }, { status: 500 });
  }
}
