
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });
} else {
  console.error("FATAL: STRIPE_SECRET_KEY is not set in the environment variables. Stripe Checkout will not work.");
}

const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('Create Checkout Session: Firebase Admin SDK failed to initialize.', adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 500 });
  }
  
  if (!stripeSecretKey || !stripe) {
    console.error('Create Checkout Session: Stripe is not configured because STRIPE_SECRET_KEY is missing at runtime.');
    return NextResponse.json({ error: 'Stripe configuration error on server. Secret key missing.' }, { status: 500 });
  }
  
  if (!proPriceId) {
    console.error('Create Checkout Session: Stripe Pro Price ID is not configured because STRIPE_PRO_PRICE_ID is missing.');
    return NextResponse.json({ error: 'Subscription system is not configured. The STRIPE_PRO_PRICE_ID is missing on the server. Please check the setup checklist.' }, { status: 503 });
  }

  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    const userProfileDoc = await firestore.collection('users').doc(userId).get();

    if (!userProfileDoc.exists) {
      return NextResponse.json({ error: 'User profile not found. Cannot create Stripe customer.' }, { status: 404 });
    }
    const userProfileData = userProfileDoc.data() as UserProfile;
    let stripeCustomerId = userProfileData.stripeCustomerId;

    if (!stripeCustomerId) {
      const fullName = [userProfileData.firstName, userProfileData.lastName].filter(Boolean).join(' ').trim();
      const customerName = userProfileData.displayName || fullName || userProfileData.email; // Fallback to email if all else fails

      const customer = await stripe.customers.create({
        email: userProfileData.email!,
        name: customerName,
        metadata: { userId: userId }
      });
      stripeCustomerId = customer.id;
      await userProfileDoc.ref.update({ stripeCustomerId });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8083';

    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
      success_url: `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscribe/cancel`,
    };

    const session = await stripe.checkout.sessions.create(checkoutSessionParams);

    if (!session.url) {
      console.error('Create Checkout Session: Stripe session URL is null after creation.');
      return NextResponse.json({ error: 'Could not create Stripe session (URL null).' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Create Checkout Session: Error in POST handler:', error);
    
    let errorTitle = 'Internal Server Error';
    let errorDetails = error.message;

    if (error.code === 16 || (error.message && error.message.toLowerCase().includes('unauthenticated'))) {
      errorTitle = `16 UNAUTHENTICATED: Server not authorized`;
      errorDetails = `The server's credentials (GOOGLE_APPLICATION_CREDENTIALS_JSON) are invalid or lack IAM permissions. Please follow the setup checklist to verify your service account role and Firestore rules, then restart the server. Original Error: ${error.message}`;
    } else if (error.code === 5 || (error.message && error.message.toLowerCase().includes('not_found'))) {
      errorTitle = `DATABASE NOT FOUND`;
      errorDetails = `The server could not find the Firestore database 'kamperhubv2'. Please verify it has been created in your Firebase project. Original Error: ${error.message}`;
    } else if (error.type) { // Stripe-specific error
        errorTitle = `Stripe Error: ${error.type}`;
        errorDetails = error.message;
    }
    
    return NextResponse.json({ error: errorTitle, details: errorDetails }, { status: 500 });
  }
}
