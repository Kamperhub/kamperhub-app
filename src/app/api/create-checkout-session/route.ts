
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Using the API version from your existing webhook
});

export async function POST(req: NextRequest) {
  try {
    const { email, userId } = await req.json();

    if (!email || !userId) {
      return NextResponse.json({ error: 'Email and userId are required.' }, { status: 400 });
    }

    // Use NEXT_PUBLIC_APP_URL from environment variables for success and cancel URLs
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
      console.error('Stripe session URL is null.');
      return NextResponse.json({ error: 'Could not create Stripe session.' }, { status: 500 });
    }

    console.log('Create Checkout Session: Stripe Checkout Session URL:', session.url);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating Stripe Checkout Session:', error.message);
    // Send back a more specific error if available from Stripe, otherwise generic.
    const stripeErrorMessage = error.type ? `${error.type}: ${error.message}` : error.message;
    return NextResponse.json({ error: `Internal Server Error: ${stripeErrorMessage}` }, { status: 500 });
  }
}
