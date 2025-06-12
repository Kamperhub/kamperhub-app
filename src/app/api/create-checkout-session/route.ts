
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// This line will cause an error at module load time if STRIPE_SECRET_KEY is not set,
// potentially preventing the API route from functioning correctly.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
  });
} else {
  console.error("FATAL: STRIPE_SECRET_KEY is not set in the environment variables. Stripe Checkout will not work.");
  // We can't initialize Stripe, so API calls will fail.
  // We'll let the POST handler try and fail to make this clear in logs if it even gets called.
}

export async function POST(req: NextRequest) {
  console.log('Create Checkout Session: POST handler invoked.'); // New log

  if (!stripeSecretKey || !stripe) {
    console.error('Create Checkout Session: Stripe is not initialized because STRIPE_SECRET_KEY is missing.');
    return NextResponse.json({ error: 'Stripe configuration error on server. Secret key missing.' }, { status: 500 });
  }
  console.log('Create Checkout Session: STRIPE_SECRET_KEY is present.'); // New log

  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
      console.error('Create Checkout Session: Email or userId missing in request body.');
      return NextResponse.json({ error: 'Email and userId are required.' }, { status: 400 });
    }
    console.log('Create Checkout Session: Received email:', email, 'userId:', userId);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Ensure this is the actual, live Stripe Price ID for the Pro subscription.
    const proPriceId = 'price_1RY5kuFHAncsAftmG1YtLyp9'; // CONFIRMED LIVE PRICE ID

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

    console.log('Create Checkout Session: Params sent to Stripe:', checkoutSessionParams);

    const session = await stripe.checkout.sessions.create(checkoutSessionParams);

    if (!session.url) {
      console.error('Create Checkout Session: Stripe session URL is null after creation.');
      return NextResponse.json({ error: 'Could not create Stripe session (URL null).' }, { status: 500 });
    }

    console.log('Create Checkout Session: Stripe Checkout Session URL:', session.url);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Create Checkout Session: Error in POST handler:', error.message, error.stack); // Added error.stack
    const stripeErrorMessage = error.type ? `${error.type}: ${error.message}` : error.message;
    return NextResponse.json({ error: `Internal Server Error creating Stripe session: ${stripeErrorMessage}` }, { status: 500 });
  }
}
