import type { Metadata } from "next"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { MeshBackground } from "@/components/ui/mesh-background"
import { PricingWrapper as Pricing } from "@/components/landing/PricingWrapper"

export const metadata: Metadata = {
    title: "Pricing | Geniy - Affordable AI Market Research",
    description: "Flexible pricing plans for businesses of all sizes. Start free, upgrade when you're ready. No hidden fees, cancel anytime.",
    openGraph: {
        title: "Pricing | Geniy",
        description: "Flexible pricing plans for AI-powered market research",
        type: "website",
    }
}

export default function PricingPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <MeshBackground />
            <Navbar />
            
            {/* Hero */}
            <section className="pt-32 pb-12 px-6 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Start free. Upgrade when you need more power. No surprises.
                    </p>
                </div>
            </section>

            {/* Pricing Component */}
            <Pricing />

            {/* FAQ Section */}
            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                            <h3 className="font-semibold text-lg mb-2">Can I try Geniy for free?</h3>
                            <p className="text-zinc-400">Yes! Our Free plan includes 1 campaign, 50 responses, and core AI features. No credit card required.</p>
                        </div>
                        
                        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                            <h3 className="font-semibold text-lg mb-2">Can I upgrade or downgrade anytime?</h3>
                            <p className="text-zinc-400">Absolutely. Change your plan anytime from your settings. Upgrades take effect immediately, downgrades at the end of your billing cycle.</p>
                        </div>
                        
                        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                            <h3 className="font-semibold text-lg mb-2">What happens when I hit my response limit?</h3>
                            <p className="text-zinc-400">You'll be notified before you reach your limit. Existing surveys keep working, but new responses pause until you upgrade or your limit resets.</p>
                        </div>
                        
                        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                            <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
                            <p className="text-zinc-400">We offer a 14-day money-back guarantee. If Geniy isn't right for you, just contact us for a full refund.</p>
                        </div>
                        
                        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50">
                            <h3 className="font-semibold text-lg mb-2">Is my data secure?</h3>
                            <p className="text-zinc-400">Very. We use industry-standard encryption, and your survey data is never shared or sold. Read our Privacy Policy for full details.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
