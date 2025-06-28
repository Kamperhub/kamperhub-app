
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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
  if (!stripeSecretKey || !stripe) {
    console.error('Create Checkout Session: Stripe is not configured because STRIPE_SECRET_KEY is missing at runtime.');
    return NextResponse.json({ error: 'Stripe configuration error on server. Secret key missing.' }, { status: 500 });
  }
  
  if (!proPriceId) {
    console.error('Create Checkout Session: Stripe Pro Price ID is not configured because STRIPE_PRO_PRICE_ID is missing.');
    return NextResponse.json({ error: 'Subscription system is not configured. The STRIPE_PRO_PRICE_ID is missing on the server. Please check the setup checklist.' }, { status: 503 });
  }

  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
      return NextResponse.json({ error: 'Email and userId are required.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      customer_email: email,
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
    console.error('Create Checkout Session: Error in POST handler:', error.message, error.stack);
    const stripeErrorMessage = error.type ? `${error.type}: ${error.message}` : error.message;
    return NextResponse.json({ error: `Internal Server Error creating Stripe session: ${stripeErrorMessage}` }, { status: 500 });
  }
}
