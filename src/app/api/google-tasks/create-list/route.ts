
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getOauth2Client, createTaskListWithItems } from '@/lib/google-tasks-api';
import type { UserProfile } from '@/types/auth';
import type { GoogleTasksStructure } from '@/ai/flows/personalized-packing-list-flow';
import { z } from 'zod';

// Zod schema for validation
const GoogleTasksStructureSchema = z.object({
  trip_task_name: z.string(),
  categories: z.array(z.object({
    category_name: z.string(),
    items: z.array(z.string())
  }))
});


export async function POST(req: NextRequest) {
  const { auth, firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth || !firestore) {
    return NextResponse.json({ error: 'Server configuration error.', details: adminError?.message }, { status: 503 });
  }
  
  try {
    const authorizationHeader = req.headers.get('Authorization');
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing Authorization header.' }, { status: 401 });
    }
    const idToken = authorizationHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    const userDocRef = firestore.collection('users').doc(userId);
    const userDocSnap = await userDocRef.get();
    
    if (!userDocSnap.exists) {
        return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }
    
    const userProfile = userDocSnap.data() as UserProfile;
    const refreshToken = userProfile.googleAuth?.refreshToken;
    
    if (!refreshToken) {
        return NextResponse.json({ error: 'Google Account not connected or refresh token is missing. Please reconnect your account.' }, { status: 400 });
    }

    const body: GoogleTasksStructure = await req.json();
    const parsedBody = GoogleTasksStructureSchema.safeParse(body);
    if (!parsedBody.success) {
        return NextResponse.json({ error: 'Invalid request body.', details: parsedBody.error.format() }, { status: 400 });
    }

    const oauth2Client = getOauth2Client(refreshToken);
    const taskListId = await createTaskListWithItems(oauth2Client, parsedBody.data);

    return NextResponse.json({ message: `Successfully created task list "${parsedBody.data.trip_task_name}" in Google Tasks.`, taskListId }, { status: 200 });

  } catch (error: any) {
    console.error("Error in /api/google-tasks/create-list:", error);
     if (error.message && error.message.includes('invalid_grant')) {
        // This specific error means the refresh token is bad.
        return NextResponse.json({ error: 'Your connection to Google has expired or been revoked. Please go to "My Account" and reconnect your Google Account.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
