"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, CheckCircle2, AlertTriangle, Upload, Loader2, Sparkles, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Save } from "lucide-react"

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
  
  const [suggestions, setSuggestions] = useState<any | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const handleSuggestionChange = (field: string, value: any) => {
      setSuggestions((prev: any) => ({
          ...prev,
          [field]: value
      }))
  }
  
  // Use existing queryClient to invalidate
  const queryClient = useQueryClient()

  const autoFillMutation = useMutation({
      mutationFn: async () => {
          if (!token) return
          // Fetch current context first (we could pass it in, but fetching ensures freshness)
          // For now, we'll try to analyze what we have. 
          // Ideally, we'd GET the context string here, but for this widget we might need to rely on what the API can do.
          // Let's assume we can trigger an analysis based on stored context.
          // HACK: We will use the analyzeContext endpoint but we need to provide the context string.
          // Since we don't have it here, let's fetch the workspace first.
          const ws = await api.getWorkspace(workspaceId, token)
          // Pass the current recommendations to help the agent
          const recommendations = health?.recommendations || [];
          return api.analyzeContext(ws.businessContext || "", token, workspaceId, recommendations)
      },
      onSuccess: (data) => {
          setSuggestions(data)
          toast.success("Suggestions found! Please review.")
      },
      onError: () => {
          toast.error("Failed to generate suggestions.")
      }
  })

  const applyMutation = useMutation({
      mutationFn: async () => {
          if (!token || !suggestions) return
          
          // Construct the new context string
          // Construct the new context string
          let newContext = `Company: ${suggestions.companyName}\nIndustry: ${suggestions.industry}\nTarget Audience: ${suggestions.targetAudience.join(', ')}\n`;
          
          if (suggestions.valueProposition) {
              newContext += `Value Proposition: ${suggestions.valueProposition}\n`;
          }
          if (suggestions.businessModel) {
              newContext += `Business Model: ${suggestions.businessModel}\n`;
          }
          if (suggestions.goals && suggestions.goals.length > 0) {
              newContext += `Goals:\n- ${suggestions.goals.join('\n- ')}\n`;
          }
          
          newContext += `\n`;
          
          if (suggestions.competitors && suggestions.competitors.length > 0) {
              newContext += `Competitors:\n- ${suggestions.competitors.join('\n- ')}\n\n`;
          }
          
          return api.updateContext(workspaceId, newContext, token)
      },
      onSuccess: () => {
          setSuggestions(null)
          queryClient.invalidateQueries({ queryKey: ["workspaceHealth", workspaceId] })
          toast.success("Context updated successfully!")
      },
      onError: () => {
          toast.error("Failed to update context.")
      }
  })

  if (isLoading) {
    return (
      <Card className="p-6 border-violet-100 dark:border-violet-900/20 bg-gradient-to-br from-white to-violet-50/50 dark:from-zinc-900 dark:to-violet-950/10 flex items-center justify-center min-h-[180px]">
        <GenStateIllustration state="loading" label="Analyzing health..." width={120} height={120} />
      </Card>
    )
  }

  const score = health?.completenessScore || 0
  const isGood = score > 70

  return (
    <Card className="p-6 border-violet-100 dark:border-violet-900/20 bg-gradient-to-br from-white to-violet-50/50 dark:from-zinc-900 dark:to-violet-950/10 hover-lift transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-violet-500 fill-violet-500" />
            Knowledge Health 2.0
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 max-w-md">
            {health?.summary || "Geniy's understanding of your business."}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium self-start sm:self-auto shrink-0 ${isGood ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
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

        {/* Suggestion Review UI (Transient State) */}
        {suggestions && (
             <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-lg p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-semibold text-violet-900 dark:text-violet-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        Geniy Found Suggestions
                    </h4>
                    <div className="flex items-center gap-1">
                        {!isEditing ? (
                             <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-violet-600 dark:text-violet-300" onClick={() => setIsEditing(true)}>
                                <Pencil className="w-3 h-3 mr-1" /> Edit
                            </Button>
                        ) : (
                             <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-green-600 dark:text-green-400" onClick={() => setIsEditing(false)}>
                                <Save className="w-3 h-3 mr-1" /> Done
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-red-500" onClick={() => { setSuggestions(null); setIsEditing(false); }}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                
                <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-4 mb-4">
                    {/* Collaborative Editing Fields */}
                    
                    {/* Company */}
                    <div className="flex items-center">
                         <Badge variant="outline" className="w-full justify-center bg-white dark:bg-zinc-900 border-violet-200 dark:border-violet-800 text-zinc-700 dark:text-zinc-300">Company</Badge>
                    </div>
                    <div>
                        {isEditing ? (
                            <Input 
                                value={suggestions.companyName} 
                                onChange={(e) => handleSuggestionChange('companyName', e.target.value)}
                                className="h-8 bg-white/50 dark:bg-zinc-900/50"
                            />
                        ) : (
                            <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">{suggestions.companyName}</span>
                        )}
                    </div>

                    {/* Industry */}
                    <div className="flex items-center">
                         <Badge variant="outline" className="w-full justify-center bg-white dark:bg-zinc-900 border-violet-200 dark:border-violet-800 text-zinc-700 dark:text-zinc-300">Industry</Badge>
                    </div>
                    <div>
                        {isEditing ? (
                            <Input 
                                value={suggestions.industry} 
                                onChange={(e) => handleSuggestionChange('industry', e.target.value)}
                                className="h-8 bg-white/50 dark:bg-zinc-900/50"
                            />
                        ) : (
                             <span className="text-sm text-zinc-800 dark:text-zinc-200">{suggestions.industry}</span>
                        )}
                    </div>

                    {/* Audience */}
                    <div className="flex items-start pt-1">
                         <Badge variant="outline" className="w-full justify-center bg-white dark:bg-zinc-900 border-violet-200 dark:border-violet-800 text-zinc-700 dark:text-zinc-300">Audience</Badge>
                    </div>
                    <div>
                        {isEditing ? (
                            <Textarea 
                                value={suggestions.targetAudience.join(", ")} 
                                onChange={(e) => handleSuggestionChange('targetAudience', e.target.value.split(',').map((s: string) => s.trim()))}
                                className="min-h-[60px] bg-white/50 dark:bg-zinc-900/50 text-xs"
                            />
                        ) : (
                             <span className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed block">{suggestions.targetAudience.join(", ")}</span>
                        )}
                    </div>

                    {/* Value Prop */}
                    {(suggestions.valueProposition || isEditing) && (
                        <>
                            <div className="flex items-start pt-1">
                                <Badge variant="outline" className="w-full justify-center bg-white dark:bg-zinc-900 border-violet-200 dark:border-violet-800 text-zinc-700 dark:text-zinc-300">Value Prop</Badge>
                            </div>
                            <div>
                                {isEditing ? (
                                    <Textarea 
                                        value={suggestions.valueProposition || ""} 
                                        onChange={(e) => handleSuggestionChange('valueProposition', e.target.value)}
                                        className="min-h-[80px] bg-white/50 dark:bg-zinc-900/50 text-xs"
                                        placeholder="Add value proposition..."
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed block">{suggestions.valueProposition}</span>
                                )}
                            </div>
                        </>
                    )}

                    {/* Business Model */}
                    {(suggestions.businessModel || isEditing) && (
                        <>
                            <div className="flex items-center">
                                <Badge variant="outline" className="w-full justify-center bg-white dark:bg-zinc-900 border-violet-200 dark:border-violet-800 text-zinc-700 dark:text-zinc-300">Model</Badge>
                            </div>
                            <div>
                                {isEditing ? (
                                    <Input 
                                        value={suggestions.businessModel || ""} 
                                        onChange={(e) => handleSuggestionChange('businessModel', e.target.value)}
                                        className="h-8 bg-white/50 dark:bg-zinc-900/50"
                                        placeholder="e.g. SaaS, Marketplace..."
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-800 dark:text-zinc-200">{suggestions.businessModel}</span>
                                )}
                            </div>
                        </>
                    )}

                    {/* Goals */}
                     {(suggestions.goals?.length > 0 || isEditing) && (
                        <>
                            <div className="flex items-start pt-1">
                                <Badge variant="outline" className="w-full justify-center bg-white dark:bg-zinc-900 border-violet-200 dark:border-violet-800 text-zinc-700 dark:text-zinc-300">Goals</Badge>
                            </div>
                            <div>
                                {isEditing ? (
                                    <Textarea 
                                        value={suggestions.goals?.join(", ") || ""} 
                                        onChange={(e) => handleSuggestionChange('goals', e.target.value.split(',').map((s: string) => s.trim()))}
                                        className="min-h-[60px] bg-white/50 dark:bg-zinc-900/50 text-xs"
                                        placeholder="Add goals..."
                                    />
                                ) : (
                                    <span className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed block">{suggestions.goals?.join(", ")}</span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <Button 
                    size="sm" 
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={() => applyMutation.mutate()}
                    disabled={applyMutation.isPending}
                >
                    {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Approve & Add to Context
                </Button>
             </div>
        )}

        {/* Collapsible Content */}
        {isExpanded && !suggestions && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Missing Dimensions */}
                {health?.missingDimensions && health.missingDimensions.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                             <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Missing Intelligence:</h4>
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 px-2"
                                onClick={() => autoFillMutation.mutate()}
                                disabled={autoFillMutation.isPending}
                             >
                                 {autoFillMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
                                 Auto-Fill
                             </Button>
                        </div>
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
        )}
        
        {/* Summarized View (Only when collapsed) */}
        {!isExpanded && !suggestions && (
            <div className="flex items-center justify-between pt-2">
                 <div className="flex items-center gap-2">
                    {health?.missingDimensions?.length > 0 ? (
                        <span className="text-xs text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {health.missingDimensions.length} Missing Dimensions
                        </span>
                    ) : (
                        <span className="text-xs text-green-600 dark:text-green-500 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            All Systems Go
                        </span>
                    )}
                 </div>
            </div>
        )}

        {/* Toggle Button */}
        {!suggestions && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 h-auto py-1"
            >
                {isExpanded ? "Show Less" : "View Details"}
            </Button>
        )}
      </div>
    </Card>
  )
}
