import type { Metadata } from "next"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { MeshBackground } from "@/components/ui/mesh-background"
import { Button } from "@/components/ui/button"
import { Lightbulb, Target, Heart, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata: Metadata = {
    title: "About Us | Geniy - The Story Behind AI Market Research",
    description: "Meet the team building the future of market research. Learn about our mission to make AI-powered research accessible to every business.",
    openGraph: {
        title: "About Geniy",
        description: "The story behind AI-powered market research",
        type: "website",
    }
}

const values = [
    {
        icon: Lightbulb,
        title: "Innovation First",
        description: "We push the boundaries of what's possible with AI to give you research superpowers."
    },
    {
        icon: Target,
        title: "Customer Obsessed",
        description: "Every feature we build starts with understanding what our users actually need."
    },
    {
        icon: Heart,
        title: "Radically Simple",
        description: "Powerful doesn't have to mean complicated. We make complex things feel effortless."
    },
    {
        icon: Zap,
        title: "Speed Matters",
        description: "In business, timing is everything. We help you move faster than the competition."
    }
]

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <MeshBackground />
            <Navbar />
            
            {/* Hero */}
            <section className="pt-32 pb-20 px-6 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
                        Making market research intelligent
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        We're on a mission to give every business the research capabilities of a Fortune 500 company.
                    </p>
                </div>
            </section>

            {/* Story */}
            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">Our Story</h2>
                    <div className="space-y-6 text-lg text-zinc-400 leading-relaxed">
                        <p>
                            Geniy was born from frustration. We watched brilliant entrepreneurs make critical decisions 
                            based on gut feelings because proper market research was too expensive, too slow, or too complicated.
                        </p>
                        <p>
                            Traditional research tools were built for analysts, not founders. Survey platforms felt like 
                            they hadn't evolved since 2010. And getting real competitive intelligence? That required 
                            expensive agencies or endless manual tracking.
                        </p>
                        <p>
                            We knew AI could change this. Not by replacing human insight, but by amplifying it. By 
                            handling the tedious parts—writing surveys, tracking competitors, analyzing responses—so 
                            you can focus on what matters: understanding your customers and building products they love.
                        </p>
                        <p>
                            Today, Geniy helps businesses around the world make smarter decisions faster. 
                            And we're just getting started.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">What We Believe</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {values.map((value, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <value.icon className="w-6 h-6 text-violet-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                                    <p className="text-zinc-400">{value.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team/Company */}
            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6">Built by Aurora Software Labs</h2>
                    <p className="text-zinc-400 text-lg mb-8">
                        We're a team of engineers, designers, and researchers passionate about making AI accessible. 
                        Based in Accra, Ghana, we're building world-class software for global businesses.
                    </p>
                    <div className="flex justify-center items-center gap-8">
                        <Image 
                            src="/aurora_logo.png" 
                            alt="Aurora Software Labs" 
                            width={120} 
                            height={40}
                            className="opacity-80 hover:opacity-100 transition-opacity"
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6 border-t border-zinc-800">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Ready to work smarter?
                    </h2>
                    <p className="text-zinc-400 text-lg mb-8">
                        Join the businesses already using Geniy to understand their markets better.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/auth">
                            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8">
                                Get Started Free
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button size="lg" variant="outline" className="text-lg px-8 border-zinc-700 hover:bg-zinc-800">
                                Contact Us
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
