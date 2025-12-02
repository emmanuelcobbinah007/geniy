import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Target, Lightbulb, Users, BarChart3, CheckCircle2 } from "lucide-react"

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
    <Card className="w-full overflow-hidden border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-900 shadow-lg">
      <div className="bg-violet-50 dark:bg-violet-900/20 p-4 border-b border-violet-100 dark:border-violet-800/50">
        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-semibold">
            <Lightbulb className="w-5 h-5" />
            <h3>Research Strategy</h3>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Objectives */}
        <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Target className="w-3 h-3" /> Objectives
            </h4>
            <ul className="space-y-1">
                {strategy.objectives.map((obj, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-500 shrink-0" />
                        {obj}
                    </li>
                ))}
            </ul>
        </div>

        {/* Hypotheses */}
        <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Hypotheses to Test
            </h4>
            <ul className="space-y-1">
                {strategy.hypotheses.map((hyp, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                        {hyp}
                    </li>
                ))}
            </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Target Audience */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Target Audience
                </h4>
                <div className="flex flex-wrap gap-1">
                    {strategy.targetDemographics.map((demo, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {demo}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" /> Key Metrics
                </h4>
                <div className="flex flex-wrap gap-1">
                    {strategy.keyMetrics.map((metric, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-zinc-200 dark:border-zinc-700">
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
