
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import { z, ZodError } from 'zod';

const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

export async function POST(req: NextRequest) {
  const { firestore, error: adminError } = getFirebaseAdmin();
  if (adminError || !firestore) {
    console.error('API Error: Firebase Admin SDK failed to initialize.', adminError);
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const parsedData = contactFormSchema.parse(body);

    const submission = {
      ...parsedData,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    await firestore.collection('contactSubmissions').add(submission);

    return NextResponse.json({ message: 'Message sent successfully! We will get back to you shortly.' }, { status: 200 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid data provided.', details: error.format() }, { status: 400 });
    }
    console.error('Error in /api/contact:', error);
    return NextResponse.json({ error: 'Failed to send message.', details: error.message }, { status: 500 });
  }
}
