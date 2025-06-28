
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';

const ADMIN_EMAIL = 'info@kamperhub.com';

export async function GET(req: NextRequest) {
  const { auth, firestore, error } = getFirebaseAdmin();
  if (error) {
    console.error('API Create Admin User Error: Firebase Admin SDK not available.', error);
    return NextResponse.json({ error: 'Server configuration error.', details: error.message }, { status: 503 });
  }

  try {
    // 1. Find the user in Firebase Authentication by email
    let adminAuthRecord;
    try {
      adminAuthRecord = await auth.getUserByEmail(ADMIN_EMAIL);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        return NextResponse.json({ 
          error: `Authentication user for ${ADMIN_EMAIL} not found. Please sign up with this email first.` 
        }, { status: 404 });
      }
      throw authError; // Re-throw other auth errors
    }

    const adminUid = adminAuthRecord.uid;
    const userDocRef = firestore.collection('users').doc(adminUid);

    // 2. Check if the document already exists in Firestore
    const docSnap = await userDocRef.get();
    if (docSnap.exists) {
      return NextResponse.json({ 
        message: `Profile for ${ADMIN_EMAIL} (UID: ${adminUid}) already exists in Firestore. No action was taken.`,
        data: docSnap.data()
      }, { status: 200 });
    }

    // 3. Create the profile with placeholder data if it doesn't exist
    const newUserProfile: UserProfile = {
      uid: adminUid,
      email: ADMIN_EMAIL,
      displayName: 'KamperAdmin',
      firstName: 'Admin',
      lastName: 'User',
      city: 'Brisbane',
      state: 'QLD',
      country: 'Australia',
      subscriptionTier: 'pro', // Give admin pro tier
      stripeCustomerId: null,
      trialEndsAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: true, // This is the crucial part
    };

    await userDocRef.set(newUserProfile);

    return NextResponse.json({ 
      message: `Successfully created Firestore profile for ${ADMIN_EMAIL} (UID: ${adminUid}). Please refresh the main application page.`,
      createdData: newUserProfile 
    }, { status: 201 });

  } catch (err: any) {
    console.error('Error in create-admin-user endpoint:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
