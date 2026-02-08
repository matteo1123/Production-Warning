import { Header } from "@/components/Header";

export const metadata = {
    title: "Privacy Policy - PW Focus",
    description: "Privacy policy for the PW Focus browser extension and website",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-zinc-950">
            <Header />
            <main className="pt-24 pb-16 px-4">
                <div className="max-w-3xl mx-auto text-zinc-300">
                    <h1 className="text-4xl font-bold text-amber-400 mb-8">Privacy Policy</h1>

                    <div className="prose prose-invert prose-amber max-w-none space-y-8">
                        <section>
                            <p className="text-lg font-medium text-white">Effective Date: February 8, 2026</p>
                            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Overview</h2>
                            <p>
                                PW Focus ("we", "our", or "the extension") is committed to protecting your privacy.
                                This Privacy Policy explains how we collect, use, and safeguard your information when you use our Chrome extension.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Information We Collect</h2>

                            <h3 className="text-xl font-semibold text-white mt-6 mb-3">1. Local Data (Stored on Your Device)</h3>
                            <p className="mb-4">
                                PW Focus stores the following data <strong>locally</strong> on your device using Chrome's secure storage API:
                            </p>
                            <ul className="list-disc list-inside space-y-2 mb-4">
                                <li><strong>Focus configurations</strong>: Names, descriptions, and link collections you create</li>
                                <li><strong>Warning rules</strong>: URL patterns and element selectors for cursor warnings</li>
                                <li><strong>Context notes</strong>: Notes you attach to specific URLs</li>
                                <li><strong>Settings</strong>: Your preferences including data sharing consent</li>
                            </ul>
                            <p>This data never leaves your device unless you explicitly choose to share a focus or use the AI features.</p>

                            <h3 className="text-xl font-semibold text-white mt-6 mb-3">2. Data Shared with External Services</h3>

                            <h4 className="text-lg font-medium text-amber-400 mt-4 mb-2">AI Chat Feature (Powered by Google Gemini)</h4>
                            <p className="mb-2">When you use the "Ask Focus" chat feature:</p>
                            <ul className="list-disc list-inside space-y-2 mb-4">
                                <li><strong>Page content</strong> (text only) from your open focus tabs is extracted and sent to our backend (hosted on <strong>Convex</strong>).</li>
                                <li>This data is then forwarded to <strong>Google Gemini</strong> (the AI model) to generate an answer.</li>
                                <li><strong>Data Retention</strong>:
                                    <ul className="list-disc list-inside ml-6 mt-1">
                                        <li>If you <strong>opt-in</strong> to data collection: Your questions and page context may be stored to improve the service.</li>
                                        <li>If you <strong>opt-out</strong>: Your data is processed ephemerally and not persisted after the answer is generated.</li>
                                    </ul>
                                </li>
                            </ul>

                            <h4 className="text-lg font-medium text-amber-400 mt-4 mb-2">Focus Sharing</h4>
                            <p className="mb-2">When you click "Share Active Focus":</p>
                            <ul className="list-disc list-inside space-y-2 mb-4">
                                <li>Focus name, links, and context notes are uploaded to our backend (<strong>Convex</strong>).</li>
                                <li>A <strong>publicly accessible link</strong> (with a unique ID) is generated. Anyone with this link can view and import your focus.</li>
                                <li><strong>Privacy Warning</strong>: Do not share focuses that contain private URLs or sensitive notes if you do not want them to be accessible to others who have the link.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mt-8 mb-4">What We Don't Collect</h2>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Your browsing history (outside of active focus tabs when using AI)</li>
                                <li>Passwords or authentication credentials</li>
                                <li>Financial information</li>
                                <li>Personal identifiers (name, email, etc.) unless provided for account creation</li>
                                <li>Cookies or session tokens that would allow us to impersonate you</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mt-8 mb-4">Contact</h2>
                            <p>
                                If you have questions about this privacy policy, please contact us at{" "}
                                <a href="mailto:matt@hirematt.dev" className="text-amber-400 hover:text-amber-300">
                                    matt@hirematt.dev
                                </a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
