"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

export default function SuggestionsPage() {
    const [type, setType] = useState<string>("feature");
    const [content, setContent] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [error, setError] = useState("");

    const submitSuggestion = useMutation(api.suggestions.submit);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        setError("");

        try {
            await submitSuggestion({
                type,
                content,
                email: email || undefined,
            });
            setStatus("success");
            setContent("");
            setEmail("");
        } catch (err) {
            setStatus("error");
            setError(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
            {/* Header */}
            <header className="border-b border-amber-500/20 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                            <span className="text-xl font-bold text-white">F</span>
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                            PW Focus
                        </h1>
                    </Link>
                    <Link
                        href="/"
                        className="px-4 py-2 text-zinc-400 hover:text-amber-400 font-semibold transition-colors"
                    >
                        ← Back
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold mb-2 text-white">
                    💡 Suggestions & Feedback
                </h2>
                <p className="text-zinc-400 mb-8">
                    Help us improve PW Focus! Share your ideas, report bugs, or suggest new features.
                </p>

                {status === "success" ? (
                    <div className="p-6 rounded-xl bg-green-900/30 border border-green-500/30 text-center">
                        <div className="text-4xl mb-4">✅</div>
                        <h3 className="text-xl font-semibold text-green-400 mb-2">
                            Thank you for your feedback!
                        </h3>
                        <p className="text-zinc-400 mb-4">
                            We appreciate you taking the time to help us improve PW Focus.
                        </p>
                        <button
                            onClick={() => setStatus("idle")}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                        >
                            Submit Another
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Suggestion Type */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                What type of feedback?
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { value: "feature", label: "🚀 Feature", desc: "New idea" },
                                    { value: "bug", label: "🐛 Bug", desc: "Something broken" },
                                    { value: "improvement", label: "✨ Improvement", desc: "Make it better" },
                                    { value: "other", label: "💬 Other", desc: "General feedback" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setType(option.value)}
                                        className={`p-3 rounded-lg border transition-all text-left ${type === option.value
                                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                                            }`}
                                    >
                                        <div className="font-medium">{option.label}</div>
                                        <div className="text-xs opacity-70">{option.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Your suggestion
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Describe your idea, bug, or feedback in detail..."
                                rows={6}
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none"
                                required
                                minLength={10}
                                maxLength={2000}
                            />
                            <div className="text-xs text-zinc-500 mt-1 text-right">
                                {content.length}/2000
                            </div>
                        </div>

                        {/* Email (optional) */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Email (optional)
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                Only used if we need to follow up on your suggestion.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={status === "submitting" || content.length < 10}
                            className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:from-zinc-600 disabled:to-zinc-600 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none"
                        >
                            {status === "submitting" ? "Submitting..." : "Submit Feedback"}
                        </button>
                    </form>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
                <p>Powered by PW Focus</p>
            </footer>
        </div>
    );
}
