'use client';

import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

// Check if Clerk is configured
const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Dynamic import for SignUp
const SignUp = dynamic(
    () => import('@clerk/nextjs').then((mod) => mod.SignUp),
    {
        ssr: false,
        loading: () => (
            <div className="min-h-screen flex items-center justify-center bg-zinc-950">
                <div className="text-zinc-400">Loading...</div>
            </div>
        )
    }
);

export default function SignUpPage() {
    // Redirect to home if Clerk not configured
    if (!isClerkConfigured) {
        redirect('/');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <SignUp
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "bg-zinc-900 border border-zinc-800",
                        headerTitle: "text-white",
                        headerSubtitle: "text-zinc-400",
                        socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700",
                        formFieldLabel: "text-zinc-300",
                        formFieldInput: "bg-zinc-800 border-zinc-700 text-white",
                        footerActionLink: "text-amber-400 hover:text-amber-300",
                        formButtonPrimary: "bg-amber-500 hover:bg-amber-400 text-zinc-900",
                    }
                }}
            />
        </div>
    );
}
