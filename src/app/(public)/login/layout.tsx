// src/app/(public)/login/layout.tsx
import type { ReactNode } from 'react';

// This layout ensures the login page is rendered correctly within the public scope.
export default function LoginLayout({
    children,
}: {
    children: ReactNode;
}) {
    return <>{children}</>;
}
