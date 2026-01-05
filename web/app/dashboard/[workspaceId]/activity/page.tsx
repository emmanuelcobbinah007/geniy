"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, ArrowLeft, MessageSquare, Radar, FileText, Zap, Filter } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/context/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface ActivityItem {
    id: string
    type: 'response' | 'competitor' | 'insight' | 'document'
    title: string
    description: string
    timestamp: string
    timeAgo: string
    metadata?: Record<string, unknown>
}

export default function ActivityPage() {
    const params = useParams()
    const workspaceId = params?.workspaceId as string
    const { token } = useAuth()

    const { data: activityData, isLoading } = useQuery({
        queryKey: ['activity', workspaceId],
        queryFn: async () => {
            if (!token || !workspaceId) return null
            return api.getActivity(workspaceId, token)
        },
        enabled: !!token && !!workspaceId,
    })

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'response': return <MessageSquare className="w-4 h-4 text-violet-500" />
            case 'competitor': return <Radar className="w-4 h-4 text-amber-500" />
            case 'insight': return <Zap className="w-4 h-4 text-emerald-500" />
            case 'document': return <FileText className="w-4 h-4 text-blue-500" />
            default: return <Activity className="w-4 h-4 text-zinc-500" />
        }
    }

    const getActivityBadge = (type: string) => {
        switch (type) {
            case 'response': return <Badge variant="outline" className="text-violet-600 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">Response</Badge>
            case 'competitor': return <Badge variant="outline" className="text-amber-600 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">Competitor</Badge>
            case 'insight': return <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">Insight</Badge>
            case 'document': return <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">Document</Badge>
            default: return null
        }
    }

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    const activities: ActivityItem[] = activityData?.activities || []

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="p-4 md:p-8 max-w-4xl mx-auto space-y-6"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/${workspaceId}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-display tracking-tight flex items-center gap-2">
                            <Activity className="w-6 h-6 text-violet-600" />
                            Activity Feed
                        </h1>
                        <p className="text-sm text-zinc-500">All events and updates for your workspace</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="hidden md:flex">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>
            </motion.div>

            {/* Activity List */}
            <motion.div variants={item} className="space-y-3">
                {activities.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                        <Activity className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                        <p className="text-zinc-500">No activity yet</p>
                        <p className="text-sm text-zinc-400 mt-1">Activity will appear here as you use the platform</p>
                    </Card>
                ) : (
                    activities.map((activity, i) => (
                        <motion.div
                            key={activity.id || i}
                            variants={item}
                            className="group"
                        >
                            <Card className="p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className="font-medium text-sm truncate">{activity.title}</h3>
                                            {getActivityBadge(activity.type)}
                                        </div>
                                        <p className="text-sm text-zinc-500 line-clamp-2">{activity.description}</p>
                                    </div>
                                    <span className="text-xs text-zinc-400 whitespace-nowrap">{activity.timeAgo}</span>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </motion.div>
        </motion.div>
    )
}
