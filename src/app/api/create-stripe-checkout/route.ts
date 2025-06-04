
// src/app/api/create-stripe-checkout/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
// import { auth as adminAuth } from 'firebase-admin'; // For verifying user token if needed
// import { getAuth } from 'firebase/auth'; // For getting client-side user (not here)

// Initialize Stripe with your secret key
// Ensure your Stripe secret key is set in your environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Use the latest API version
});

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const APP_URL = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_APP_URL || 'https://your-production-app-url.com') // Replace with your actual production URL
    : 'http://localhost:9002'; // Your local dev URL

const SUCCESS_URL = process.env.STRIPE_CHECKOUT_SUCCESS_URL || `${APP_URL}/subscribe?success=true`;
const CANCEL_URL = process.env.STRIPE_CHECKOUT_CANCEL_URL || `${APP_URL}/subscribe?canceled=true`;


export async function POST(req: NextRequest) {
  if (!STRIPE_PRICE_ID) {
    return NextResponse.json({ error: 'Stripe Price ID is not configured.' }, { status: 500 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe Secret Key is not configured.' }, { status: 500 });
  }

  // TODO: In a real application with user authentication:
  // 1. Get the authenticated user's ID (e.g., from a Firebase Auth token).
  // 2. Pass this ID as `client_reference_id` to Stripe.
  // 3. Store the Stripe customer ID associated with your user in your database.
  // const { userId } = await req.json(); // Example: if you send userId from client
  // if (!userId) {
  //   return NextResponse.json({ error: 'User ID is missing.' }, { status: 400 });
  // }


  try {
    // Create a new Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID, 
          quantity: 1,
        },
      ],
      mode: 'subscription', 
      // Removed trial_period_days
      // subscription_data: {
        // You might also want to pass metadata specific to the subscription
        // metadata: { userId: userId } 
      // },
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      // client_reference_id: userId, // Important for linking Stripe customer to your user
      // metadata: { userId: userId } // General metadata for the session
    });

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
