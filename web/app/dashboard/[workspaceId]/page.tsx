"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ArrowRight, TrendingUp, Users, Activity, Lightbulb, AlertCircle, CheckCircle2, FileText, Zap } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/context/auth-context"

import { useParams } from "next/navigation"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { KnowledgeHealthWidget } from "@/components/dashboard/KnowledgeHealthWidget"
import { OnboardingTour } from "@/components/onboarding/OnboardingTour"

export default function DashboardPage() {
  const params = useParams()
  const workspaceId = params?.workspaceId as string
  const { user, token } = useAuth()

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard', workspaceId],
    queryFn: async () => {
        if (!token || !workspaceId) return null
        return api.getDashboardStats(workspaceId, token)
    },
    enabled: !!token && !!workspaceId,
  })

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

  if (isLoading) {
      return <div className="p-8 flex items-center justify-center min-h-screen">Loading dashboard...</div>
  }

  const stats = dashboard?.stats || { totalResponses: 0, conversionRate: 0, healthScore: 0, campaignCount: 0 }
  const feed = dashboard?.strategyFeed || []
  const activity = dashboard?.recentActivity || []

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      <OnboardingTour />
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
          <Link href={`/create-survey?workspaceId=${workspaceId}`}>
            <Button id="create-survey-btn" className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
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
          <motion.div variants={item} className="relative" id="knowledge-health-widget">
            <KnowledgeHealthWidget workspaceId={workspaceId} />
          </motion.div>

          {/* Strategy Feed */}
          <motion.div variants={item} className="space-y-4" id="strategy-feed">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Strategy Feed
            </h3>
            {feed.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                    <p className="text-zinc-500">No insights yet. Create a survey to get started!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                {feed.map((item: any, i: number) => (
                    <Card key={i} className="p-5 hover-lift cursor-pointer group border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-start gap-4">
                        <div className={`w-1.5 h-12 rounded-full bg-${item.color}-500 shrink-0`} />
                        <div className="flex-1">
                        <h4 className="font-medium group-hover:text-violet-600 transition-colors">{item.title}</h4>
                        <p className="text-sm text-zinc-500 mt-1">{item.desc}</p>
                        </div>
                        <Link href={item.link || '#'}>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.action} <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                    </Card>
                ))}
                </div>
            )}
          </motion.div>

        </div>

        {/* Right Column: Pulse & Metrics (1/3 width) */}
        <div className="space-y-8">
          
          {/* Competitor Pulse */}
          <motion.div variants={item} className="relative">
            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  Competitor Pulse
                </h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(!dashboard?.competitors || dashboard.competitors.length === 0) ? (
                    <div className="p-4 text-center text-sm text-zinc-500">
                        No competitors tracked yet.
                    </div>
                ) : (
                    dashboard.competitors.slice(0, 5).map((comp: any, i: number) => {
                        const isObject = typeof comp !== 'string';
                        const name = isObject ? comp.name : comp;
                        const details = isObject ? comp : null;

                        return (
                            <div key={i} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">{name}</span>
                                    <span className="text-xs text-zinc-400">Tracking</span>
                                </div>
                                {details && (
                                    <div className="mt-2 text-xs text-zinc-500 space-y-1 pl-2 border-l-2 border-zinc-100 dark:border-zinc-800 hidden group-hover:block transition-all">
                                        {details.pricingModel && <div><span className="font-semibold">Pricing:</span> {details.pricingModel}</div>}
                                        {details.strengths && details.strengths.length > 0 && <div><span className="font-semibold">Strength:</span> {details.strengths[0]}</div>}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 text-center">
                <Button variant="link" size="sm" className="text-xs text-zinc-500">View all competitors</Button>
              </div>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={item} className="relative">
            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  Recent Activity
                </h3>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {activity.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">No recent activity</div>
                ) : (
                    activity.map((act: any, i: number) => (
                    <div key={i} className="p-4 flex items-center justify-between text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <div>
                        <span className="font-medium">New Response</span> <span className="text-zinc-500">on {act.surveyTitle}</span>
                        </div>
                        <span className="text-xs text-zinc-400">{act.timeAgo}</span>
                    </div>
                    ))
                )}
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 text-center">
                <Button variant="link" size="sm" className="text-xs text-zinc-500">View all activity</Button>
              </div>
            </Card>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div variants={item} className="grid grid-cols-2 gap-4">
            <Card className="p-4 flex flex-col items-center justify-center text-center space-y-2 hover-lift border-zinc-200 dark:border-zinc-800">
              <Users className="w-6 h-6 text-zinc-400" />
              <div>
                <div className="text-2xl font-bold">{stats.totalResponses}</div>
                <div className="text-xs text-zinc-500">Total Responses</div>
              </div>
            </Card>
            <Card className="p-4 flex flex-col items-center justify-center text-center space-y-2 hover-lift border-zinc-200 dark:border-zinc-800">
              <TrendingUp className="w-6 h-6 text-zinc-400" />
              <div>
                <div className="text-2xl font-bold">{stats.campaignCount}</div>
                <div className="text-xs text-zinc-500">Active Campaigns</div>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </motion.div>
  )
}
