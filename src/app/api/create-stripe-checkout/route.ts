
// src/app/api/create-stripe-checkout/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';

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
      subscription_data: {
        trial_period_days: 3, // Add 3-day trial period
      },
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      // You can pass metadata or a client_reference_id here if you have user authentication
      // client_reference_id: userId, 
      // metadata: { userId: userId }
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

