"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { MeshBackground } from "@/components/ui/mesh-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, MapPin, Send, Check } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        // Simulate submission (replace with actual API call)
        await new Promise(r => setTimeout(r, 1500))
        
        setIsSubmitting(false)
        setIsSubmitted(true)
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white">
            <MeshBackground />
            <Navbar />
            
            {/* Hero */}
            <section className="pt-32 pb-12 px-6 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
                        Get in touch
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Have a question, feedback, or just want to say hi? We'd love to hear from you.
                    </p>
                </div>
            </section>

            {/* Contact Form + Info */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12">
                    {/* Form */}
                    <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur">
                        {isSubmitted ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Check className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                                <p className="text-zinc-400 mb-6">We'll get back to you within 24 hours.</p>
                                <Button onClick={() => setIsSubmitted(false)} variant="outline">
                                    Send Another Message
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Your Name</label>
                                    <Input 
                                        required
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email Address</label>
                                    <Input 
                                        required
                                        type="email"
                                        placeholder="john@company.com"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Subject</label>
                                    <Input 
                                        required
                                        placeholder="How can we help?"
                                        value={formData.subject}
                                        onChange={e => setFormData({...formData, subject: e.target.value})}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Message</label>
                                    <Textarea 
                                        required
                                        rows={5}
                                        placeholder="Tell us more..."
                                        value={formData.message}
                                        onChange={e => setFormData({...formData, message: e.target.value})}
                                        className="bg-zinc-800 border-zinc-700"
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-violet-600 hover:bg-violet-700"
                                >
                                    {isSubmitting ? "Sending..." : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Other ways to reach us</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <Mail className="w-6 h-6 text-violet-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Email</h3>
                                    <p className="text-zinc-400">hello@geniy.io</p>
                                    <p className="text-zinc-400">support@geniy.io</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-6 h-6 text-violet-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Live Chat</h3>
                                    <p className="text-zinc-400">Chat with us in-app during business hours (Mon-Fri, 9am-6pm GMT)</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <MapPin className="w-6 h-6 text-violet-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Office</h3>
                                    <p className="text-zinc-400">Aurora Software Labs</p>
                                    <p className="text-zinc-400">Accra, Ghana</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-zinc-800">
                            <h3 className="font-semibold mb-4">Looking for support?</h3>
                            <p className="text-zinc-400 mb-4">
                                Check out our documentation and FAQ for quick answers to common questions.
                            </p>
                            <Link href="/pricing#faq">
                                <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                                    View FAQ
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}
