
// src/app/api/create-customer-portal-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminFirestore } from '@/lib/firebase-admin'; // Import Firebase Admin initialized Firestore

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
  if (!stripe) {
    console.error('Create Customer Portal Session: Stripe is not configured or STRIPE_SECRET_KEY is missing.');
    return NextResponse.json({ error: 'Stripe configuration error on server.' }, { status: 500 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      console.error('Create Customer Portal Session: userId missing in request body.');
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Fetch the user's Stripe Customer ID from Firestore
    const userDocRef = adminFirestore.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists()) {
      console.error(`Create Customer Portal Session: User document not found for userId: ${userId}`);
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const userData = userDocSnap.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      console.error(`Create Customer Portal Session: Stripe Customer ID not found for userId: ${userId}`);
      return NextResponse.json({ error: 'Stripe customer ID not found for this user.' }, { status: 400 });
    }
    
    console.log(`Create Customer Portal Session: Found Stripe Customer ID ${stripeCustomerId} for user ${userId}`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${appUrl}/my-account`; // Where Stripe redirects after portal session

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    if (!portalSession.url) {
        console.error('Create Customer Portal Session: Stripe portal session URL is null after creation.');
        return NextResponse.json({ error: 'Could not create Stripe portal session (URL null).' }, { status: 500 });
    }

    console.log('Create Customer Portal Session: Stripe Portal Session URL:', portalSession.url);
    return NextResponse.json({ url: portalSession.url });

  } catch (error: any) {
    console.error('Create Customer Portal Session: Error in POST handler:', error.message, error.stack);
    const stripeErrorMessage = error.type ? `${error.type}: ${error.message}` : error.message;
    return NextResponse.json({ error: `Internal Server Error creating Stripe portal session: ${stripeErrorMessage}` }, { status: 500 });
  }
}
