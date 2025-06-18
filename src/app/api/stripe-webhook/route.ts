
// src/app/api/stripe-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { admin, adminFirestore } from '@/lib/firebase-admin'; // Import Firebase Admin initialized instances
import type { UserProfile, SubscriptionTier } from '@/types/auth'; // Import UserProfile

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
    console.error("Webhook Error: Stripe is not configured on the server (STRIPE_SECRET_KEY missing at runtime).");
    return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 });
  }
  if (!webhookSecret) {
    console.error("Webhook Error: Stripe webhook secret is not configured (STRIPE_WEBHOOK_SECRET missing at runtime).");
    return NextResponse.json({ error: 'Stripe webhook secret is not configured.' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event: Stripe.Event;

  try {
    if (!sig) {
      console.warn("⚠️ Stripe webhook signature missing!");
      return NextResponse.json({ error: 'Webhook signature missing.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
    console.error("Full signature verification error object:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`Stripe Webhook Received: ${event.type}, ID: ${event.id}`);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Webhook: Checkout session completed, ID:', session.id);
      console.log("Webhook: Full session object:", JSON.stringify(session, null, 2));


      const userId = session.metadata?.userId;
      const stripeCustomerId = session.customer as string;
      const stripeSubscriptionId = session.subscription as string;

      if (!userId) {
        console.error('Webhook Error: userId not found in checkout session metadata for session:', session.id);
        return NextResponse.json({ error: 'User ID missing in session metadata.' }, { status: 400 });
      }
      if (!stripeSubscriptionId) {
        console.error('Webhook Error: subscription ID not found in checkout session for session:', session.id);
        return NextResponse.json({ error: 'Subscription ID missing in session.' }, { status: 400 });
      }
       if (!stripeCustomerId) {
        console.error('Webhook Error: customer ID not found in checkout session for session:', session.id);
        return NextResponse.json({ error: 'Customer ID missing in session.' }, { status: 400 });
      }
      console.log(`Webhook: Processing checkout.session.completed for userId: ${userId}, stripeCustomerId: ${stripeCustomerId}, stripeSubscriptionId: ${stripeSubscriptionId}`);


      try {
        console.log(`Webhook: Attempting to retrieve subscription ${stripeSubscriptionId} from Stripe for session ${session.id}.`);
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        
        if (!subscription) {
          console.error(`Webhook Error: Failed to retrieve subscription object for ID ${stripeSubscriptionId} from Stripe for session ${session.id}. The retrieve call returned null/undefined.`);
          return NextResponse.json({ error: 'Failed to retrieve subscription details from Stripe.' }, { status: 500 });
        }
        console.log(`Webhook: Successfully retrieved subscription ${subscription.id} from Stripe. Status: ${subscription.status}, Current Period End: ${subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : 'N/A'}, Trial End: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'N/A'}`);
        console.log("Webhook: Full subscription object from Stripe:", JSON.stringify(subscription, null, 2));

        const userDocRef = adminFirestore.collection('users').doc(userId);
        
        let determinedTier: SubscriptionTier;
        if (subscription.status === 'trialing') {
          determinedTier = 'trialing';
        } else if (subscription.status === 'active' && session.payment_status === 'paid') {
          determinedTier = 'pro';
        } else {
          // Fallback: if not clearly 'trialing' or 'active' + 'paid', assume 'pro' if payment was made.
          // This could happen if the subscription becomes active immediately after a trial within the same checkout flow.
          // More complex states ('incomplete', 'past_due') might need further handling or rely on other events.
          console.warn(`Webhook: checkout.session.completed for session ${session.id} - Subscription status is '${subscription.status}' and payment_status is '${session.payment_status}'. Determining tier. If paid, setting to 'pro'.`);
          determinedTier = (session.payment_status === 'paid') ? 'pro' : 'trialing'; // Simplified: paid -> pro, else trialing if status says so.
        }

        const userProfileUpdate: Partial<UserProfile> = {
          subscriptionTier: determinedTier, 
          stripeCustomerId: stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : undefined,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        console.log(`Webhook: Attempting to update Firestore for user ${userId} with data:`, JSON.stringify(userProfileUpdate));
        await userDocRef.set(userProfileUpdate, { merge: true });
        console.log(`Webhook: Successfully updated Firestore for user ${userId} with subscription details from session ${session.id}.`);

      } catch (dbOrStripeError: any) {
        console.error(`Webhook Error during Firestore update or Stripe API call for user ${userId} (session ${session.id}):`, dbOrStripeError.message);
        console.error("Webhook Error Stack Trace:", dbOrStripeError.stack);
        console.error("Webhook Full dbOrStripeError object:", JSON.stringify(dbOrStripeError, Object.getOwnPropertyNames(dbOrStripeError)));
        return NextResponse.json({ error: 'Database update or Stripe API call failed during webhook processing.' }, { status: 500 });
      }
      break;
    
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Webhook: Invoice payment succeeded:', invoice.id, 'for subscription:', invoice.subscription);
      if (invoice.subscription && invoice.customer) {
        const subId = invoice.subscription as string;
        
        try {
          console.log(`Webhook: Attempting to retrieve subscription ${subId} from Stripe for invoice ${invoice.id}.`);
          const subscriptionFromInvoice = await stripe.subscriptions.retrieve(subId);
          console.log(`Webhook: Successfully retrieved subscription ${subscriptionFromInvoice.id} from invoice.payment_succeeded. Status: ${subscriptionFromInvoice.status}, Period End: ${new Date(subscriptionFromInvoice.current_period_end * 1000).toISOString()}`);
          
          const usersRef = adminFirestore.collection('users');
          const snapshot = await usersRef.where('stripeSubscriptionId', '==', subId).limit(1).get();

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userProfileUpdate: Partial<UserProfile> = {
              subscriptionStatus: subscriptionFromInvoice.status,
              currentPeriodEnd: new Date(subscriptionFromInvoice.current_period_end * 1000).toISOString(),
              subscriptionTier: subscriptionFromInvoice.status === 'active' || subscriptionFromInvoice.status === 'trialing' ? 'pro' : 'free', 
              trialEndsAt: subscriptionFromInvoice.trial_end ? new Date(subscriptionFromInvoice.trial_end * 1000).toISOString() : null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            console.log(`Webhook: Attempting to update Firestore for user ${userDoc.id} from invoice ${invoice.id} with data:`, JSON.stringify(userProfileUpdate));
            await userDoc.ref.set(userProfileUpdate, { merge: true });
            console.log(`Webhook: Subscription renewed/updated in Firestore for user ${userDoc.id} from invoice ${invoice.id}.`);
          } else {
            console.warn(`Webhook Warning: No user found with stripeSubscriptionId ${subId} for invoice.payment_succeeded event ${invoice.id}. This might be expected if checkout.session.completed handled initial setup.`);
          }
        } catch (dbOrStripeError: any) {
           console.error(`Webhook Error updating Firestore from invoice.payment_succeeded ${invoice.id}:`, dbOrStripeError.message);
           console.error("Webhook Error Stack Trace:", dbOrStripeError.stack);
           console.error("Webhook Full dbOrStripeError object:", JSON.stringify(dbOrStripeError, Object.getOwnPropertyNames(dbOrStripeError)));
           return NextResponse.json({ error: 'Database update or Stripe API call failed for invoice.payment_succeeded.' }, { status: 500 });
        }
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      console.log(`Webhook: Invoice payment failed for subscription: ${failedInvoice.subscription}, Invoice ID: ${failedInvoice.id}`);
      if (failedInvoice.subscription) {
         try {
          const subId = failedInvoice.subscription as string;
          console.log(`Webhook: Attempting to retrieve subscription ${subId} from Stripe for failed_invoice ${failedInvoice.id}.`);
          const subscriptionDetails = await stripe.subscriptions.retrieve(subId); 
          console.log(`Webhook: Retrieved subscription ${subscriptionDetails.id} details for failed invoice. Status: ${subscriptionDetails.status}`);

          const usersRef = adminFirestore.collection('users');
          const snapshot = await usersRef.where('stripeSubscriptionId', '==', subId).limit(1).get();
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userProfileUpdate: Partial<UserProfile> = { 
              subscriptionStatus: subscriptionDetails.status, 
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            console.log(`Webhook: Attempting to update Firestore for user ${userDoc.id} from failed_invoice ${failedInvoice.id} with data:`, JSON.stringify(userProfileUpdate));
            await userDoc.ref.set(userProfileUpdate, { merge: true });
            console.log(`Webhook: Subscription status updated in Firestore for user ${userDoc.id} due to failed invoice ${failedInvoice.id}.`);
          } else {
             console.warn(`Webhook Warning: No user found with stripeSubscriptionId ${subId} for invoice.payment_failed event.`);
          }
        } catch (dbOrStripeError: any) {
           console.error(`Webhook Error updating Firestore from failed_invoice ${failedInvoice.id}:`, dbOrStripeError.message);
           console.error("Webhook Error Stack Trace:", dbOrStripeError.stack);
           console.error("Webhook Full dbOrStripeError object:", JSON.stringify(dbOrStripeError, Object.getOwnPropertyNames(dbOrStripeError)));
           return NextResponse.json({ error: 'Database update or Stripe API call failed for invoice.payment_failed.' }, { status: 500 });
        }
      }
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      console.log(`Webhook: Subscription updated: ${updatedSubscription.id}, Status: ${updatedSubscription.status}, Current Period End: ${new Date(updatedSubscription.current_period_end * 1000).toISOString()}`);
      try {
        const usersRef = adminFirestore.collection('users');
        // It's more reliable to find the user by stripeCustomerId if available, 
        // as stripeSubscriptionId might change in some complex scenarios (though rare for simple updates).
        // For now, assuming stripeSubscriptionId is primary link after initial creation.
        const queryField = updatedSubscription.id.startsWith('sub_') ? 'stripeSubscriptionId' : 'stripeCustomerId';
        const queryValue = updatedSubscription.id.startsWith('sub_') ? updatedSubscription.id : (updatedSubscription.customer as string);

        console.log(`Webhook: Querying users by ${queryField} = ${queryValue} for subscription.updated event.`);
        const snapshot = await usersRef.where(queryField, '==', queryValue).limit(1).get();
        
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userProfileUpdate: Partial<UserProfile> = { 
              stripeSubscriptionId: updatedSubscription.id, 
              subscriptionStatus: updatedSubscription.status,
              currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            if (updatedSubscription.status === 'active' || updatedSubscription.status === 'trialing') {
              userProfileUpdate.subscriptionTier = 'pro';
            } else if (updatedSubscription.status === 'canceled' && updatedSubscription.cancel_at_period_end) {
              userProfileUpdate.subscriptionTier = 'pro'; 
            } else {
              userProfileUpdate.subscriptionTier = 'free'; 
            }
            
            if (updatedSubscription.trial_end) {
                userProfileUpdate.trialEndsAt = new Date(updatedSubscription.trial_end * 1000).toISOString();
            } else if (updatedSubscription.status !== 'trialing') {
                 userProfileUpdate.trialEndsAt = null; 
            }

            console.log(`Webhook: Attempting to update Firestore for user ${userDoc.id} from subscription.updated ${updatedSubscription.id} with data:`, JSON.stringify(userProfileUpdate));
            await userDoc.ref.set(userProfileUpdate, { merge: true });
            console.log(`Webhook: Subscription details updated in Firestore for user ${userDoc.id} from subscription.updated event ${updatedSubscription.id}.`);
        } else {
            console.warn(`Webhook Warning: No user found with ${queryField} ${queryValue} for subscription.updated event.`);
        }
      } catch (dbOrStripeError: any) {
           console.error(`Webhook Error updating Firestore from subscription.updated ${updatedSubscription.id}:`, dbOrStripeError.message);
           console.error("Webhook Error Stack Trace:", dbOrStripeError.stack);
           console.error("Webhook Full dbOrStripeError object:", JSON.stringify(dbOrStripeError, Object.getOwnPropertyNames(dbOrStripeError)));
           return NextResponse.json({ error: 'Database update or Stripe API call failed for subscription.updated.' }, { status: 500 });
      }
      break;

    case 'customer.subscription.deleted': 
      const deletedSubscription = event.data.object as Stripe.Subscription;
      console.log(`Webhook: Subscription deleted: ${deletedSubscription.id}, Status: ${deletedSubscription.status}`);
      try {
        const usersRef = adminFirestore.collection('users');
        const snapshot = await usersRef.where('stripeSubscriptionId', '==', deletedSubscription.id).limit(1).get();
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userProfileUpdate: Partial<UserProfile> = { 
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled', 
              currentPeriodEnd: null, 
              trialEndsAt: null, 
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
             console.log(`Webhook: Attempting to update Firestore for user ${userDoc.id} from subscription.deleted ${deletedSubscription.id} with data:`, JSON.stringify(userProfileUpdate));
            await userDoc.ref.set(userProfileUpdate, { merge: true });
            console.log(`Webhook: Subscription set to 'free' in Firestore for user ${userDoc.id} (Stripe sub ID: ${deletedSubscription.id}).`);
        } else {
            console.warn(`Webhook Warning: No user found for deleted stripeSubscriptionId ${deletedSubscription.id}.`);
        }
      } catch (dbOrStripeError: any) {
           console.error(`Webhook Error updating Firestore from subscription.deleted ${deletedSubscription.id}:`, dbOrStripeError.message);
           console.error("Webhook Error Stack Trace:", dbOrStripeError.stack);
           console.error("Webhook Full dbOrStripeError object:", JSON.stringify(dbOrStripeError, Object.getOwnPropertyNames(dbOrStripeError)));
           return NextResponse.json({ error: 'Database update or Stripe API call failed for subscription.deleted.' }, { status: 500 });
      }
      break;
      
    default:
      console.log(`Webhook: Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

