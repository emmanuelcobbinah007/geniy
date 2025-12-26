"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Radar, RefreshCw, Globe, AlertTriangle, CheckCircle2, XCircle, Bell } from "lucide-react"
import { LivePulseSettings } from "./LivePulseSettings"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"

interface Competitor {
  name: string
  url?: string
  website?: string
  radarStatus?: "stable" | "changed" | "error"
  lastScrapedAt?: string
  contentHash?: string
}

interface CompetitorRadarProps {
  workspaceId: string
  competitors: (Competitor | string)[]
  integrations?: any
}

export function CompetitorRadar({ workspaceId, competitors, integrations }: CompetitorRadarProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [scanning, setScanning] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const scanMutation = useMutation({
    mutationFn: async (competitorName: string) => {
        if (!token) throw new Error("No token")
        return api.scanCompetitor(workspaceId, competitorName, token)
    },
    onSuccess: (data, competitorName) => {
        toast.success(`Scan complete for ${competitorName}`, {
            description: data.status === "changed" ? "Changes detected!" : "No changes found."
        })
        queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] })
        setScanning(null)
    },
    onError: (error: any) => {
        toast.error("Scan failed", { description: error.message })
        setScanning(null)
    }
  })

  const handleScan = (name: string) => {
    setScanning(name)
    scanMutation.mutate(name)
  }

  // Normalize competitors
  const normalizedCompetitors: Competitor[] = competitors.map(c => {
      if (typeof c === 'string') return { name: c, radarStatus: undefined }
      return c
  })

  // DEBUG: Check what we are receiving
  // console.log("Radar received:", competitors);
  // console.log("Normalized:", normalizedCompetitors);

  return (
    <Card className="p-0 overflow-hidden border-zinc-200 dark:border-zinc-800">
      <LivePulseSettings 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
        workspaceId={workspaceId} 
        initialIntegrations={integrations}
      />

      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Radar className="w-4 h-4 text-violet-500" />
          Competitor Radar
        </h3>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSettingsOpen(true)}>
                <Bell className="w-3.5 h-3.5 text-zinc-400 hover:text-violet-500" />
            </Button>
            <Badge variant="outline" className="text-xs bg-white dark:bg-zinc-900">
                {normalizedCompetitors.length} Tracked
            </Badge>
        </div>
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {normalizedCompetitors.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
                <Globe className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                No competitors tracked. Add them in Context.
            </div>
        ) : (
            // Sort by status (changed first) then take top 3
            normalizedCompetitors
                .sort((a, b) => (b.radarStatus === 'changed' ? 1 : 0) - (a.radarStatus === 'changed' ? 1 : 0))
                .slice(0, 3)
                .map((comp, i) => (
                <div key={i} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors group">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comp.name}</span>
                                {comp.radarStatus === 'changed' && (
                                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 h-5 px-1.5">
                                        Update
                                    </Badge>
                                )}
                            </div>
                            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                                {comp.lastScrapedAt ? (
                                    <span>Last scan: {new Date(comp.lastScrapedAt).toLocaleString()}</span>
                                ) : (
                                    <span>Not scanned yet</span>
                                )}
                            </div>
                        </div>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                            onClick={() => handleScan(comp.name)}
                            disabled={scanning === comp.name}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${scanning === comp.name ? 'animate-spin text-violet-600' : ''}`} />
                        </Button>
                    </div>
                </div>
            ))
        )}
      </div>
      
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 text-center border-t border-zinc-100 dark:border-zinc-800">
        <Link href={`/dashboard/${workspaceId}/context?tab=competitors`}>
            <Button variant="link" size="sm" className="text-xs text-zinc-500 hover:text-violet-600">
                View all competitors
            </Button>
        </Link>
      </div>
    </Card>
  )
}
