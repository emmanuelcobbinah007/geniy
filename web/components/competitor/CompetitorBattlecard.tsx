"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Target, DollarSign, Zap, ChevronDown, ChevronUp, Trash2, History, Activity, RefreshCw, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface CompetitorAnalysis {
  pricingModel: string
  keyFeatures: string[]
  targetAudience: string
  strengths: string[]
  weaknesses: string[]
  uniqueSellingPoint: string
}

interface CompetitorBattlecardProps {
  name: string
  analysis: CompetitorAnalysis
  onDelete?: () => void
  onRedoAnalysis?: () => Promise<void>
  lastScrapedAt?: string | null
  radarStatus?: string
  radarHistory?: Array<{ date: string; status: string; insight: string }>
}

export function CompetitorBattlecard({ name, analysis, onDelete, onRedoAnalysis, lastScrapedAt, radarStatus, radarHistory }: CompetitorBattlecardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isRedoing, setIsRedoing] = useState(false)

  // Helper to truncate text
  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text
    return text.substring(0, length) + "..."
  }

  // Ensure analysis object and arrays exist to prevent crashes
  const safeAnalysis = {
      pricingModel: analysis?.pricingModel || "Unknown",
      targetAudience: analysis?.targetAudience || "Unknown",
      uniqueSellingPoint: analysis?.uniqueSellingPoint || "Not analyzed yet",
      strengths: Array.isArray(analysis?.strengths) ? analysis.strengths : [],
      weaknesses: Array.isArray(analysis?.weaknesses) ? analysis.weaknesses : [],
      keyFeatures: Array.isArray(analysis?.keyFeatures) ? analysis.keyFeatures : []
  };

  // Get latest valid update
  const latestUpdate = radarHistory && radarHistory.length > 0 ? radarHistory[0] : null;

  // Filter for changes only
  const changesHistory = radarHistory?.filter(h => h.status === 'changed' && h.insight !== 'Initial baseline established.') || [];

  const handleRedoAnalysis = async () => {
    if (!onRedoAnalysis) return;
    setIsRedoing(true);
    try {
      await onRedoAnalysis();
    } finally {
      setIsRedoing(false);
    }
  };

  return (
    <Card className={`border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 ${radarStatus === 'scanning' ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400 dark:ring-amber-600' : ''}`}>
      <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{name}</CardTitle>
                    
                    {/* STATUS INDICATOR */}
                    {radarStatus === 'scanning' ? (
                       <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Scanning...</span>
                       </div>
                    ) : lastScrapedAt && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50" title={`Last scanned: ${new Date(lastScrapedAt).toLocaleString()}`}>
                            <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* REDO DEEP DIVE BUTTON */}
                    {onRedoAnalysis && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRedoAnalysis}
                            disabled={isRedoing}
                            className="h-7 text-xs text-zinc-500 hover:text-violet-600 hover:border-violet-300 dark:hover:border-violet-700"
                        >
                            {isRedoing ? (
                                <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing...</>
                            ) : (
                                <><RefreshCw className="w-3 h-3 mr-1" /> Redo Deep Dive</>
                            )}
                        </Button>
                    )}
                    <Badge variant="outline" className="bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 max-w-[120px] truncate">
                        {safeAnalysis.pricingModel}
                    </Badge>
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete competitor "${name}"?`)) onDelete();
                            }}
                            className="h-6 w-6 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-zinc-400" /> 
                <span className="truncate">{safeAnalysis.targetAudience}</span>
            </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-5">
        
        {/* LATEST RADAR UPDATE - Prominent Display */}
        {latestUpdate && (
            <div className={`p-3 rounded-md border ${latestUpdate.status === 'changed' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'}`}>
                <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${latestUpdate.status === 'changed' ? 'text-amber-600 dark:text-amber-500' : 'text-zinc-500 decoration-zinc-500'}`}>
                        <Activity className="w-3.5 h-3.5" /> 
                        {latestUpdate.status === 'changed' ? 'New Update Detected' : 'Latest Scan Result'}
                    </h4>
                    <span className="text-[10px] text-zinc-400">{new Date(latestUpdate.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {latestUpdate.insight}
                </p>
            </div>
        )}

        {/* USP - More subtle */}
        <div className="bg-violet-50/50 dark:bg-violet-900/10 p-3 rounded-md border border-violet-100 dark:border-violet-900/20">
            <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
                <Zap className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> 
                <span className="font-medium">USP:</span> {truncate(safeAnalysis.uniqueSellingPoint, isExpanded ? 500 : 120)}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths - Limited to 2 in collapsed */}
            <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Strengths
                </h4>
                <ul className="space-y-2">
                    {safeAnalysis.strengths.length > 0 ? (
                        safeAnalysis.strengths.slice(0, isExpanded ? undefined : 2).map((s: string, i: number) => (
                            <li key={i} className={`text-sm text-zinc-600 dark:text-zinc-400 leading-snug pl-2 border-l-2 border-emerald-100 dark:border-emerald-900/30 ${!isExpanded ? 'truncate' : ''}`}>
                                {s}
                            </li>
                        ))
                    ) : (
                        <li className="text-xs text-zinc-400 italic">No data yet</li>
                    )}
                </ul>
            </div>

            {/* Weaknesses - Limited to 2 in collapsed */}
            <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Weaknesses
                </h4>
                <ul className="space-y-2">
                    {safeAnalysis.weaknesses.length > 0 ? (
                        safeAnalysis.weaknesses.slice(0, isExpanded ? undefined : 2).map((w: string, i: number) => (
                            <li key={i} className={`text-sm text-zinc-600 dark:text-zinc-400 leading-snug pl-2 border-l-2 border-rose-100 dark:border-rose-900/30 ${!isExpanded ? 'truncate' : ''}`}>
                                {w}
                            </li>
                        ))
                    ) : (
                        <li className="text-xs text-zinc-400 italic">No data yet</li>
                    )}
                </ul>
            </div>
        </div>

        {/* Features - Only show in expanded view */}
        {isExpanded && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-wrap gap-1.5">
                    {safeAnalysis.keyFeatures.length > 0 ? (
                        safeAnalysis.keyFeatures.map((f: string, i: number) => (
                            <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                {f}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-zinc-400 italic">No key features identified</span>
                    )}
                </div>
            </div>
        )}

        {/* CHANGES HISTORY - Only show in expanded view */}
        {isExpanded && changesHistory.length > 0 && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-3">
                    <History className="w-3.5 h-3.5" /> Changes History
                </h4>
                <div className="space-y-2">
                    {changesHistory.slice(0, 5).map((entry, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-md bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                            <div className="flex-shrink-0 w-16">
                                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {entry.insight || "Content changed"}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Expand/Collapse for details */}
        <div className="flex justify-center pt-2">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
                {isExpanded ? (
                    <>Show Less <ChevronUp className="w-3 h-3 ml-1" /></>
                ) : (
                    <>Show Full Analysis <ChevronDown className="w-3 h-3 ml-1" /></>
                )}
            </Button>
        </div>

      </CardContent>
    </Card>
  )
}

