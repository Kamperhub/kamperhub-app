import { redirect } from 'next/navigation';

export default function RootPage() {
  // This component now acts as a server-side redirect to the main dashboard.
  // The AuthGuard component will then handle redirecting unauthenticated users to the login page.
  redirect('/dashboard');
}
