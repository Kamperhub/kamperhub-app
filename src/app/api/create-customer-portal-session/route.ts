
// src/app/api/create-customer-portal-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });
} else {
  console.error("FATAL: STRIPE_SECRET_KEY is not set for customer portal. Portal will not work.");
}

export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error('Error getting Firebase Admin instances:', adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }

  if (!stripe) {
    console.error('Create Customer Portal Session: Stripe is not configured because STRIPE_SECRET_KEY is missing at runtime.');
    return NextResponse.json({ error: 'Subscription system is not configured on the server. The STRIPE_SECRET_KEY is missing. Please check the setup checklist.' }, { status: 503 });
  }

  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const userDocRef = firestore.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      console.error(`Create Customer Portal Session: User document not found for userId: ${userId}`);
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const userData = userDocSnap.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      console.error(`Create Customer Portal Session: Stripe Customer ID not found for userId: ${userId}`);
      return NextResponse.json({ error: 'Stripe customer ID not found for this user.' }, { status: 400 });
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/my-account`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    if (!portalSession.url) {
        console.error('Create Customer Portal Session: Stripe portal session URL is null after creation.');
        return NextResponse.json({ error: 'Could not create Stripe portal session (URL null).' }, { status: 500 });
    }

    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Create Customer Portal Session: Error in POST handler:', error);
     if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token.' }, { status: 401 });
    }
    const stripeErrorMessage = error.type ? `${error.type}: ${error.message}` : error.message;
    return NextResponse.json({ error: `Internal Server Error creating Stripe portal session: ${stripeErrorMessage}` }, { status: 500 });
  }
}
