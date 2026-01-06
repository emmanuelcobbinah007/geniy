import type { Metadata } from "next"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { MeshBackground } from "@/components/ui/mesh-background"
import { Button } from "@/components/ui/button"
import { 
    Brain, Target, LineChart, MessageSquare, Shield, Zap, 
    BarChart, Users, Clock, Layout, Sparkles, Globe 
} from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
    title: "Features | Geniy - AI-Powered Market Research Platform",
    description: "Discover all the features that make Geniy the smartest market research platform. AI survey generation, competitor tracking, gap analysis, and real-time insights.",
    openGraph: {
        title: "Features | Geniy",
        description: "AI-powered market research tools for modern businesses",
        type: "website",
    }
}

const features = [
    {
        icon: Brain,
        title: "AI-Powered Survey Generation",
        description: "Describe your research goals, and Geniy generates intelligent surveys with branching logic, the right question types, and professional phrasing.",
        color: "violet"
    },
    {
        icon: Target,
        title: "Competitor Intelligence",
        description: "Track competitors automatically. Get alerts when they update their website, pricing, or messaging. Know what they're doing before your customers do.",
        color: "blue"
    },
    {
        icon: LineChart,
        title: "Gap Analysis",
        description: "AI identifies opportunities you're missing. See where competitors are winning and get actionable recommendations to close the gap.",
        color: "emerald"
    },
    {
        icon: MessageSquare,
        title: "Geniy Chat",
        description: "Have natural conversations about your research. Ask questions, get insights, and explore your data with an AI that understands your business context.",
        color: "amber"
    },
    {
        icon: Shield,
        title: "Context-Aware Research",
        description: "Geniy learns your business. Upload your website, describe your product, and every survey is tailored to your unique market position.",
        color: "rose"
    },
    {
        icon: Zap,
        title: "Real-Time Response Analysis",
        description: "Watch responses come in live. AI extracts themes, sentiment, and key insights as people answer your surveys.",
        color: "orange"
    },
    {
        icon: Layout,
        title: "Beautiful Survey Themes",
        description: "Choose from Focus, Book, Deck, and Terminal layouts. Customize colors, fonts, and branding for surveys that match your brand.",
        color: "cyan"
    },
    {
        icon: Users,
        title: "Team Collaboration",
        description: "Invite team members to workspaces. Share insights, assign tasks, and collaborate on research projects together.",
        color: "pink"
    },
    {
        icon: Clock,
        title: "Proactive Digests",
        description: "Daily or weekly briefings delivered to Slack or Discord. Know what's happening without logging in.",
        color: "indigo"
    },
    {
        icon: BarChart,
        title: "Advanced Analytics",
        description: "Track completion rates, time-to-complete, device breakdown, and response quality. Know exactly how your surveys perform.",
        color: "teal"
    },
    {
        icon: Sparkles,
        title: "Survey Gamification",
        description: "Milestone celebrations, progress tracking, and confetti bursts. Make surveys fun and boost completion rates.",
        color: "yellow"
    },
    {
        icon: Globe,
        title: "Integrations",
        description: "Connect with Slack, Discord, Notion, Zapier, and more. Bring insights into the tools your team already uses.",
        color: "purple"
    },
]

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <MeshBackground />
            <Navbar />
            
            {/* Hero */}
            <section className="pt-32 pb-20 px-6 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
                        Everything you need for smarter market research
                    </h1>
                    <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
                        From AI-generated surveys to real-time competitor tracking, Geniy gives you the tools to understand your market deeply.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/auth">
                            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8">
                                Start Free Trial
                            </Button>
                        </Link>
                        <Link href="/pricing">
                            <Button size="lg" variant="outline" className="text-lg px-8 border-zinc-700 hover:bg-zinc-800">
                                View Pricing
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <div 
                                key={i}
                                className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur hover:border-zinc-700 transition-colors group"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-6 h-6 text-${feature.color}-500`} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Ready to transform your market research?
                    </h2>
                    <p className="text-zinc-400 text-lg mb-8">
                        Join thousands of businesses using Geniy to understand their customers better.
                    </p>
                    <Link href="/auth">
                        <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8">
                            Get Started Free
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    )
}
