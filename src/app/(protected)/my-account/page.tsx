// src/app/(protected)/my-account/page.tsx
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertTriangle, UserCircle, Edit3, Save, XCircle } from 'lucide-react';
import { MyAccountClient } from '@/components/features/account/MyAccountClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const MyAccountLoadingSkeleton = () => (
    <div className="space-y-8">
        <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-64" />
            </div>
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
    </div>
);


export default function MyAccountPage() {
    const { user, userProfile, isAuthLoading, profileStatus, profileError } = useAuth();
    
    if (isAuthLoading || profileStatus === 'LOADING') {
        return <MyAccountLoadingSkeleton />;
    }

    if (profileStatus === 'ERROR') {
         return (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Profile</AlertTitle>
                <AlertDescription>{profileError || "An unknown error occurred while fetching your profile."}</AlertDescription>
            </Alert>
         );
    }
    
    if (!user || !userProfile) {
        return (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Not Authenticated</AlertTitle>
                <AlertDescription>You must be logged in to view this page.</AlertDescription>
            </Alert>
        );
    }

    return <MyAccountClient user={user} userProfile={userProfile} />;
}
