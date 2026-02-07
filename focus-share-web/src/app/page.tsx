"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { Header } from "../components/Header";
import { useEffect, useState } from "react";

export default function Home() {
  const shares = useQuery(api.shares.listShares, { limit: 50 });
  const [hasExtension, setHasExtension] = useState(false);

  // Check if extension is installed by looking for DOM marker
  useEffect(() => {
    const checkExtension = () => {
      const marker = document.getElementById('pw-focus-extension-installed');
      if (marker) {
        setHasExtension(true);
      }
    };
    // Check immediately
    checkExtension();
    // Check again after delays since content script may load after page
    const timeout1 = setTimeout(checkExtension, 500);
    const timeout2 = setTimeout(checkExtension, 1500);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <Header />
      <div className="h-16" /> {/* Spacer for fixed header */}

      {/* Hero */}
      < section className="max-w-6xl mx-auto px-6 py-16 text-center" >
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
          Curated Focus Sessions
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
          Discover link collections shared by the community or share your own focused browsing sessions with others.
        </p>
      </section >

      {/* Focus List */}
      < section className="max-w-6xl mx-auto px-6 pb-16" >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-amber-400">Recent Shares</h3>
          <span className="text-sm text-zinc-500">
            {shares?.length ?? 0} focuses shared
          </span>
        </div>

        {
          !shares ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl bg-zinc-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : shares.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <p className="text-lg mb-2">No focuses shared yet</p>
              <p>Be the first to share your focus session!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shares.map((share) => (
                <Link
                  key={share._id}
                  href={`/focus/${share._id}`}
                  className="group p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {share.name}
                    </h4>
                    <span className="text-xs text-zinc-500 whitespace-nowrap ml-2">
                      {share.views} views
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {share.links.slice(0, 3).map((link, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-md truncate max-w-[120px]"
                      >
                        {link.key}
                      </span>
                    ))}
                    {share.links.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-zinc-800 text-zinc-500 rounded-md">
                        +{share.links.length - 3} more
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {share.links.length} links •{" "}
                    {new Date(share.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )
        }
      </section >

      {/* Get Extension Section */}
      {!hasExtension && (
        <section id="get-extension" className="bg-zinc-900/50 border-t border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-16 text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">
              Get PW Focus Extension
            </h3>
            <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
              The Chrome extension is currently pending review. Join the waitlist to be notified the moment it's available.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/waitlist"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Join the Waitlist
              </Link>
              <span className="text-sm text-zinc-500">
                Launching in ~1 week
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      < footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-500" >
        <div className="flex items-center justify-center gap-4 mb-2">
          <Link href="/suggestions" className="hover:text-amber-400 transition-colors">
            💡 Suggestions
          </Link>
          <span>•</span>
          <a href="#get-extension" className="hover:text-amber-400 transition-colors">
            Get Extension
          </a>
        </div>
        <p>Powered by PW Focus</p>
      </footer >
    </div >
  );
}
