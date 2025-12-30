"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"

export function Waitlist() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      setEmail("")
    }, 1500)
  }

  return (
    <section id="waitlist" className="py-24 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-zinc-950">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.1)_0%,transparent_50%)]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full border border-violet-500/30 bg-violet-500/10 text-sm font-medium text-violet-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Founders are shipping faster
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold font-display text-white mb-6 tracking-tight"
          >
            Stop second-guessing. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
              Start deciding.
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto"
          >
            Every week you delay is another week of uncertainty. Get clarity now.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">You're on the list!</h3>
                <p className="text-zinc-400">We'll notify you as soon as a spot opens up.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input 
                  type="email" 
                  placeholder="enter your@email.com" 
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-violet-500/50 focus:ring-violet-500/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={loading}
                  className="h-12 px-8 bg-violet-600 hover:bg-violet-700 text-white font-medium"
                >
                  {loading ? "Starting..." : "Get Started Free"}
                  {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            )}
          </motion.div>

          <div className="mt-12 flex items-center justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Social Proof Logs (Optional Placeholder) */}
            <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Trusted by founders from</div>
            {/* Add logos here if needed */}
          </div>
        </div>
      </div>
    </section>
  )
}
