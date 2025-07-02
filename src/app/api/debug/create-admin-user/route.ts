
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { UserProfile } from '@/types/auth';

// This endpoint is now designed to create a profile for *any* logged-in user who doesn't have one.
// It's particularly useful for the initial admin setup.

export async function GET(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }

  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid Authorization header. Please log in first.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Could not verify user identity from token." }, { status: 401 });
    }

    const userDocRef = firestore.collection('users').doc(userId);
    const docSnap = await userDocRef.get();

    if (docSnap.exists) {
      return NextResponse.json({ 
        message: `SUCCESS: Profile for user ${decodedToken.email} (UID: ${userId}) already exists in Firestore. No action was taken.`,
        data: docSnap.data()
      }, { status: 200 });
    }

    const authUserRecord = await auth.getUser(userId);
    const isAdmin = authUserRecord.email?.toLowerCase() === 'info@kamperhub.com';

    const newUserProfile: UserProfile = {
      uid: userId,
      email: authUserRecord.email || null,
      displayName: authUserRecord.displayName || 'Kamper User',
      firstName: 'New',
      lastName: 'User',
      city: 'Unknown',
      state: 'N/A',
      country: 'Unknown',
      subscriptionTier: isAdmin ? 'pro' : 'trialing',
      stripeCustomerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAdmin: isAdmin,
    };
    
    if (!isAdmin) {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      newUserProfile.trialEndsAt = trialEndDate.toISOString();
    }

    await userDocRef.set(newUserProfile);

    return NextResponse.json({ 
      message: `SUCCESS: Successfully created Firestore profile for user ${authUserRecord.email} (UID: ${userId}). Please refresh the main application page.`,
      createdData: newUserProfile 
    }, { status: 201 });

  } catch (err: any) {
    console.error('Error in create-user-profile endpoint:', err);
    
    let details = err.message;

    // Check for Firestore "database not found" error (code 5 or NOT_FOUND)
    if (err.code === 5 || (err.details && err.details.toLowerCase().includes('database not found')) || (err.message && err.message.toLowerCase().includes('not_found'))) {
      details = `CRITICAL: The server could not find the Firestore database named 'kamperhubv2'. This usually means either (a) the Firestore database has not been created in the Firebase console for this project, or (b) the Project ID in your GOOGLE_APPLICATION_CREDENTIALS_JSON does not match the client-side NEXT_PUBLIC_FIREBASE_PROJECT_ID. Please follow the setup checklist carefully.`;
    } else if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
       details = `The provided authentication token is invalid or has expired. Please log out and log back in before retrying.`;
       return NextResponse.json({ error: 'Authentication Error', details: details }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error While Creating User Profile', 
      details: details,
      clientProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set on server.',
    }, { status: 500 });
  }
}
