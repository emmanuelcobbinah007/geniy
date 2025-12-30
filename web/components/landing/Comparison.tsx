"use client"

import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { X, Check, ArrowRight } from "lucide-react"

export function Comparison() {
  return (
    <section id="comparison" className="py-24 relative transition-colors duration-300 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-50/50 to-transparent dark:via-zinc-900/50" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="outline" className="mb-4 text-violet-600 border-violet-500/30 bg-violet-500/10 dark:text-violet-400">
              The Difference
            </Badge>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold font-display text-foreground mb-6"
          >
            From chaos to clarity
          </motion.h2>
        </div>

        {/* Before / After Cards */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0 relative">
            
            {/* Before Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="p-8 md:p-10 rounded-2xl md:rounded-r-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <X className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Before Geniy</span>
                </div>
                
                <ul className="space-y-4">
                  {[
                    "Weeks building surveys manually",
                    "Spreadsheets for competitor tracking",
                    "Guessing which assumptions to test",
                    "Data scattered across 5+ tools",
                    "Analysis paralysis",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Arrow (Desktop) */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-12 h-12 rounded-full bg-violet-600 dark:bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* After Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative"
            >
              <div className="p-8 md:p-10 rounded-2xl md:rounded-l-none bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 dark:border-violet-500/30">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <span className="text-sm font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">With Geniy</span>
                </div>
                
                <ul className="space-y-4">
                  {[
                    "Surveys generated in minutes",
                    "Competitors tracked 24/7 automatically",
                    "Clear hypotheses to validate first",
                    "Everything in one dashboard",
                    "Decisive action, every time",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-foreground font-medium">
                      <Check className="w-5 h-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  )
}
