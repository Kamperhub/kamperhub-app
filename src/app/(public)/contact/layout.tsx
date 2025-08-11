// src/app/(public)/contact/layout.tsx
import type { ReactNode } from 'react';

// This layout ensures the contact page is rendered correctly within the public scope.
export default function ContactLayout({
    children,
}: {
    children: ReactNode;
}) {
    return <>{children}</>;
}
