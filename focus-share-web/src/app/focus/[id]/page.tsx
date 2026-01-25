"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function FocusDetailPage() {
    const params = useParams();
    const id = params.id as Id<"shared_focuses">;

    const share = useQuery(api.shares.getShare, { id });
    const incrementViews = useMutation(api.shares.incrementViews);
    const [hasExtension, setHasExtension] = useState(false);
    const [imported, setImported] = useState(false);

    // Increment views on first load
    useEffect(() => {
        if (share) {
            incrementViews({ id });
        }
    }, [share?._id]);

    // Check if extension is installed
    useEffect(() => {
        const checkExtension = () => {
            // The extension will set this when it detects this page
            if ((window as unknown as { __focusExtensionInstalled?: boolean }).__focusExtensionInstalled) {
                setHasExtension(true);
            }
        };
        checkExtension();
        // Check again after a short delay in case extension loads after page
        const timeout = setTimeout(checkExtension, 1000);
        return () => clearTimeout(timeout);
    }, []);

    const handleImport = () => {
        if (share) {
            // Dispatch custom event for extension to catch
            const event = new CustomEvent("focus-share-import", {
                detail: {
                    name: share.name,
                    links: share.links,
                    warning: share.warning,
                    contextNotes: share.contextNotes,
                },
            });
            window.dispatchEvent(event);
            setImported(true);
        }
    };

    if (share === undefined) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (share === null) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-white mb-4">Focus Not Found</h1>
                <p className="text-zinc-400 mb-6">This focus may have been removed.</p>
                <Link
                    href="/"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
            {/* Header */}
            <header className="border-b border-amber-500/20 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
                            <span className="text-xl font-bold text-white">F</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                            Focus Share
                        </span>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Focus Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="text-sm text-zinc-500 hover:text-amber-400 transition-colors mb-4 inline-flex items-center gap-1"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to all focuses
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-2">
                        {share.name}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span>{share.links.length} links</span>
                        <span>•</span>
                        <span>{share.views} views</span>
                        <span>•</span>
                        <span>Shared {new Date(share.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Warning Section */}
                {share.warning && share.warning.enabled && (
                    <div className="mb-8 p-6 rounded-xl bg-zinc-900/40 border border-yellow-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-2xl" role="img" aria-label="Warning Emblem">
                                {
                                    {
                                        production: '⚠️', star: '⭐', heart: '❤️', fire: '🔥',
                                        warning: '⚡', skull: '💀', stop: '🛑', eyes: '👀'
                                    }[share.warning.emblem] || '⚠️'
                                }
                            </span>
                            <h2 className="text-xl font-semibold text-yellow-500">Cursor Warning Enabled</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                                <span className="block text-zinc-500 mb-1">URL Pattern</span>
                                <code className="text-zinc-300 bg-zinc-800/50 px-2 py-0.5 rounded">{share.warning.urlRegex}</code>
                            </div>
                            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                                <span className="block text-zinc-500 mb-1">Element Selector</span>
                                <code className="text-zinc-300 bg-zinc-800/50 px-2 py-0.5 rounded">{share.warning.elementRegex}</code>
                            </div>
                        </div>
                    </div>
                )}

                {/* Context Notes Section */}
                {share.contextNotes && share.contextNotes.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
                            <span>📝</span> Context Notes
                        </h2>
                        <div className="grid gap-3">
                            {share.contextNotes.map((note, index) => (
                                <div key={index} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
                                            {note.urlPattern}
                                        </span>
                                    </div>
                                    <p className="text-zinc-300 whitespace-pre-wrap">{note.note}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Import Button */}
                <div className="mb-8 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    {imported ? (
                        <div className="flex items-center gap-3 text-green-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-semibold">Imported to your extension!</span>
                        </div>
                    ) : hasExtension ? (
                        <button
                            onClick={handleImport}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20"
                        >
                            Import to PW Focus Extension
                        </button>
                    ) : (
                        <div className="text-center">
                            <p className="text-zinc-400 mb-3">Install the extension to import this focus</p>
                            <a
                                href="#"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-semibold rounded-lg transition-all"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0112 6.545h10.691A12 12 0 0012 0zM1.931 5.47A11.943 11.943 0 000 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 01-6.865-2.999L1.931 5.47zm13.382 2.166L12.36 12.96a5.454 5.454 0 016.864 2.998h5.346A11.943 11.943 0 0024 12c0-2.42-.72-4.67-1.95-6.556H15.313z" />
                                </svg>
                                Get PW Focus
                            </a>
                        </div>
                    )}
                </div>

                {/* Links List */}
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-amber-400 mb-4">Links in this focus</h2>
                    {share.links.map((link, index) => (
                        <a
                            key={index}
                            href={link.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/50 transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                                        {link.key}
                                    </h3>
                                    <p className="text-sm text-zinc-500 truncate mt-1">
                                        {link.value}
                                    </p>
                                </div>
                                <svg
                                    className="w-5 h-5 text-zinc-600 group-hover:text-amber-400 transition-colors ml-4 flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                </svg>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Share FocusData for extension to read */}
                <script
                    id="focus-share-data"
                    type="application/json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            name: share.name,
                            links: share.links,
                            warning: share.warning,
                            contextNotes: share.contextNotes,
                        }),
                    }}
                />
            </main>
        </div>
    );
}
