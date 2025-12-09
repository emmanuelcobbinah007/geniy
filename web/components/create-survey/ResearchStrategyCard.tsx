import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Lightbulb, Users, BarChart3, CheckCircle2, Sparkles } from "lucide-react"

interface ResearchStrategyCardProps {
  strategy: {
    objectives: string[]
    hypotheses: string[]
    targetDemographics: string[]
    keyMetrics: string[]
    suggestedChannels: string[]
  }
}

export function ResearchStrategyCard({ strategy }: ResearchStrategyCardProps) {
  return (
    <Card className="w-full overflow-hidden border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-violet-500/10">
      <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 p-5 border-b border-violet-100 dark:border-violet-800/50">
        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-semibold">
            <div className="p-2 bg-white dark:bg-violet-950 rounded-lg shadow-sm">
                <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wide">Research Strategy</h3>
                <p className="text-xs text-violet-600/80 dark:text-violet-400/80 font-normal">AI-Generated Plan</p>
            </div>
        </div>
      </div>
      
      <div className="p-5 space-y-8">
        {/* Objectives */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-500" /> Core Objectives
            </h4>
            <ul className="space-y-2">
                {strategy.objectives.map((obj, i) => (
                    <li key={i} className="text-sm flex items-start gap-3 text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                        <span className="leading-relaxed">{obj}</span>
                    </li>
                ))}
            </ul>
        </div>

        {/* Hypotheses */}
        <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500" /> Hypotheses to Test
            </h4>
            <ul className="space-y-2">
                {strategy.hypotheses.map((hyp, i) => (
                    <li key={i} className="text-sm flex items-start gap-3 text-zinc-700 dark:text-zinc-300 bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100/50 dark:border-amber-900/20">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="leading-relaxed">{hyp}</span>
                    </li>
                ))}
            </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Target Audience */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" /> Target Audience
                </h4>
                <div className="flex flex-wrap gap-2">
                    {strategy.targetDemographics.map((demo, i) => (
                        <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-100 dark:border-blue-800">
                            {demo}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" /> Key Metrics
                </h4>
                <div className="flex flex-wrap gap-2">
                    {strategy.keyMetrics.map((metric, i) => (
                        <Badge key={i} variant="outline" className="px-2.5 py-1 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10">
                            {metric}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </Card>
  )
}
