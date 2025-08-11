import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/server/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { auth, error: adminError } = getFirebaseAdmin();
  if (adminError || !auth) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    const options = {
      name: '__session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    cookies().set(options);

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Session login error:', error);
    return NextResponse.json({ error: 'Failed to create session.', details: error.message }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    cookies().set('__session', '', { maxAge: -1, path: '/' });
    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Session logout error:', error);
    return NextResponse.json({ error: 'Failed to clear session.' }, { status: 500 });
  }
}
