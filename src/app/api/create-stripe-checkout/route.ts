
// src/app/api/create-stripe-checkout/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
// In a real app with user authentication:
// import { admin } from '@/lib/firebase-admin'; // Assuming Firebase Admin SDK for user token verification
// import { getAuth } from 'firebase-admin/auth';

// Initialize Stripe with your secret key
// Ensure your Stripe secret key is set in your environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("Stripe secret key is not configured.");
  // We'll let requests fail downstream if the key is missing, 
  // as throwing an error here would break server startup.
}
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2024-06-20',
});

const STRIPE_DEFAULT_PRICE_ID = process.env.STRIPE_PRICE_ID; // For the 'pro' tier for now
const APP_URL = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_APP_URL || 'https://your-production-app-url.com')
    : 'http://localhost:9002';

const SUCCESS_URL = `${APP_URL}/subscribe?success=true&session_id={CHECKOUT_SESSION_ID}`;
const CANCEL_URL = `${APP_URL}/subscribe?canceled=true`;


export async function POST(req: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
  }
  if (!STRIPE_DEFAULT_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe Price ID for the default tier is not configured.' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => ({})); // Allow empty body for now
    const priceId = body.priceId || STRIPE_DEFAULT_PRICE_ID; // Allow client to specify priceId for tiers in future

    // TODO: In a real application with user authentication:
    // 1. Verify the user's authentication token (e.g., Firebase ID token).
    // const authorization = req.headers.get('Authorization');
    // if (!authorization?.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    // }
    // const idToken = authorization.split('Bearer ')[1];
    // let decodedToken;
    // try {
    //   decodedToken = await getAuth(admin.app()).verifyIdToken(idToken);
    // } catch (error) {
    //   return NextResponse.json({ error: 'Unauthorized: Invalid token.' }, { status: 401 });
    // }
    // const userId = decodedToken.uid;
    // const userEmail = decodedToken.email;

    // 2. Check if the user is already a Stripe customer.
    //    If not, create a new Stripe customer.
    //    (This requires a database to store mapping between your user ID and Stripe Customer ID)
    // let stripeCustomerId = "cus_YOUR_EXISTING_CUSTOMER_ID"; // Fetch from your DB
    // if (!stripeCustomerId) {
    //   const customer = await stripe.customers.create({
    //     email: userEmail, 
    //     // metadata: { userId: userId }
    //   });
    //   stripeCustomerId = customer.id;
    //   // Save stripeCustomerId to your database, associated with userId
    // }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, 
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      // customer: stripeCustomerId, // Use existing or newly created Stripe customer ID
      // client_reference_id: userId, // Link Stripe session to your internal user ID
      // metadata: { userId: userId }
    };
    
    // If you want to allow users to update their subscription (e.g., change card)
    // you might use a billing portal session instead for existing subscribers:
    // if (isSubscribed) { // isSubscribed would be fetched from your DB for the user
    //   const portalSession = await stripe.billingPortal.sessions.create({
    //     customer: stripeCustomerId,
    //     return_url: `${APP_URL}/my-account`,
    //   });
    //   return NextResponse.json({ url: portalSession.url });
    // }


    const session = await stripe.checkout.sessions.create(sessionParams);

    if (session.url) {
      return NextResponse.json({ sessionId: session.id, url: session.url });
    } else {
      return NextResponse.json({ error: 'Could not create Stripe session.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred with Stripe.' }, { status: 500 });
  }
}
