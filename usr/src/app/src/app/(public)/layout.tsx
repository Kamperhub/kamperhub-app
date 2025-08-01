// src/app/(public)/layout.tsx
// This layout is for public-facing pages (login, signup, landing).
// It MUST NOT include components that rely on authenticated user context (like Header with NavigationContext).

import type { ReactNode } from 'react';

export default function PublicLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            {/* The Header component (which uses NavigationContext) MUST NOT be here. */}
            {/* Public pages will have a different, possibly simpler, header or no header. */}
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
}
