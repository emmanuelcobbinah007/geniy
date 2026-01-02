import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Target, 
  Lightbulb, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  Sparkles,
  Globe,
  AlertTriangle,
  TrendingUp,
  MapPin,
  MessageCircle,
  Share2,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface IdeaValidation {
  ideaStatus: "NOVEL" | "EXISTS" | "CROWDED" | "FAILED_BEFORE" | "UNKNOWN"
  summary: string
  directCompetitors?: { name: string; description: string; differentiator: string }[]
  indirectSolutions?: string[]
  failedAttempts?: { name: string; reason: string }[]
  marketSignals?: { demandLevel: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN"; evidence: string }
  differentiationOpportunities?: string[]
}

interface AudienceHangout {
  summary: string
  socialPlatforms?: { platform: string; specificChannels: string[]; engagementTip: string }[]
  onlineCommunities?: { name: string; type: string; link?: string; memberCount?: string }[]
  contentChannels?: { type: string; name: string; relevance: string }[]
  offlineVenues?: { type: string; name: string; frequency?: string }[]
  keyInfluencers?: { name: string; platform: string; followers?: string }[]
  surveyDistributionStrategy?: string[]
}

interface ResearchStrategyCardProps {
  strategy: {
    objectives: string[]
    hypotheses: string[]
    targetDemographics: string[]
    keyMetrics: string[]
    suggestedChannels: string[]
    ideaValidation?: IdeaValidation | null
    audienceHangouts?: AudienceHangout | null
  }
}

// Collapsible section component
function CollapsibleSection({ 
  title, 
  icon: Icon, 
  iconColor,
  children,
  defaultOpen = false,
  badge
}: { 
  title: string
  icon: any
  iconColor: string
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm">{title}</span>
          {badge}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-zinc-950">
          {children}
        </div>
      )}
    </div>
  )
}

// Status badge for idea validation
function IdeaStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    NOVEL: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Novel Idea" },
    EXISTS: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Exists" },
    CROWDED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Crowded Market" },
    FAILED_BEFORE: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "Failed Before" },
    UNKNOWN: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400", label: "Unknown" },
  }
  
  const style = styles[status] || styles.UNKNOWN
  
  return (
    <Badge className={cn("ml-2", style.bg, style.text, "border-0")}>
      {style.label}
    </Badge>
  )
}

// Demand level badge
function DemandBadge({ level }: { level: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    HIGH: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
    MEDIUM: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
    LOW: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
    UNKNOWN: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-600 dark:text-zinc-400" },
  }
  
  const style = styles[level] || styles.UNKNOWN
  
  return (
    <Badge className={cn(style.bg, style.text, "border-0 font-medium")}>
      {level} Demand
    </Badge>
  )
}

export function ResearchStrategyCard({ strategy }: ResearchStrategyCardProps) {
  const { ideaValidation, audienceHangouts } = strategy

  return (
    <Card className="w-full overflow-hidden border-violet-200 dark:border-violet-800 bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-violet-500/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 p-5 border-b border-violet-100 dark:border-violet-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white dark:bg-violet-950 rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Research Strategy</h3>
            <p className="text-xs text-violet-600/80 dark:text-violet-400/80">AI-Generated Research Plan</p>
          </div>
        </div>
      </div>
      
      <div className="p-5 space-y-5">
        {/* Idea Validation Section */}
        {ideaValidation && ideaValidation.ideaStatus !== "UNKNOWN" && (
          <CollapsibleSection
            title="Idea Validation"
            icon={Lightbulb}
            iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            defaultOpen={true}
            badge={<IdeaStatusBadge status={ideaValidation.ideaStatus} />}
          >
            <div className="space-y-4">
              {/* Summary */}
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {ideaValidation.summary}
              </p>
              
              {/* Market Signals */}
              {ideaValidation.marketSignals && (
                <div className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                  <TrendingUp className="w-4 h-4 mt-0.5 text-violet-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-500 uppercase">Market Demand</span>
                      <DemandBadge level={ideaValidation.marketSignals.demandLevel} />
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{ideaValidation.marketSignals.evidence}</p>
                  </div>
                </div>
              )}

              {/* Direct Competitors */}
              {ideaValidation.directCompetitors && ideaValidation.directCompetitors.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Direct Competitors
                  </h5>
                  <div className="grid gap-2">
                    {ideaValidation.directCompetitors.slice(0, 3).map((comp, i) => (
                      <div key={i} className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100/50 dark:border-red-900/20">
                        <div className="font-medium text-sm text-zinc-900 dark:text-white">{comp.name}</div>
                        <div className="text-xs text-zinc-500 mt-1">{comp.description}</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Differentiator: {comp.differentiator}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Differentiation Opportunities */}
              {ideaValidation.differentiationOpportunities && ideaValidation.differentiationOpportunities.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase text-zinc-500">Ways to Stand Out</h5>
                  <div className="flex flex-wrap gap-2">
                    {ideaValidation.differentiationOpportunities.map((opp, i) => (
                      <Badge key={i} variant="outline" className="px-2.5 py-1 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10">
                        {opp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Audience Hangouts Section */}
        {audienceHangouts && (
          <CollapsibleSection
            title="Where Your Audience Hangs Out"
            icon={MapPin}
            iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            defaultOpen={true}
          >
            <div className="space-y-4">
              {/* Summary */}
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {audienceHangouts.summary}
              </p>

              {/* Social Platforms */}
              {audienceHangouts.socialPlatforms && audienceHangouts.socialPlatforms.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Social Platforms
                  </h5>
                  <div className="grid gap-2">
                    {audienceHangouts.socialPlatforms.map((platform, i) => (
                      <div key={i} className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-900/20">
                        <div className="font-medium text-sm text-zinc-900 dark:text-white">{platform.platform}</div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {platform.specificChannels.slice(0, 4).map((channel, j) => (
                            <Badge key={j} variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-zinc-500 mt-2 italic">{platform.engagementTip}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Online Communities */}
              {audienceHangouts.onlineCommunities && audienceHangouts.onlineCommunities.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-2">
                    <MessageCircle className="w-3 h-3" /> Communities
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {audienceHangouts.onlineCommunities.slice(0, 6).map((community, i) => (
                      <Badge key={i} variant="outline" className="px-2.5 py-1 text-xs border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/10">
                        {community.name}
                        {community.memberCount && <span className="ml-1 opacity-60">({community.memberCount})</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Survey Distribution Strategy */}
              {audienceHangouts.surveyDistributionStrategy && audienceHangouts.surveyDistributionStrategy.length > 0 && (
                <div className="space-y-2 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
                  <h5 className="text-xs font-bold uppercase text-violet-700 dark:text-violet-400 flex items-center gap-2">
                    <Share2 className="w-3 h-3" /> Survey Distribution Tips
                  </h5>
                  <ul className="space-y-1">
                    {audienceHangouts.surveyDistributionStrategy.slice(0, 3).map((tip, i) => (
                      <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Core Objectives */}
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

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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

          {/* Key Metrics */}
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

        {/* Suggested Channels */}
        {strategy.suggestedChannels && strategy.suggestedChannels.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-fuchsia-500" /> Distribution Channels
            </h4>
            <div className="flex flex-wrap gap-2">
              {strategy.suggestedChannels.map((channel, i) => (
                <Badge key={i} variant="outline" className="px-2.5 py-1 text-xs border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-400 bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
                  {channel}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
