"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, FileText, MessageSquare, CreditCard, TrendingUp, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface SubscriptionItem {
  id: string
  planTier: string
  currentPeriodEnd: string
  workspace: {
    name: string
    owner: { name: string | null; email: string }
  }
}

interface SubscriptionGroup {
  count: number
  list: SubscriptionItem[]
}

interface AdminStats {
  users: {
    total: number
    last7Days: number
    last30Days: number
  }
  workspaces: {
    total: number
    byTier: {
      free: number
      starter: number
      pro: number
    }
    earlyAdopters: number
  }
  subscriptions: {
    active: SubscriptionGroup
    trialing: SubscriptionGroup
    cancelled: SubscriptionGroup
  }
  content: {
    surveys: number
    responses: number
  }
  revenue: {
    total: number
    currency: string
  }
  recentUsers: Array<{
    id: string
    name: string | null
    email: string
    createdAt: string
    workspaces: Array<{ name: string; planTier: string }>
  }>
  recentTransactions: Array<{
    id: string
    amount: number
    currency: string
    planTier: string
    createdAt: string
    workspace: { name: string }
  }>
}

export default function AdminDashboard() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    async function fetchStats() {
      if (!token) {
        setError("Not authenticated")
        setLoading(false)
        return
      }

      try {
        const data = await api.getAdminStats(token)
        setStats(data)
      } catch (err: any) {
        setError(err.message || "Failed to load stats")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { 
      title: "Total Users", 
      value: stats.users.total, 
      subtitle: `+${stats.users.last7Days} this week`,
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30"
    },
    { 
      title: "Workspaces", 
      value: stats.workspaces.total, 
      subtitle: `${stats.workspaces.earlyAdopters} early adopters`,
      icon: Building2,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30"
    },
    { 
      title: "Surveys Created", 
      value: stats.content.surveys, 
      subtitle: `${stats.content.responses} total responses`,
      icon: FileText,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
    },
    { 
      title: "Total Revenue", 
      value: `₵${stats.revenue.total.toLocaleString()}`, 
      subtitle: stats.revenue.currency,
      icon: CreditCard,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30"
    },
  ]

  const subscriptionSections = [
    { key: 'active', label: 'Active', data: stats.subscriptions.active, bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', textColor: 'text-emerald-700 dark:text-emerald-400' },
    { key: 'trialing', label: 'Trialing', data: stats.subscriptions.trialing, bgColor: 'bg-amber-50 dark:bg-amber-900/20', textColor: 'text-amber-700 dark:text-amber-400' },
    { key: 'cancelled', label: 'Cancelled', data: stats.subscriptions.cancelled, bgColor: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-700 dark:text-red-400' },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Business metrics at a glance
            </p>
          </div>
          <Badge variant="outline" className="border-violet-500 text-violet-600">
            <Sparkles className="w-3 h-3 mr-1" /> Admin
          </Badge>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1 text-zinc-900 dark:text-white">{stat.value}</p>
                      <p className="text-xs text-zinc-400 mt-1">{stat.subtitle}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Plan Distribution & Subscriptions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Distribution */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg">Workspaces by Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Free</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-zinc-400" 
                      style={{ width: `${(stats.workspaces.byTier.free / stats.workspaces.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium w-8 text-right">{stats.workspaces.byTier.free}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Starter</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${(stats.workspaces.byTier.starter / stats.workspaces.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium w-8 text-right">{stats.workspaces.byTier.starter}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Pro</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500" 
                      style={{ width: `${(stats.workspaces.byTier.pro / stats.workspaces.total) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium w-8 text-right">{stats.workspaces.byTier.pro}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status - Expandable */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg">Subscription Status</CardTitle>
              <CardDescription>Click to view accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subscriptionSections.map(({ key, label, data, bgColor, textColor }) => (
                <div key={key}>
                  <button
                    onClick={() => toggleSection(key)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg ${bgColor} transition-colors hover:opacity-80`}
                  >
                    <span className={textColor}>{label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${textColor}`}>{data.count}</span>
                      {data.count > 0 && (
                        expandedSections[key] ? 
                          <ChevronUp className={`w-4 h-4 ${textColor}`} /> : 
                          <ChevronDown className={`w-4 h-4 ${textColor}`} />
                      )}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSections[key] && data.list.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-2 pl-2">
                          {data.list.map((sub) => (
                            <div key={sub.id} className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-zinc-900 dark:text-white">{sub.workspace.name}</p>
                                  <p className="text-xs text-zinc-500">{sub.workspace.owner.email}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">{sub.planTier}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Users & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Signups */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg">Recent Signups</CardTitle>
              <CardDescription>Last 10 users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-zinc-900 dark:text-white">{user.name || "Unnamed"}</p>
                      <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                    </div>
                    <div className="text-right ml-4">
                      <Badge variant="outline" className="text-xs">
                        {user.workspaces[0]?.planTier || "FREE"}
                      </Badge>
                      <p className="text-xs text-zinc-400 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription>Successful payments</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentTransactions.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">{tx.workspace.name}</p>
                        <p className="text-sm text-zinc-500">{tx.planTier} Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">₵{tx.amount.toLocaleString()}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
