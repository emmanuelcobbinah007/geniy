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

          {/* Feature 4: Insight Dashboard (The Analyst) - Spans 7 cols */}
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
                    <LineChart className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">The Analyst</Badge>
                </div>
                <CardTitle className="text-2xl text-foreground mb-3">Automated Insights</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-base mb-8">
                  "You received 124 responses. Here are the 4 customer profiles that emerged." Geniy clusters data and spots patterns automatically.
                </CardDescription>
                
                {/* Visual: Dashboard Cards */}
                <div className="mt-auto grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-2">Top Pain Point</div>
                      <div className="text-lg font-semibold text-foreground">Pricing Complexity</div>
                      <div className="mt-2 h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full w-[78%] bg-emerald-500 rounded-full" />
                      </div>
                   </div>
                   <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs text-zinc-500 mb-2">Emerging Segment</div>
                      <div className="text-lg font-semibold text-foreground">Agency Owners</div>
                      <div className="flex items-center gap-2 mt-2">
                         <Users className="w-4 h-4 text-emerald-500" />
                         <span className="text-sm text-zinc-600 dark:text-zinc-300">+24% this week</span>
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
