"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Target, DollarSign, Zap, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
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
}

export function CompetitorBattlecard({ name, analysis, onDelete }: CompetitorBattlecardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Helper to truncate text
  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text
    return text.substring(0, length) + "..."
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
      <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{name}</CardTitle>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 max-w-[120px] truncate">
                        {analysis.pricingModel}
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
                <span className="truncate">{analysis.targetAudience}</span>
            </p>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-5">
        
        {/* USP - More subtle */}
        <div className="bg-violet-50/50 dark:bg-violet-900/10 p-3 rounded-md border border-violet-100 dark:border-violet-900/20">
            <p className="text-sm text-violet-700 dark:text-violet-300 leading-relaxed">
                <Zap className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> 
                <span className="font-medium">USP:</span> {truncate(analysis.uniqueSellingPoint, isExpanded ? 500 : 120)}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths - Limited to 2 in collapsed */}
            <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Strengths
                </h4>
                <ul className="space-y-2">
                    {analysis.strengths.slice(0, isExpanded ? undefined : 2).map((s, i) => (
                        <li key={i} className={`text-sm text-zinc-600 dark:text-zinc-400 leading-snug pl-2 border-l-2 border-emerald-100 dark:border-emerald-900/30 ${!isExpanded ? 'truncate' : ''}`}>
                            {s}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Weaknesses - Limited to 2 in collapsed */}
            <div className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Weaknesses
                </h4>
                <ul className="space-y-2">
                    {analysis.weaknesses.slice(0, isExpanded ? undefined : 2).map((w, i) => (
                        <li key={i} className={`text-sm text-zinc-600 dark:text-zinc-400 leading-snug pl-2 border-l-2 border-rose-100 dark:border-rose-900/30 ${!isExpanded ? 'truncate' : ''}`}>
                            {w}
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Features - Only show in expanded view */}
        {isExpanded && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-wrap gap-1.5">
                    {analysis.keyFeatures.map((f, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                            {f}
                        </span>
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
                className="h-6 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
