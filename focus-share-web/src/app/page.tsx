"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

export default function Home() {
  const shares = useQuery(api.shares.listShares, { limit: 50 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">F</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              PW Focus
            </h1>
          </div>
          <a
            href="https://chromewebstore.google.com/detail/production-warning/gijcnlfiljejcgbcjnkpnbefjngcgapd"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg transition-colors"
          >
            Get Extension
          </a>
        </div>
      </header>

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
      < section id="get-extension" className="bg-zinc-900/50 border-t border-zinc-800" >
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h3 className="text-2xl font-bold mb-4 text-white">
            Get PW Focus Extension
          </h3>
          <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
            Install the browser extension to import focuses directly and create your own curated browsing sessions.
          </p>
          <a
            href="https://chromewebstore.google.com/detail/production-warning/gijcnlfiljejcgbcjnkpnbefjngcgapd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-semibold rounded-lg transition-all shadow-lg shadow-amber-500/20"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0112 6.545h10.691A12 12 0 0012 0zM1.931 5.47A11.943 11.943 0 000 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 01-6.865-2.999L1.931 5.47zm13.382 2.166L12.36 12.96a5.454 5.454 0 016.864 2.998h5.346A11.943 11.943 0 0024 12c0-2.42-.72-4.67-1.95-6.556H15.313z" />
            </svg>
            Add to Chrome
          </a>
        </div>
      </section >

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
