"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, Target, DollarSign, Zap } from "lucide-react"

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
}

export function CompetitorBattlecard({ name, analysis }: CompetitorBattlecardProps) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">{name}</CardTitle>
            <Badge variant="outline" className="bg-white dark:bg-zinc-900">
                {analysis.pricingModel}
            </Badge>
        </div>
        <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
            <Target className="w-3 h-3" /> Target: {analysis.targetAudience}
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* USP */}
        <div className="bg-violet-50 dark:bg-violet-900/10 p-3 rounded-lg border border-violet-100 dark:border-violet-900/20">
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                <Zap className="w-3 h-3 inline mr-1" /> USP: {analysis.uniqueSellingPoint}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Strengths
                </h4>
                <ul className="space-y-1">
                    {analysis.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">• {s}</li>
                    ))}
                </ul>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> Weaknesses
                </h4>
                <ul className="space-y-1">
                    {analysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">• {w}</li>
                    ))}
                </ul>
            </div>
        </div>

        {/* Features */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Key Features</h4>
            <div className="flex flex-wrap gap-2">
                {analysis.keyFeatures.map((f, i) => (
                    <Badge key={i} variant="secondary" className="font-normal">
                        {f}
                    </Badge>
                ))}
            </div>
        </div>

      </CardContent>
    </Card>
  )
}
