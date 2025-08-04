// src/app/(public)/layout.tsx
// This layout is for public-facing pages (login, signup, landing).
import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { NavigationContext } from '@/components/layout/AppShell';

export default function PublicLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
