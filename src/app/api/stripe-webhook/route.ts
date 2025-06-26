
// src/app/api/stripe-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { admin, adminFirestore, firebaseAdminInitError } from '@/lib/firebase-admin'; // Import Firebase Admin initialized instances
import type { UserProfile, SubscriptionTier } from '@/types/auth'; // Import UserProfile

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20', // Keep consistent or update to latest desired
  });
} else {
  console.error("Stripe secret key is not configured for webhook handler.");
}


const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (firebaseAdminInitError || !adminFirestore) {
    console.error('API Route Error: Firebase Admin SDK not available.', firebaseAdminInitError);
    return NextResponse.json({
      error: 'Server configuration error: The connection to the database service is not available. Please check server logs for details about GOOGLE_APPLICATION_CREDENTIALS_JSON.',
      details: firebaseAdminInitError?.message || "Firebase Admin SDK services are not initialized."
    }, { status: 503 });
  }

  if (!stripe) {
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
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
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

      try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        
        if (!subscription) {
          console.error(`Webhook Error: Failed to retrieve subscription object for ID ${stripeSubscriptionId} from Stripe for session ${session.id}. The retrieve call returned null/undefined.`);
          return NextResponse.json({ error: 'Failed to retrieve subscription details from Stripe.' }, { status: 500 });
        }

        const userDocRef = adminFirestore.collection('users').doc(userId);
        
        let determinedTier: SubscriptionTier;
        if (subscription.status === 'active') { // If Stripe says 'active', it's 'pro'
            determinedTier = 'pro';
        } else if (subscription.status === 'trialing') {
            determinedTier = 'trialing';
        } else {
            determinedTier = subscription.trial_end ? 'trialing' : 'free'; 
            console.warn(`Webhook: checkout.session.completed for session ${session.id} - Subscription status is '${subscription.status}'. Determined tier as '${determinedTier}'.`);
        }

        const userProfileUpdate: Partial<UserProfile> = {
          subscriptionTier: determinedTier, 
          stripeCustomerId: stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : undefined,
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null, 
          updatedAt: new Date().toISOString(),
        };

        await userDocRef.set(userProfileUpdate, { merge: true });

      } catch (dbOrStripeError: any) {
        console.error(`Webhook Error during Firestore update or Stripe API call for user ${userId} (session ${session.id}):`, dbOrStripeError.message);
        return NextResponse.json({ error: 'Database update or Stripe API call failed during webhook processing.' }, { status: 500 });
      }
      break;
    
    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription && invoice.customer) {
        const subId = invoice.subscription as string;
        
        try {
          const subscriptionFromInvoice = await stripe.subscriptions.retrieve(subId);
          
          const usersRef = adminFirestore.collection('users');
          const snapshot = await usersRef.where('stripeSubscriptionId', '==', subId).limit(1).get();

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            
            let newTier: SubscriptionTier = 'free';
            if (subscriptionFromInvoice.status === 'active') {
                newTier = 'pro';
            } else if (subscriptionFromInvoice.status === 'trialing') {
                newTier = 'trialing';
            }

            const userProfileUpdate: Partial<UserProfile> = {
              subscriptionStatus: subscriptionFromInvoice.status,
              currentPeriodEnd: new Date(subscriptionFromInvoice.current_period_end * 1000).toISOString(),
              subscriptionTier: newTier, 
              trialEndsAt: subscriptionFromInvoice.trial_end ? new Date(subscriptionFromInvoice.trial_end * 1000).toISOString() : null,
              updatedAt: new Date().toISOString(),
            };
            await userDoc.ref.set(userProfileUpdate, { merge: true });
          } else {
            console.warn(`Webhook Warning: No user found with stripeSubscriptionId ${subId} for invoice.payment_succeeded event ${invoice.id}. This might be expected if checkout.session.completed handled initial setup.`);
          }
        } catch (dbOrStripeError: any) {
           console.error(`Webhook Error updating Firestore from invoice.payment_succeeded ${invoice.id}:`, dbOrStripeError.message);
           return NextResponse.json({ error: 'Database update or Stripe API call failed for invoice.payment_succeeded.' }, { status: 500 });
        }
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;
      if (failedInvoice.subscription) {
         try {
          const subId = failedInvoice.subscription as string;
          const subscriptionDetails = await stripe.subscriptions.retrieve(subId); 

          const usersRef = adminFirestore.collection('users');
          const snapshot = await usersRef.where('stripeSubscriptionId', '==', subId).limit(1).get();
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];

            let newTier: SubscriptionTier = 'free';
            if (subscriptionDetails.status === 'active') {
                newTier = 'pro';
            } else if (subscriptionDetails.status === 'trialing') {
                newTier = 'trialing';
            }

            const userProfileUpdate: Partial<UserProfile> = { 
              subscriptionStatus: subscriptionDetails.status, 
              subscriptionTier: newTier,
              updatedAt: new Date().toISOString(),
            };
            await userDoc.ref.set(userProfileUpdate, { merge: true });
          } else {
             console.warn(`Webhook Warning: No user found with stripeSubscriptionId ${subId} for invoice.payment_failed event.`);
          }
        } catch (dbOrStripeError: any) {
           console.error(`Webhook Error updating Firestore from failed_invoice ${failedInvoice.id}:`, dbOrStripeError.message);
           return NextResponse.json({ error: 'Database update or Stripe API call failed for invoice.payment_failed.' }, { status: 500 });
        }
      }
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object as Stripe.Subscription;
      try {
        const usersRef = adminFirestore.collection('users');
        const queryField = updatedSubscription.id.startsWith('sub_') ? 'stripeSubscriptionId' : 'stripeCustomerId';
        const queryValue = updatedSubscription.id.startsWith('sub_') ? updatedSubscription.id : (updatedSubscription.customer as string);

        const snapshot = await usersRef.where(queryField, '==', queryValue).limit(1).get();
        
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userProfileUpdate: Partial<UserProfile> = { 
              stripeSubscriptionId: updatedSubscription.id, 
              subscriptionStatus: updatedSubscription.status,
              currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
              trialEndsAt: updatedSubscription.trial_end ? new Date(updatedSubscription.trial_end * 1000).toISOString() : null,
              updatedAt: new Date().toISOString(),
            };

            if (updatedSubscription.status === 'active') {
              userProfileUpdate.subscriptionTier = 'pro';
            } else if (updatedSubscription.status === 'trialing') {
              userProfileUpdate.subscriptionTier = 'trialing';
            } else {
              userProfileUpdate.subscriptionTier = 'free';
            }
            
            await userDoc.ref.set(userProfileUpdate, { merge: true });
        } else {
            console.warn(`Webhook Warning: No user found with ${queryField} ${queryValue} for subscription.updated event.`);
        }
      } catch (dbOrStripeError: any) {
           console.error(`Webhook Error updating Firestore from subscription.updated ${updatedSubscription.id}:`, dbOrStripeError.message);
           return NextResponse.json({ error: 'Database update or Stripe API call failed for subscription.updated.' }, { status: 500 });
      }
      break;

    case 'customer.subscription.deleted': 
      const deletedSubscription = event.data.object as Stripe.Subscription;
      try {
        const usersRef = adminFirestore.collection('users');
        const snapshot = await usersRef.where('stripeSubscriptionId', '==', deletedSubscription.id).limit(1).get();
        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            const userProfileUpdate: Partial<UserProfile> = { 
              subscriptionTier: 'free',
              subscriptionStatus: 'canceled', 
              stripeSubscriptionId: null, 
              currentPeriodEnd: null, 
              trialEndsAt: null, 
              updatedAt: new Date().toISOString(),
            };
            await userDoc.ref.set(userProfileUpdate, { merge: true });
        } else {
            console.warn(`Webhook Warning: No user found for deleted stripeSubscriptionId ${deletedSubscription.id}.`);
        }
      } catch (dbOrStripeError: any) {
           console.error(`Webhook Error updating Firestore from subscription.deleted ${deletedSubscription.id}:`, dbOrStripeError.message);
           return NextResponse.json({ error: 'Database update or Stripe API call failed for subscription.deleted.' }, { status: 500 });
      }
      break;
      
    default:
      // Unhandled event type
  }

  return NextResponse.json({ received: true });
}
