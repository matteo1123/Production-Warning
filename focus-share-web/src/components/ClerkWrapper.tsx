'use client';

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Dynamic import for ClerkProvider - only loaded when Clerk is configured
const ClerkProvider = dynamic(
    () => import('@clerk/nextjs').then((mod) => mod.ClerkProvider),
    { ssr: false }
);

interface ClerkWrapperProps {
    children: ReactNode;
}

export function ClerkWrapper({ children }: ClerkWrapperProps) {
    // Only wrap with ClerkProvider if Clerk is configured
    if (isClerkConfigured) {
        return <ClerkProvider>{children}</ClerkProvider>;
    }

    // Return children unwrapped if Clerk is not configured
    return <>{children}</>;
}
