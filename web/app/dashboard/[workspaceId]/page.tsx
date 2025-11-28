"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRight, TrendingUp, Users, Activity, Lightbulb, AlertCircle, CheckCircle2, FileText, Zap } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/context/auth-context"

interface DashboardPageProps {
  params: {
    workspaceId: string
  }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { user } = useAuth()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Command Center</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Welcome back, {user?.name || "User"}. Here is your strategic overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden md:flex">
            <FileText className="mr-2 h-4 w-4" />
            Upload Context
          </Button>
          <Link href={`/create-survey?workspaceId=${params.workspaceId}`}>
            <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
              <Plus className="mr-2 h-4 w-4" />
              New Survey
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Strategy & Health (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Knowledge Health Widget */}
          <motion.div variants={item}>
            <Card className="p-6 border-violet-100 dark:border-violet-900/20 bg-gradient-to-br from-white to-violet-50/50 dark:from-zinc-900 dark:to-violet-950/10">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-500 fill-violet-500" />
                    Knowledge Health
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Geniy's understanding of your business.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Good Standing
                </div>
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-300">Context Completeness</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 w-[75%] rounded-full" />
                  </div>
                </div>
                <div className="w-full md:w-auto p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Missing: Product Roadmap</p>
                      <p className="text-xs text-zinc-500 mt-1">Upload to get better feature suggestions.</p>
                      <Button variant="link" className="h-auto p-0 text-xs text-violet-600 mt-2">Upload now &rarr;</Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Strategy Feed */}
          <motion.div variants={item} className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Strategy Feed
            </h3>
            <div className="grid gap-4">
              {[
                {
                  title: "Churn Risk Detected",
                  desc: "Response rate for 'Product Fit' is low (12%) among Enterprise users.",
                  action: "Launch Churn Analysis",
                  color: "red"
                },
                {
                  title: "Opportunity: Gen Z Market",
                  desc: "Competitor 'Acme' just raised prices. Good time to capture their dissatisfied users.",
                  action: "Create Campaign",
                  color: "green"
                },
                {
                  title: "Follow-up Required",
                  desc: "Your 'Feature Request' survey has 50 new qualitative responses.",
                  action: "View Insights",
                  color: "blue"
                }
              ].map((feed, i) => (
                <Card key={i} className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={`w-1.5 h-12 rounded-full bg-${feed.color}-500 shrink-0`} />
                    <div className="flex-1">
                      <h4 className="font-medium group-hover:text-violet-600 transition-colors">{feed.title}</h4>
                      <p className="text-sm text-zinc-500 mt-1">{feed.desc}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {feed.action} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column: Pulse & Metrics (1/3 width) */}
        <div className="space-y-8">
          
          {/* Competitor Pulse */}
          <motion.div variants={item}>
            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  Competitor Pulse
                </h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  { name: "Acme Corp", action: "updated pricing", time: "2h ago" },
                  { name: "Globex", action: "launched new feature", time: "1d ago" },
                  { name: "Soylent", action: "posted 3 jobs", time: "2d ago" },
                ].map((comp, i) => (
                  <div key={i} className="p-4 flex items-center justify-between text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <div>
                      <span className="font-medium">{comp.name}</span> <span className="text-zinc-500">{comp.action}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{comp.time}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 text-center">
                <Button variant="link" size="sm" className="text-xs text-zinc-500">View all competitors</Button>
              </div>
            </Card>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div variants={item} className="grid grid-cols-2 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center text-center space-y-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <Users className="w-6 h-6 text-zinc-400" />
              <div>
                <div className="text-2xl font-bold">1,234</div>
                <div className="text-xs text-zinc-500">Total Responses</div>
              </div>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center text-center space-y-2 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <TrendingUp className="w-6 h-6 text-zinc-400" />
              <div>
                <div className="text-2xl font-bold">12%</div>
                <div className="text-xs text-zinc-500">Conv. Rate</div>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </motion.div>
  )
}
