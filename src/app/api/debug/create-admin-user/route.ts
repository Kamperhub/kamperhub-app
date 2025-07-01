
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';

const ADMIN_UID = 'YKsb0Vzq13cMBAv2Ql8iyDFpbj42'; // This is your correct Authentication UID.
const ADMIN_EMAIL = 'info@kamperhub.com';

export async function GET(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }
  
  try {
    const userDocRef = firestore.collection('users').doc(ADMIN_UID);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      return NextResponse.json({ 
        message: `SUCCESS: Profile for UID ${ADMIN_UID} already exists in Firestore. No action was taken. You should be able to log in now.`,
        data: docSnap.data()
      }, { status: 200 });
    }

    let adminAuthRecord;
    try {
      adminAuthRecord = await auth.getUser(ADMIN_UID);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        return NextResponse.json({ 
          error: `CRITICAL: Authentication user with UID ${ADMIN_UID} not found. Please ensure this is the correct UID and that the user exists in Firebase Authentication. You may need to sign up first.` 
        }, { status: 404 });
      }
      throw authError; // Re-throw other auth errors
    }
    
    if(adminAuthRecord.email !== ADMIN_EMAIL) {
         return NextResponse.json({ 
          error: `CRITICAL: The UID ${ADMIN_UID} does not belong to ${ADMIN_EMAIL}. It belongs to ${adminAuthRecord.email}. Aborting for safety.` 
        }, { status: 400 });
    }

    const newUserProfile: UserProfile = {
      uid: ADMIN_UID,
      email: ADMIN_EMAIL,
      displayName: adminAuthRecord.displayName || 'KamperAdmin',
      firstName: 'Admin',
      lastName: 'User',
      city: 'Brisbane',
      state: 'QLD',
      country: 'Australia',
      subscriptionTier: 'pro',
      stripeCustomerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: true,
    };

    await userDocRef.set(newUserProfile);

    return NextResponse.json({ 
      message: `SUCCESS: Successfully created Firestore profile for UID ${ADMIN_UID} (${ADMIN_EMAIL}). Please refresh the main application page and log in.`,
      createdData: newUserProfile 
    }, { status: 201 });

  } catch (err: any) {
    console.error('Error in create-admin-user endpoint:', err);
    
    let details = err.message;

    if (err.code === 5 || err.message.includes('NOT_FOUND')) {
      details = `The server could not find the Firestore database. This usually means either (a) the Firestore database has not been created in the Firebase console for this project, or (b) the Project ID in your GOOGLE_APPLICATION_CREDENTIALS_JSON does not match the client-side NEXT_PUBLIC_FIREBASE_PROJECT_ID. Please follow the setup checklist carefully.`;
    }

    return NextResponse.json({ 
      error: 'Internal Server Error While Creating Admin User', 
      details: details,
      clientProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set on server.',
    }, { status: 500 });
  }
}
