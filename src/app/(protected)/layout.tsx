"use client";

import { AppShell } from './AppShell';
import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/layout/AuthGuard';

export default function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
