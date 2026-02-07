'use client';

import Link from 'next/link';
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs';

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="text-2xl">🎯</span>
                    <span className="font-bold text-lg text-amber-400">PW Focus</span>
                </Link>

                <nav className="flex items-center gap-4">
                    <Link
                        href="/waitlist"
                        className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                    >
                        Get Extension
                    </Link>
                    <Link
                        href="/suggestions"
                        className="text-zinc-400 hover:text-white text-sm transition-colors"
                    >
                        Suggestions
                    </Link>

                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg text-sm transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9"
                                }
                            }}
                        />
                    </SignedIn>
                </nav>
            </div>
        </header>
    );
}

