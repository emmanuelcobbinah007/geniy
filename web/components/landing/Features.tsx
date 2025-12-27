"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitMerge, LineChart, Zap, FileText, Target, Users, Globe } from "lucide-react"
import { motion } from "framer-motion"

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge variant="outline" className="mb-4 text-violet-600 border-violet-500/30 bg-violet-500/10 dark:text-violet-400">
            The Core Engine
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-6">
            More than just a form builder. <br />
            <span className="text-zinc-500 dark:text-zinc-400">A complete research team in a box.</span>
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-500">
            Geniy replaces the fragmented stack of Typeform, Miro, and Excel with a single, intelligent platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
          
          {/* Feature 1: AI Dynamic Surveys (The Engine) - Spans 7 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="md:col-span-7"
          >
            <Card className="h-full overflow-hidden glass-card shadow-sm hover:shadow-lg transition-all group border-zinc-200/50 dark:border-zinc-800/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    <GitMerge className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">The Engine</Badge>
                </div>
                <CardTitle className="text-2xl text-foreground mb-3">AI Dynamic Surveys</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-base mb-8">
                  Upload your context, and Geniy generates a Typeform-style interface that branches and adapts in real-time. No manual logic mapping required.
                </CardDescription>
                
                {/* Visual: Logic Tree */}
                <div className="mt-auto relative h-48 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden">
                   <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px]" />
                   <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 shadow-sm">
                        Q1: What is your biggest challenge?
                      </div>
                      <div className="flex w-full justify-center gap-12">
                         <div className="h-8 w-px bg-zinc-300 dark:bg-zinc-700 -rotate-45 origin-top" />
                         <div className="h-8 w-px bg-zinc-300 dark:bg-zinc-700 rotate-45 origin-top" />
                      </div>
                      <div className="flex w-full justify-center gap-8">
                         <div className="px-3 py-1.5 rounded bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-600 dark:text-violet-300">
                           Pricing &rarr; Q2a: Budget?
                         </div>
                         <div className="px-3 py-1.5 rounded bg-fuchsia-500/10 border border-fuchsia-500/20 text-[10px] text-fuchsia-600 dark:text-fuchsia-300">
                           Features &rarr; Q2b: Priority?
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Feature 2: Automated Research Plans (The Consultant) - Spans 5 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="md:col-span-5"
          >
            <Card className="h-full overflow-hidden glass-card shadow-sm hover:shadow-lg transition-all group border-zinc-200/50 dark:border-zinc-800/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Target className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">The Consultant</Badge>
                </div>
                <CardTitle className="text-2xl text-foreground mb-3">Instant Research Plans</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-base mb-8">
                  Before you ask a single question, Geniy defines your objectives, target demographics, and hypotheses worth testing.
                </CardDescription>
                
                {/* Visual: Checklist */}
                <div className="mt-auto space-y-3">
                  {[
                    "Define Target Audience: SaaS Founders",
                    "Hypothesis: Pricing is the main blocker",
                    "Channel Strategy: LinkedIn & Twitter"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="w-4 h-4 rounded-full border border-blue-500/50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Feature 3: Competitor Analysis (The Spy) - Spans 5 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="md:col-span-5"
          >
            <Card className="h-full overflow-hidden glass-card shadow-sm hover:shadow-lg transition-all group border-zinc-200/50 dark:border-zinc-800/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    <Globe className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">The Spy</Badge>
                </div>
                <CardTitle className="text-2xl text-foreground mb-3">Competitor Intelligence</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-base mb-8">
                  Geniy scans the market to generate SWOT analyses and feature comparisons, updating them as new data comes in.
                </CardDescription>
                
                {/* Visual: Radar Chart Mockup */}
                <div className="mt-auto relative h-40 flex items-center justify-center">
                   <div className="relative w-32 h-32 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center">
                      <div className="absolute w-24 h-24 border border-zinc-200 dark:border-zinc-800 rounded-full" />
                      <div className="absolute w-16 h-16 border border-zinc-200 dark:border-zinc-800 rounded-full" />
                      {/* Polygon Mockup */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        <polygon points="50,10 90,40 70,90 30,90 10,40" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth="2" />
                      </svg>
                   </div>
                   <div className="absolute top-2 right-10 text-[10px] text-zinc-500">You</div>
                   <div className="absolute bottom-2 left-10 text-[10px] text-zinc-500">Competitors</div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Feature 4: Live Market Pulse (Integrations) - Spans 7 cols */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-7"
          >
            <Card className="h-full overflow-hidden glass-card shadow-sm hover:shadow-lg transition-all group border-zinc-200/50 dark:border-zinc-800/50">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Zap className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">Live Pulse</Badge>
                </div>
                <CardTitle className="text-2xl text-foreground mb-3">We Watch Your Competitors 24/7</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-base mb-8">
                  Get notified the moment a competitor changes their pricing or launches a new feature. We send the alerts where you work—Slack or Discord.
                </CardDescription>
                
                {/* Visual: Integration Notification */}
                <div className="mt-auto flex flex-col gap-4 relative">
                   {/* Background Glow Effect */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

                   {/* Slack Notification */}
                   <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start gap-3 z-10 transition-transform hover:scale-[1.02] duration-300">
                      <div className="w-8 h-8 rounded-lg bg-[#4A154B] flex items-center justify-center shrink-0">
                         {/* Slack Icon SVG */}
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.52 2.52 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 8.835 24a2.527 2.527 0 0 1-2.521-2.522v-6.313zM8.835 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.835 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.835zM8.835 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.835a2.528 2.528 0 0 1 2.522-2.521h6.313zM18.956 8.835a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.835a2.528 2.528 0 0 1-2.522 2.521h-2.52v-2.52zM17.688 8.835a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.313zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.52h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#fff"/>
                         </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-bold text-foreground">Geniy Bot</span>
                            <span className="text-[10px] text-zinc-400">Just now</span>
                         </div>
                         <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Heads up! <span className="text-emerald-600 dark:text-emerald-400 font-medium">Acme Corp</span> just changed their pricing page.
                         </p>
                      </div>
                   </div>

                   {/* Discord Notification */}
                   <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start gap-3 z-10 transition-transform hover:scale-[1.02] duration-300 ml-4">
                       <div className="w-8 h-8 rounded-lg bg-[#5865F2] flex items-center justify-center shrink-0">
                         {/* Discord Icon SVG */}
                         <svg width="20" height="16" viewBox="0 0 127 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.07 72.07 0 0 0-3.36 6.83 97.9 97.9 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.2 105.2 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.74 105.74 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.23.6.6 0 0 1-.05-1 .59.59 0 0 1 .23-.09 50.11 50.11 0 0 0 2.06 1.05 73.1 73.1 0 0 0 65 0 54 54 0 0 0 2.1-1.05c.09 0 .18 0 .24.08a.59.59 0 0 1-.05 1 69.93 69.93 0 0 1-10.89 5.24 76.88 76.88 0 0 0 6.94 11.09 105.71 105.71 0 0 0 32.19-16.14c2.65-27.39-4.83-51.4-14.73-72.13Zm-65.7 61.35c-6.63 0-12-6.08-12-13.56s5.29-13.56 12-13.56c6.71 0 12 6.13 11.91 13.56 0 7.48-5.24 13.56-11.91 13.56Zm43 0c-6.63 0-12-6.08-12-13.56s5.29-13.56 12-13.56c6.71 0 12 6.13 11.91 13.56 0 7.48-5.24 13.56-11.91 13.56Z" fill="#fff"/>
                         </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-baseline mb-1">
                            <span className="text-xs font-bold text-foreground">Geniy</span>
                            <span className="text-[10px] text-zinc-400">2m ago</span>
                         </div>
                         <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            <span className="font-semibold text-violet-500 dark:text-violet-400">Strategic Gap:</span> They still don't offer an API. Feature Opportunity?
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
