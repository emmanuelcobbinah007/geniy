"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Radar, Compass, ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 relative overflow-hidden transition-colors duration-300">


      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-6 text-violet-600 border-violet-500/30 bg-violet-500/10 dark:text-violet-400">
              How It Works
            </Badge>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold font-display text-foreground mb-6"
          >
            One engine. Total clarity.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400"
          >
            Stop juggling tools. Start making decisions.
          </motion.p>
        </div>

        {/* Bento Grid Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Talk - Large Left Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:row-span-2"
            >
              <Card className="h-full p-8 md:p-10 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl overflow-hidden relative group hover:bg-white/15 dark:hover:bg-white/10 hover:border-violet-500/30 transition-all duration-500">
                
                {/* Step Indicator */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-xl" />
                    <div className="relative p-1 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                      <Image src="/gen_states/gen_consultant.png" alt="gen_consultant" width={48} height={48}/>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Step 01</span>
                  </div>
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-6">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      Tell Geniy about <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                        your business
                      </span>
                    </h3>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Share your pitch deck, notes, or just explain your idea. Geniy listens, asks the right questions, and learns what makes your startup unique.
                    </p>
                  </div>

                  {/* Visual: Chat Preview */}
                  <div className="mt-8 p-4 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                        <Image src="/gen_states/gen_consultant.png" alt="gen_consultant" width={48} height={48}/>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Geniy</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          "Tell me about your target customer. Who struggles with this problem the most?"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Card 2: Discover - Top Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <Card className="h-full p-8 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl overflow-hidden relative group hover:bg-white/15 dark:hover:bg-white/10 hover:border-fuchsia-500/30 transition-all duration-500">
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative p-1 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                      <Image src="/gen_states/gen_thinking.png" alt="gen_thinking" width={48} height={48}/>
                    </div>
                  <span className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400">Step 02</span>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Let Geniy do the legwork
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Geniy builds custom surveys, tracks your competitors, and gathers the signals you need — so you don't have to.
                </p>

                {/* Mini Visual */}
                <div className="mt-6 flex gap-2">
                  {["Surveys", "Competitors", "Signals"].map((tag, i) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Card 3: Decide - Bottom Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="h-full p-8 bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-xl overflow-hidden relative group hover:bg-white/15 dark:hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-500">
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative p-1 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <Image src="/gen_states/gen_bulb.png" alt="gen_bulb" width={48} height={48}/>
                    </div>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Step 03</span>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-3">
                  Get honest, clear advice
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  No fluff. No jargon. Geniy tells you what the data means and what you should do next — like a co-founder who's done the research.
                </p>

                {/* CTA Arrow */}
                <div className="mt-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium group-hover:gap-4 transition-all">
                  <span className="text-sm">Know your next move</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </motion.div>

          </div>
        </div>

        
      </div>
    </section>
  )
}
