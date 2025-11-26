"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, BarChart3, Users, ArrowRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

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

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(" ")[0] || "User"} 👋</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Here's what's happening in <span className="font-semibold text-foreground">My Workspace</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Context
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Survey
          </Button>
        </div>
      </motion.div>

      {/* Context Status Alert (Conditional) */}
      <motion.div variants={item} className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 flex items-start gap-4">
        <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg text-violet-600 dark:text-violet-300">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-violet-900 dark:text-violet-100">Business Context Active</h3>
          <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
            Geniy is using your uploaded "Q3 Strategic Plan" to generate insights.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20">
          Update
        </Button>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-zinc-500">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-zinc-500">2 surveys currently live</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <div className="h-4 w-4 text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-zinc-500">+4% from last week</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Active Campaigns List */}
      <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>
              Your ongoing research projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Product Market Fit - Q3", status: "Active", responses: 450, date: "Created 2 days ago" },
                { name: "Competitor Analysis: Acme Corp", status: "Analyzing", responses: 120, date: "Created 1 week ago" },
                { name: "Customer Satisfaction Survey", status: "Draft", responses: 0, date: "Created yesterday" },
              ].map((campaign, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-zinc-100 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold">
                      {campaign.name[0]}
                    </div>
                    <div>
                      <h4 className="font-medium group-hover:text-violet-600 transition-colors">{campaign.name}</h4>
                      <p className="text-sm text-zinc-500">{campaign.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{campaign.responses} responses</div>
                      <div className="text-xs text-zinc-500">{campaign.status}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-violet-500 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Recent Insights */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Insights</CardTitle>
            <CardDescription>
              AI-generated findings from your data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="p-3 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-500/10 border border-fuchsia-100 dark:border-fuchsia-500/20">
                 <div className="flex items-center gap-2 mb-2">
                   <Sparkles className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
                   <span className="text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300">New Customer Segment</span>
                 </div>
                 <p className="text-sm text-zinc-700 dark:text-zinc-300">
                   AI identified a new group: "Budget-Conscious Power Users" who value feature X but churn due to pricing.
                 </p>
               </div>
               <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                 <div className="flex items-center gap-2 mb-2">
                   <BarChart3 className="h-4 w-4 text-zinc-500" />
                   <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Trend Alert</span>
                 </div>
                 <p className="text-sm text-zinc-600 dark:text-zinc-400">
                   Satisfaction scores dropped by 5% this week. Primary complaint: "Mobile load times."
                 </p>
               </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
