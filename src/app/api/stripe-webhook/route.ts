
// src/app/api/stripe-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
// import { buffer } from 'micro'; // For parsing raw body if needed by Stripe SDK

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("Stripe secret key is not configured for webhook handler.");
}
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
  }
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook secret is not configured.' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  // const rawBody = await buffer(req.body); // NextRequest.body is a ReadableStream, needs careful handling for raw body
  
  let event: Stripe.Event;
  
  // Note: Next.js Edge runtime (default for API routes if not specified) might not support `req.text()` easily.
  // For raw body parsing, you might need to switch to Node.js runtime for this route or use a library.
  // For now, we'll assume the body can be read as text. If using a library like `micro`, it handles this.
  // const requestBuffer = await req.arrayBuffer(); // A way to get raw body in Next.js
  // const bodyString = new TextDecoder().decode(requestBuffer);
  
  // For simplicity in this placeholder, we're not fully implementing raw body parsing.
  // In a real app, you MUST use the raw request body to verify the webhook signature.
  // const rawBody = await req.text(); // This is available in Node.js runtime for API routes
  // For this placeholder, we'll mock the body parsing.
  // You *must* use the raw request body for Stripe signature verification.
  // See: https://stripe.com/docs/webhooks/signatures
  const body = await req.text(); 

  try {
    if (!sig) {
      console.warn("Stripe webhook signature missing!");
      return NextResponse.json({ error: 'Webhook signature missing.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  console.log(`Stripe Webhook Received: ${event.type}`);
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      // This is where you would:
      // 1. Retrieve the user ID (e.g., from session.client_reference_id or session.metadata.userId).
      // 2. Retrieve the Stripe customer ID (session.customer).
      // 3. Retrieve the subscription ID (session.subscription).
      // 4. Determine the product/price ID to know which tier was purchased.
      // 5. Update your database:
      //    - Mark the user as subscribed to the specific tier.
      //    - Store the Stripe customer ID and subscription ID.
      //    - Set the subscription start/end dates.
      console.log(`Checkout session completed for customer ${session.customer}, subscription ${session.subscription}`);
      // Example: await updateUserSubscription(session.client_reference_id, session.customer, session.subscription, 'pro');
      break;
    
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      // This indicates a successful recurring payment or a new subscription payment.
      // You might use this to:
      // 1. Update the subscription's current period end if it's a renewal.
      // 2. Log the payment.
      // 3. Grant access to services for the new period.
      if (invoice.billing_reason === 'subscription_create') {
        console.log(`New subscription created via invoice: ${invoice.subscription}`);
      } else if (invoice.billing_reason === 'subscription_cycle') {
        console.log(`Subscription renewal payment succeeded for: ${invoice.subscription}`);
      }
      // Example: await handleSubscriptionRenewal(invoice.subscription, invoice.period_end);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      // This indicates a failed payment.
      // You should:
      // 1. Notify the user about the payment failure.
      // 2. Potentially restrict access to services if payment isn't resolved after a grace period.
      console.log(`Invoice payment failed for subscription: ${failedInvoice.subscription}`);
      // Example: await handleFailedPayment(failedInvoice.subscription, failedInvoice.customer);
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      // Handle subscription changes, e.g., upgrades, downgrades, cancellations.
      // Check updatedSubscription.status, updatedSubscription.items.data[0].price.id
      console.log(`Subscription updated: ${updatedSubscription.id}, Status: ${updatedSubscription.status}`);
      // Example: await syncSubscriptionStatus(updatedSubscription.id, updatedSubscription.status, updatedSubscription.items.data[0].price.id);
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      // Handle subscription cancellations (when it's actually deleted, not just scheduled for cancellation).
      // 1. Update user's status in your database to 'free' or 'cancelled'.
      // 2. Revoke access to paid features at the end of the current billing period.
      console.log(`Subscription deleted: ${deletedSubscription.id}`);
      // Example: await handleSubscriptionCancellation(deletedSubscription.id);
      break;
      
    // ... handle other event types as needed
    
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}
