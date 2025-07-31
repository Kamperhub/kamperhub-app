import { Header } from '@/components/layout/Header';
import type { ReactNode } from 'react';

export default function PublicLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
}
