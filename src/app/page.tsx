// src/app/page.tsx

import { getSession } from '@/lib/server/server-session';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  return null;
}
