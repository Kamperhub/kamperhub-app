
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { z, ZodError } from 'zod';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-05-28',
  });
} else {
  console.error("Stripe secret key is not configured for user deletion.");
}


const deleteUserSchema = z.object({
  email: z.string().email("A valid user email is required."),
});

const ADMIN_EMAIL = 'info@kamperhub.com';

async function verifyUserAndGetInstances(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error || !auth || !firestore) {
    throw new Error('Server configuration error.');
  }
  const idToken = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) throw new Error('Unauthorized: Missing token.');

  const decodedToken = await auth.verifyIdToken(idToken);
  if (decodedToken.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Forbidden: You do not have permission to perform this action.');
  }
  return { auth, firestore };
}

const handleApiError = (error: any): NextResponse => {
    console.error('API Error in admin/delete-user route:', error);
    if (error instanceof ZodError) {
        return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
    }
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden', details: error.message }, { status: 403 });
    }
    if (error.message.includes('Server configuration error')) {
        return NextResponse.json({ error: 'Server configuration error', details: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
};


export async function POST(req: NextRequest) {
  try {
    const { auth, firestore } = await verifyUserAndGetInstances(req);

    const body = await req.json();
    const parsedBody = deleteUserSchema.safeParse(body);

    if (!parsedBody.success) {
      throw new ZodError(parsedBody.error.issues);
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
    const stripeCustomerId = userData?.stripeCustomerId;

    let stripeMessage = '';
    if (stripeCustomerId && stripe) {
      try {
        await stripe.customers.del(stripeCustomerId);
        stripeMessage = `Stripe customer ${stripeCustomerId} and all associated subscriptions were successfully deleted.`;
        console.log(`[Admin Delete] ${stripeMessage}`);
      } catch (stripeError: any) {
        stripeMessage = `Warning: Could not delete Stripe customer ${stripeCustomerId}. Error: ${stripeError.message}`;
        console.warn(`[Admin Delete] ${stripeMessage}`);
      }
    }

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
    return handleApiError(error);
  }
}
