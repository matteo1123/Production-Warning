// Force this page to be dynamically rendered, not statically prerendered
// This prevents Clerk initialization errors during build
export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-amber-400 mb-4">404</h1>
                <h2 className="text-2xl text-white mb-2">Page Not Found</h2>
                <p className="text-zinc-400 mb-6">
                    The page you&apos;re looking for doesn&apos;t exist.
                </p>
                <a
                    href="/"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg transition-colors"
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
