"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { 
    Users, Building, CreditCard, FileText, MessageSquare, 
    TrendingUp, DollarSign, Clock, Crown, AlertCircle, 
    RefreshCw, ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface Stats {
    users: {
        total: number
        last7Days: number
        last30Days: number
    }
    workspaces: {
        total: number
        byTier: { free: number, starter: number, pro: number }
        earlyAdopters: number
    }
    subscriptions: {
        active: { count: number, list: any[] }
        trialing: { count: number, list: any[] }
        cancelled: { count: number, list: any[] }
    }
    content: {
        surveys: number
        responses: number
    }
    revenue: {
        total: number
        currency: string
    }
    recentUsers: any[]
    recentTransactions: any[]
}

export default function AdminDashboard() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'subscriptions' | 'transactions'>('overview')

    const fetchStats = async () => {
        console.log('[Admin] fetchStats called, token:', token ? 'exists' : 'missing')
        if (!token) return
        
        setLoading(true)
        setError(null)
        
        try {
            console.log('[Admin] Fetching from:', `${API_URL}/admin/stats`)
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            console.log('[Admin] Response status:', res.status)
            
            if (res.status === 403) {
                setError('Admin access required')
                return
            }
            
            if (!res.ok) throw new Error('Failed to fetch stats')
            
            const data = await res.json()
            console.log('[Admin] Stats received:', data)
            setStats(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        console.log('[Admin] useEffect triggered, token:', token ? 'exists' : 'null/undefined')
        if (token) {
            fetchStats()
        } else {
            console.log('[Admin] No token yet, waiting...')
        }
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-zinc-400 mb-4">{error}</p>
                    <Button onClick={() => router.push('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Header */}
            <div className="border-b border-zinc-800 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <p className="text-sm text-zinc-400">Geniy Platform Statistics</p>
                    </div>
                    <Button onClick={fetchStats} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-800 px-6">
                <div className="max-w-7xl mx-auto flex gap-6">
                    {(['overview', 'users', 'subscriptions', 'transactions'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                                activeTab === tab 
                                    ? 'border-violet-500 text-violet-500' 
                                    : 'border-transparent text-zinc-400 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && stats && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard 
                                    icon={Users} 
                                    label="Total Users" 
                                    value={stats.users.total}
                                    subtext={`+${stats.users.last7Days} this week`}
                                    color="violet"
                                />
                                <StatCard 
                                    icon={Building} 
                                    label="Workspaces" 
                                    value={stats.workspaces.total}
                                    subtext={`${stats.workspaces.earlyAdopters} early adopters`}
                                    color="blue"
                                />
                                <StatCard 
                                    icon={CreditCard} 
                                    label="Active Subscriptions" 
                                    value={stats.subscriptions.active.count}
                                    subtext={`${stats.subscriptions.trialing.count} trialing`}
                                    color="emerald"
                                />
                                <StatCard 
                                    icon={DollarSign} 
                                    label="Total Revenue" 
                                    value={`${stats.revenue.currency} ${stats.revenue.total.toLocaleString()}`}
                                    subtext="All time"
                                    color="amber"
                                />
                            </div>

                            {/* Workspace Tiers */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                                    <h3 className="font-semibold mb-4">Workspace Distribution</h3>
                                    <div className="space-y-3">
                                        <TierBar label="Free" count={stats.workspaces.byTier.free} total={stats.workspaces.total} color="zinc" />
                                        <TierBar label="Starter" count={stats.workspaces.byTier.starter} total={stats.workspaces.total} color="blue" />
                                        <TierBar label="Pro" count={stats.workspaces.byTier.pro} total={stats.workspaces.total} color="violet" />
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                                    <h3 className="font-semibold mb-4">Content Stats</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-zinc-800/50">
                                            <FileText className="w-5 h-5 text-violet-500 mb-2" />
                                            <p className="text-2xl font-bold">{stats.content.surveys}</p>
                                            <p className="text-sm text-zinc-400">Surveys Created</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-zinc-800/50">
                                            <MessageSquare className="w-5 h-5 text-green-500 mb-2" />
                                            <p className="text-2xl font-bold">{stats.content.responses}</p>
                                            <p className="text-sm text-zinc-400">Total Responses</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Users */}
                            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold">Recent Signups</h3>
                                    <button 
                                        onClick={() => setActiveTab('users')}
                                        className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1"
                                    >
                                        View all <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {stats.recentUsers.slice(0, 5).map((user: any) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-sm font-medium text-violet-400">
                                                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name || 'Anonymous'}</p>
                                                    <p className="text-sm text-zinc-400">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-zinc-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                                {user.workspaces?.[0]?.planTier && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                        user.workspaces[0].planTier === 'PRO' 
                                                            ? 'bg-violet-500/20 text-violet-400'
                                                            : user.workspaces[0].planTier === 'STARTER'
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : 'bg-zinc-700 text-zinc-400'
                                                    }`}>
                                                        {user.workspaces[0].planTier}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'users' && stats && (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                                <h3 className="font-semibold mb-4">All Recent Users</h3>
                                <div className="space-y-2">
                                    {stats.recentUsers.map((user: any) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center font-medium text-violet-400">
                                                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name || 'Anonymous'}</p>
                                                    <p className="text-sm text-zinc-400">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-zinc-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'subscriptions' && stats && (
                        <motion.div
                            key="subscriptions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <SubscriptionSection 
                                title="Active Subscriptions" 
                                items={stats.subscriptions.active.list} 
                                color="emerald"
                            />
                            <SubscriptionSection 
                                title="Trialing" 
                                items={stats.subscriptions.trialing.list} 
                                color="amber"
                            />
                            <SubscriptionSection 
                                title="Cancelled" 
                                items={stats.subscriptions.cancelled.list} 
                                color="red"
                            />
                        </motion.div>
                    )}

                    {activeTab === 'transactions' && stats && (
                        <motion.div
                            key="transactions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                                <h3 className="font-semibold mb-4">Recent Transactions</h3>
                                {stats.recentTransactions.length === 0 ? (
                                    <p className="text-zinc-400 text-center py-8">No transactions yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {stats.recentTransactions.map((tx: any) => (
                                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                                                <div>
                                                    <p className="font-medium">{tx.workspace?.name || 'Unknown'}</p>
                                                    <p className="text-sm text-zinc-400">{tx.planTier}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-500">
                                                        {tx.currency} {tx.amount.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">
                                                        {new Date(tx.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

// Components
function StatCard({ icon: Icon, label, value, subtext, color }: any) {
    const colors: Record<string, string> = {
        violet: 'bg-violet-500/10 text-violet-500',
        blue: 'bg-blue-500/10 text-blue-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        amber: 'bg-amber-500/10 text-amber-500',
    }
    
    return (
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-zinc-400">{label}</p>
            {subtext && <p className="text-xs text-zinc-500 mt-1">{subtext}</p>}
        </div>
    )
}

function TierBar({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
    const percent = total > 0 ? (count / total) * 100 : 0
    const colors: Record<string, string> = {
        zinc: 'bg-zinc-500',
        blue: 'bg-blue-500',
        violet: 'bg-violet-500',
    }
    
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="text-zinc-400">{count}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${colors[color]} rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    )
}

function SubscriptionSection({ title, items, color }: { title: string, items: any[], color: string }) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-500/10 text-emerald-500',
        amber: 'bg-amber-500/10 text-amber-500',
        red: 'bg-red-500/10 text-red-500',
    }
    
    return (
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${colors[color]}`}>
                    {items.length}
                </span>
                <h3 className="font-semibold">{title}</h3>
            </div>
            {items.length === 0 ? (
                <p className="text-zinc-400 text-center py-4">None</p>
            ) : (
                <div className="space-y-2">
                    {items.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30">
                            <div>
                                <p className="font-medium">{sub.workspace?.name || 'Unknown'}</p>
                                <p className="text-sm text-zinc-400">{sub.workspace?.owner?.email}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400">
                                    {sub.planTier}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
