
// src/app/api/stripe-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { admin, adminFirestore } from '@/lib/firebase-admin'; // Import Firebase Admin initialized instances

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("Stripe secret key is not configured for webhook handler.");
  // Consider throwing an error or returning a specific response if critical
}
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2024-06-20', // Keep consistent or update to latest desired
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
  const body = await req.text();
  let event: Stripe.Event;

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

  console.log(`Stripe Webhook Received: ${event.type}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', session.id);

      const userId = session.metadata?.userId;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (!userId) {
        console.error('Error: userId not found in checkout session metadata.', session.id);
        return NextResponse.json({ error: 'User ID missing in session metadata.' }, { status: 400 });
      }
      if (!stripeSubscriptionId) {
        console.error('Error: subscription ID not found in checkout session.', session.id);
        return NextResponse.json({ error: 'Subscription ID missing in session.' }, { status: 400 });
      }
       if (!stripeCustomerId) {
        console.error('Error: customer ID not found in checkout session.', session.id);
        return NextResponse.json({ error: 'Customer ID missing in session.' }, { status: 400 });
      }


      try {
        // Retrieve the full subscription object to get status and current_period_end
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        if (!subscription) {
          console.error(`Error: Failed to retrieve subscription object for ID ${stripeSubscriptionId} from Stripe.`);
          return NextResponse.json({ error: 'Failed to retrieve subscription details from Stripe.' }, { status: 500 });
        }
        console.log(`Successfully retrieved subscription ${subscription.id}, status: ${subscription.status}, current_period_end: ${new Date(subscription.current_period_end * 1000).toISOString()}`);

        const userDocRef = adminFirestore.collection('users').doc(userId);
        const userProfileUpdate = {
          subscriptionTier: 'pro', // Assuming this checkout session is for the 'pro' tier
          stripeCustomerId: stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId,
          subscriptionStatus: subscription.status, // e.g., 'active', 'trialing'
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await userDocRef.set(userProfileUpdate, { merge: true });
        console.log(`Successfully updated Firestore for user ${userId} with subscription details from session ${session.id}.`);

      } catch (dbError: any) {
        console.error(`Error updating Firestore for user ${userId} from session ${session.id}:`, dbError.message);
        // Return 500 to Stripe so it retries the webhook if Firestore update fails.
        // Be cautious with retry logic; ensure idempotency or use specific error codes.
        return NextResponse.json({ error: 'Database update failed.' }, { status: 500 });
      }
      break;
    
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Invoice payment succeeded:', invoice.id, 'for subscription:', invoice.subscription);
      // This indicates a successful recurring payment or a new subscription payment.
      // You might use this to:
      // 1. Update the subscription's current period end if it's a renewal.
      // 2. Log the payment.
      // 3. Grant access to services for the new period.
      if (invoice.subscription && invoice.customer) {
        const subId = invoice.subscription as string;
        const custId = invoice.customer as string;
        
        try {
          const subscriptionFromInvoice = await stripe.subscriptions.retrieve(subId);
          // Find user by stripeCustomerId or stripeSubscriptionId. This assumes you query your 'users' collection.
          // Example: Query for user with this stripeSubscriptionId
          const usersRef = adminFirestore.collection('users');
          const snapshot = await usersRef.where('stripeSubscriptionId', '==', subId).limit(1).get();

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userProfileUpdate = {
              subscriptionStatus: subscriptionFromInvoice.status,
              currentPeriodEnd: new Date(subscriptionFromInvoice.current_period_end * 1000).toISOString(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await userDoc.ref.set(userProfileUpdate, { merge: true });
            console.log(`Subscription renewed in Firestore for user ${userDoc.id} from invoice ${invoice.id}.`);
          } else {
            console.warn(`No user found with stripeSubscriptionId ${subId} for invoice ${invoice.id}. Might be a new subscription handled by checkout.session.completed.`);
          }
        } catch (dbError: any) {
           console.error(`Error updating Firestore from invoice ${invoice.id}:`, dbError.message);
           return NextResponse.json({ error: 'Database update failed for invoice.' }, { status: 500 });
        }
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      // This indicates a failed payment.
      // You should:
      // 1. Notify the user about the payment failure.
      // 2. Potentially restrict access to services if payment isn't resolved after a grace period.
      // 3. Update subscriptionStatus in Firestore to 'past_due' or 'unpaid'.
      console.log(`Invoice payment failed for subscription: ${failedInvoice.subscription}`);
      if (failedInvoice.subscription) {
        // Similar logic to 'invoice.payment_succeeded' to find user and update status
        // For example, set subscriptionStatus: 'past_due'
         try {
          const subId = failedInvoice.subscription as string;
          const usersRef = adminFirestore.collection('users');
          const snapshot = await usersRef.where('stripeSubscriptionId', '==', subId).limit(1).get();
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await userDoc.ref.set({ 
              subscriptionStatus: 'past_due', // Or based on Stripe subscription status
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`Subscription status updated to past_due for user ${userDoc.id} due to failed invoice ${failedInvoice.id}.`);
          }
        } catch (dbError: any) {
           console.error(`Error updating Firestore from failed invoice ${failedInvoice.id}:`, dbError.message);
           return NextResponse.json({ error: 'Database update failed for failed_invoice.' }, { status: 500 });
        }
      }
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      // Handle subscription changes, e.g., upgrades, downgrades, cancellations scheduled.
      // Check updatedSubscription.status, updatedSubscription.items.data[0].price.id
      console.log(`Subscription updated: ${updatedSubscription.id}, Status: ${updatedSubscription.status}`);
      try {
        const usersRef = adminFirestore.collection('users');
        // Customer ID is more reliable here if the subscription ID changes (e.g. for some plan changes)
        const snapshot = await usersRef.where('stripeCustomerId', '==', updatedSubscription.customer as string).limit(1).get();
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userProfileUpdate = {
              subscriptionStatus: updatedSubscription.status,
              currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
              // Potentially update subscriptionTier if priceId changed, requires mapping priceId to your tiers
              // stripeSubscriptionId: updatedSubscription.id, // Update if it can change
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await userDoc.ref.set(userProfileUpdate, { merge: true });
            console.log(`Subscription details updated in Firestore for user ${userDoc.id} from subscription.updated event ${updatedSubscription.id}.`);
        } else {
            console.warn(`No user found with stripeCustomerId ${updatedSubscription.customer} for subscription.updated event.`);
        }
      } catch (dbError: any) {
           console.error(`Error updating Firestore from subscription.updated ${updatedSubscription.id}:`, dbError.message);
           return NextResponse.json({ error: 'Database update failed for subscription.updated.' }, { status: 500 });
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      // Handle subscription cancellations (when it's actually deleted, usually at period end if cancel_at_period_end was true).
      // 1. Update user's status in your database to 'free' or 'canceled'.
      // 2. Revoke access to paid features.
      console.log(`Subscription deleted: ${deletedSubscription.id}`);
      try {
        const usersRef = adminFirestore.collection('users');
        const snapshot = await usersRef.where('stripeSubscriptionId', '==', deletedSubscription.id).limit(1).get();
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await userDoc.ref.set({ 
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled', // Or 'expired'
              stripeSubscriptionId: null, // Or keep for history
              currentPeriodEnd: null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            console.log(`Subscription deleted in Firestore for user ${userDoc.id} (Stripe sub ID: ${deletedSubscription.id}).`);
        } else {
            console.warn(`No user found for deleted stripeSubscriptionId ${deletedSubscription.id}.`);
        }
      } catch (dbError: any) {
           console.error(`Error updating Firestore from subscription.deleted ${deletedSubscription.id}:`, dbError.message);
           return NextResponse.json({ error: 'Database update failed for subscription.deleted.' }, { status: 500 });
      }
      break;
      
    // ... handle other event types as needed for your business logic
    // e.g., 'customer.subscription.trial_will_end' to notify user.
    
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

    
