"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function WaitlistPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const signup = useMutation(api.emailSignups.signup);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const result = await signup({ email });

            if (result.success) {
                if (result.alreadySignedUp) {
                    setStatus("success");
                    setMessage("You're already on the list! We'll email you when the extension is ready.");
                } else {
                    setStatus("success");
                    setMessage("You're on the list! We'll email you as soon as the extension is available.");
                }
                setEmail("");
            } else {
                setStatus("error");
                setMessage(result.error || "Something went wrong. Please try again.");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                            <span className="text-xl font-bold text-zinc-950">PW</span>
                        </div>
                        <span className="text-xl font-bold">Focus</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-16">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-4">
                            <span className="text-yellow-400">Coming Soon</span> to Chrome Web Store
                        </h1>
                        <p className="text-zinc-400 text-lg">
                            PW Focus is being reviewed by Google. Sign up to get notified the moment it's available.
                        </p>
                    </div>

                    {status === "success" ? (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                            <div className="text-4xl mb-4">✅</div>
                            <h2 className="text-xl font-semibold text-green-400 mb-2">Thanks!</h2>
                            <p className="text-zinc-300">{message}</p>
                            <button
                                onClick={() => setStatus("idle")}
                                className="mt-4 text-zinc-500 hover:text-white underline"
                            >
                                Sign up another email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all text-white placeholder-zinc-600"
                                />
                            </div>

                            {status === "error" && (
                                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === "loading" || !email}
                                className="w-full py-3 px-6 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === "loading" ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Signing up...
                                    </span>
                                ) : (
                                    "Notify Me When It's Ready"
                                )}
                            </button>

                            <p className="text-center text-sm text-zinc-500">
                                We'll only email you about the extension launch. No spam, ever.
                            </p>
                        </form>
                    )}

                    {/* Features Preview */}
                    <div className="mt-12 pt-8 border-t border-zinc-800">
                        <h3 className="text-lg font-semibold mb-4 text-center">What You'll Get</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-zinc-400">
                                <span className="text-yellow-400 mt-1">🎯</span>
                                <span>Curated focus sessions with your most important links</span>
                            </li>
                            <li className="flex items-start gap-3 text-zinc-400">
                                <span className="text-yellow-400 mt-1">⚠️</span>
                                <span>Visual warnings for production environments</span>
                            </li>
                            <li className="flex items-start gap-3 text-zinc-400">
                                <span className="text-yellow-400 mt-1">📝</span>
                                <span>Context notes attached to any website</span>
                            </li>
                            <li className="flex items-start gap-3 text-zinc-400">
                                <span className="text-yellow-400 mt-1">🤖</span>
                                <span>AI chat about your open focus tabs</span>
                            </li>
                            <li className="flex items-start gap-3 text-zinc-400">
                                <span className="text-yellow-400 mt-1">🔗</span>
                                <span>Share and import focus collections</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800 py-6">
                <div className="max-w-6xl mx-auto px-4 text-center text-zinc-500 text-sm">
                    <Link href="/privacy" className="hover:text-yellow-400 transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </footer>
        </div>
    );
}
