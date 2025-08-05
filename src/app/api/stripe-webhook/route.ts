// src/app/api/stripe-webhook/route.ts
import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import type { UserProfile, SubscriptionTier } from '@/types/auth';
import type admin from 'firebase-admin';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-05-28', // Using latest stable version
  });
} else {
  console.error("Stripe secret key is not configured for webhook handler.");
}


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function updateUserSubscriptionStatus(
  firestore: admin.firestore.Firestore,
  stripeCustomerId: string,
  updates: Partial<UserProfile>
) {
  const usersRef = firestore.collection('users');
  const snapshot = await usersRef.where('stripeCustomerId', '==', stripeCustomerId).limit(1).get();
  
  if (snapshot.empty) {
    console.warn(`[Stripe Webhook] No user found with Stripe Customer ID: ${stripeCustomerId}`);
    return;
  }
  
  const userDoc = snapshot.docs[0];
  console.log(`[Stripe Webhook] Updating user ${userDoc.id} for Stripe Customer ID ${stripeCustomerId}`);
  await userDoc.ref.set(updates, { merge: true });
}


export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    console.error("Webhook Error: Firebase Admin SDK failed to initialize:", adminError?.message);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }
  
  if (!stripe) {
    console.error("Webhook Error: Stripe is not configured on the server (STRIPE_SECRET_KEY missing at runtime).");
    return NextResponse.json({ error: 'Stripe service is not configured on the server (missing STRIPE_SECRET_KEY). See setup guide.' }, { status: 503 });
  }
  if (!webhookSecret) {
    console.error("Webhook Error: Stripe webhook secret is not configured (STRIPE_WEBHOOK_SECRET missing at runtime).");
    return NextResponse.json({ error: 'Stripe webhook endpoint is not configured (missing STRIPE_WEBHOOK_SECRET). See setup guide.' }, { status: 503 });
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
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (ID: ${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        let userId = session.client_reference_id;
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;

        // NEW: If the UID wasn't passed, try to look up the user by email from the Stripe session.
        if (!userId && session.customer_details?.email && auth) {
            try {
                const userRecord = await auth.getUserByEmail(session.customer_details.email);
                userId = userRecord.uid;
                console.log(`[Stripe Webhook] Found user by email during checkout: ${session.customer_details.email} -> UID: ${userId}`);
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    console.warn(`[Stripe Webhook] User with email ${session.customer_details.email} from Stripe checkout does not exist in Firebase Auth. Cannot link subscription automatically.`);
                } else {
                    console.error('[Stripe Webhook] Error looking up user by email:', e);
                }
            }
        }

        if (!userId || !stripeCustomerId || !stripeSubscriptionId) {
          console.error(`[Stripe Webhook] checkout.session.completed event ${session.id} missing required data.`);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        
        let determinedTier: SubscriptionTier = 'free';
        if (subscription.status === 'active') determinedTier = 'pro';
        else if (subscription.status === 'trialing') determinedTier = 'trialing';

        await firestore.collection('users').doc(userId).set({
          subscriptionTier: determinedTier, 
          stripeCustomerId: stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
        console.log(`[Stripe Webhook] Processed checkout.session.completed for user ${userId}`);
        break;
      
      case 'invoice.paid': // Alias for payment_succeeded
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.customer) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          let newTier: SubscriptionTier = 'free';
          if (subscription.status === 'active') newTier = 'pro';
          else if (subscription.status === 'trialing') newTier = 'trialing';
          
          await updateUserSubscriptionStatus(firestore, invoice.customer as string, {
            subscriptionTier: newTier,
            stripeSubscriptionId: subscription.id,
            trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[Stripe Webhook] Processed ${event.type} for customer ${invoice.customer}`);
        } else {
          console.warn(`[Stripe Webhook] ${event.type} event ${invoice.id} missing subscription or customer ID.`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object as Stripe.Invoice;
        if (failedInvoice.subscription && failedInvoice.customer) {
          const subscriptionDetails = await stripe.subscriptions.retrieve(failedInvoice.subscription as string); 
          let newTier: SubscriptionTier = 'free';
          if (subscriptionDetails.status === 'active') newTier = 'pro';
          else if (subscriptionDetails.status === 'trialing') newTier = 'trialing';

          await updateUserSubscriptionStatus(firestore, failedInvoice.customer as string, {
            subscriptionTier: newTier,
            trialEndsAt: subscriptionDetails.trial_end ? new Date(subscriptionDetails.trial_end * 1000).toISOString() : null,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[Stripe Webhook] Processed invoice.payment_failed for customer ${failedInvoice.customer}`);
        } else {
           console.warn(`[Stripe Webhook] invoice.payment_failed event ${failedInvoice.id} missing subscription or customer ID.`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const updatedSubscription = event.data.object as Stripe.Subscription;
        if (updatedSubscription.customer) {
            let newTier: SubscriptionTier = 'free';
            if (updatedSubscription.status === 'active') newTier = 'pro';
            else if (updatedSubscription.status === 'trialing') newTier = 'trialing';
            
            await updateUserSubscriptionStatus(firestore, updatedSubscription.customer as string, {
              subscriptionTier: newTier,
              stripeSubscriptionId: updatedSubscription.id, 
              trialEndsAt: updatedSubscription.trial_end ? new Date(updatedSubscription.trial_end * 1000).toISOString() : null,
              updatedAt: new Date().toISOString(),
            });
            console.log(`[Stripe Webhook] Processed customer.subscription.updated for customer ${updatedSubscription.customer}`);
        } else {
            console.warn(`[Stripe Webhook] customer.subscription.updated event ${updatedSubscription.id} missing customer ID.`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const deletedSubscription = event.data.object as Stripe.Subscription;
        if (deletedSubscription.customer) {
          await updateUserSubscriptionStatus(firestore, deletedSubscription.customer as string, {
            subscriptionTier: 'free',
            stripeSubscriptionId: null,
            trialEndsAt: null,
            updatedAt: new Date().toISOString(),
          });
          console.log(`[Stripe Webhook] Processed customer.subscription.deleted for customer ${deletedSubscription.customer}`);
        } else {
          console.warn(`[Stripe Webhook] customer.subscription.deleted event ${deletedSubscription.id} missing customer ID.`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error processing event ${event.type} (ID: ${event.id}):`, err.message);
    return NextResponse.json({ error: `Webhook handler failed for ${event.type}.`, details: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
