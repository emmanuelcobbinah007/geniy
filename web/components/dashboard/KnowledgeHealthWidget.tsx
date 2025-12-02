"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, CheckCircle2, AlertTriangle, Upload, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface KnowledgeHealthWidgetProps {
  workspaceId: string
}

export function KnowledgeHealthWidget({ workspaceId }: KnowledgeHealthWidgetProps) {
  const { token } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const { data: health, isLoading } = useQuery({
    queryKey: ["workspaceHealth", workspaceId],
    queryFn: async () => {
        if (!token) return null
        return api.getWorkspaceHealth(workspaceId, token)
    },
    enabled: !!workspaceId && !!token,
  })
  
  if (isLoading) {
    return (
      <Card className="p-6 border-violet-100 dark:border-violet-900/20 bg-gradient-to-br from-white to-violet-50/50 dark:from-zinc-900 dark:to-violet-950/10">
        <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-violet-500" />
            <h3 className="font-semibold">Analyzing Knowledge Health...</h3>
        </div>
        <div className="space-y-2">
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-full animate-pulse" />
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3 animate-pulse" />
        </div>
      </Card>
    )
  }

  const score = health?.completenessScore || 0
  const isGood = score > 70

  return (
    <Card className="p-6 border-violet-100 dark:border-violet-900/20 bg-gradient-to-br from-white to-violet-50/50 dark:from-zinc-900 dark:to-violet-950/10 hover-lift transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500 fill-violet-500" />
            Knowledge Health 2.0
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {health?.summary || "Geniy's understanding of your business."}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isGood ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
          {isGood ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {score}% Complete
        </div>
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
            <div className="flex justify-between text-xs text-zinc-500">
                <span>Context Completeness</span>
                <span>{score}/100</span>
            </div>
            <Progress value={score} className="h-2" />
        </div>

        {/* Collapsible Content */}
        {isExpanded ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Missing Dimensions */}
                {health?.missingDimensions && health.missingDimensions.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Missing Intelligence:</h4>
                        <div className="flex flex-wrap gap-2">
                            {health.missingDimensions.map((dim: string, i: number) => (
                                <span key={i} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded border border-red-100 dark:border-red-900/30">
                                    {dim}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recommendations */}
                {health?.recommendations && health.recommendations.length > 0 && (
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800 space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <Upload className="w-3.5 h-3.5 text-violet-500" />
                            Recommended Actions
                        </h4>
                        <ul className="space-y-2">
                            {health.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                                    {rec}
                                </li>
                            ))}
                        </ul>
                        <Link href={`/dashboard/${workspaceId}/context`}>
                            <Button size="sm" variant="outline" className="w-full mt-2">
                                Upload Documents
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        ) : (
            /* Summarized View */
            <div className="flex items-center justify-between pt-2">
                 <div className="flex items-center gap-2">
                    {health?.missingDimensions?.length > 0 && (
                        <span className="text-xs text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {health.missingDimensions.length} Missing Dimensions
                        </span>
                    )}
                 </div>
            </div>
        )}

        {/* Toggle Button */}
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 h-auto py-1"
        >
            {isExpanded ? "Show Less" : "View Details"}
        </Button>
      </div>
    </Card>
  )
}
