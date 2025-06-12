
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

    // IMPORTANT: Replace 'your_stripe_price_id_here' with your actual Stripe Price ID for the Pro subscription.
    // This Price ID should correspond to a Product in your Stripe dashboard that has a 3-day trial configured if you want the trial.
    const proPriceId = 'your_stripe_price_id_here'; // Placeholder - MUST BE REPLACED

    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      // The trial is typically configured on the Price object in Stripe itself.
      // If your Price ID in Stripe has a trial_period_days set, it will be used.
      // You can also override or set it here if needed, but it's often cleaner to manage on Stripe.
      // subscription_data: {
      //   trial_period_days: 3, // Example if you want to define it here
      // },
      customer_email: email,
      // Pass the userId to the checkout session's metadata.
      // This helps link the Stripe session back to your user in the webhook.
      metadata: {
        userId: userId,
      },
      // Ensure you have /subscribe/success and /subscribe/cancel pages in your app
      success_url: `${appUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscribe/cancel`,
    };

    // If the price ID in Stripe already has a trial configured,
    // you might not need to set subscription_data.trial_period_days here.
    // Stripe recommends setting trials on the Price object.
    // For this example, I'm assuming the trial is set on the Stripe Price.
    // If you need to explicitly set it from the backend:
    // if (proPriceId === 'your_price_id_that_needs_explicit_trial_override') {
    //   checkoutSessionParams.subscription_data = { trial_period_days: 3 };
    // }

    const session = await stripe.checkout.sessions.create(checkoutSessionParams);

    if (!session.url) {
      console.error('Stripe session URL is null.');
      return NextResponse.json({ error: 'Could not create Stripe session.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating Stripe Checkout Session:', error.message);
    return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
  }
}
