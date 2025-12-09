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

interface CompetitorCardProps {
    name: string
    analysis: CompetitorAnalysis
}

export function CompetitorCard({ name, analysis }: CompetitorCardProps) {
    return (
        <Card className="w-full max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-800/50 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    {name}
                    <Badge variant="secondary" className="text-xs font-normal">
                        Competitor Analysis
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
                {/* USP */}
                <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800/30">
                    <p className="text-violet-700 dark:text-violet-300 font-medium text-xs uppercase tracking-wider mb-1">Unique Selling Point</p>
                    <p className="text-zinc-700 dark:text-zinc-300">{analysis.uniqueSellingPoint}</p>
                </div>

                {/* Pricing & Audience */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                            <DollarSign className="w-3.5 h-3.5" /> Pricing
                        </div>
                        <p className="text-zinc-800 dark:text-zinc-200 font-medium">{analysis.pricingModel}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                            <Target className="w-3.5 h-3.5" /> Audience
                        </div>
                        <p className="text-zinc-800 dark:text-zinc-200 font-medium">{analysis.targetAudience}</p>
                    </div>
                </div>

                {/* SWOT */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Strengths
                        </p>
                        <ul className="space-y-1">
                            {analysis.strengths.map((s, i) => (
                                <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">• {s}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                            <X className="w-3 h-3" /> Weaknesses
                        </p>
                        <ul className="space-y-1">
                            {analysis.weaknesses.map((w, i) => (
                                <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 leading-tight">• {w}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Features */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Key Features
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {analysis.keyFeatures.map((f, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-normal text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">
                                {f}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
