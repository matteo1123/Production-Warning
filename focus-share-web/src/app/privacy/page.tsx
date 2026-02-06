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
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl font-bold text-amber-400 mb-8">Privacy Policy</h1>

                    <div className="prose prose-invert prose-amber max-w-none space-y-8">
                        <p className="text-zinc-300 text-lg">
                            Last updated: February 6, 2026
                        </p>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
                            <p className="text-zinc-300">
                                PW Focus is a browser extension designed to help you stay focused while browsing.
                                We are committed to protecting your privacy and being transparent about what data we collect.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">Data That Stays Local</h2>
                            <p className="text-zinc-300 mb-4">
                                The following data <strong>never leaves your device</strong> and is stored only in your browser:
                            </p>
                            <ul className="list-disc list-inside text-zinc-300 space-y-2">
                                <li>Your focus configurations and topic names</li>
                                <li>Links and warnings you configure</li>
                                <li>Context notes you create</li>
                                <li>Your browsing history and activity</li>
                                <li>Any personal information you enter</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">Optional Data Sharing</h2>
                            <p className="text-zinc-300 mb-4">
                                If you opt in to &quot;Help Improve PW Focus&quot;, we may collect:
                            </p>
                            <ul className="list-disc list-inside text-zinc-300 space-y-2">
                                <li>AI chat messages you send (prompts and responses)</li>
                                <li>Anonymous usage patterns (which features you use)</li>
                            </ul>
                            <p className="text-zinc-300 mt-4">
                                This data is used solely to improve the extension and is never sold or shared with third parties.
                                You can opt out at any time in the Focus Mode Settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">Shared Focuses</h2>
                            <p className="text-zinc-300">
                                When you share a focus publicly, the focus name, description, links, warnings, and context notes
                                are stored on our servers and made available to anyone with the link. Do not share focuses
                                containing sensitive or personal information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">Third-Party Services</h2>
                            <p className="text-zinc-300">
                                We use the following third-party services:
                            </p>
                            <ul className="list-disc list-inside text-zinc-300 space-y-2 mt-4">
                                <li><strong>Clerk</strong> - For authentication (if you sign in)</li>
                                <li><strong>Stripe</strong> - For payment processing (premium subscriptions)</li>
                                <li><strong>Convex</strong> - For database storage</li>
                                <li><strong>Google Gemini</strong> - For AI chat features</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
                            <p className="text-zinc-300">
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
