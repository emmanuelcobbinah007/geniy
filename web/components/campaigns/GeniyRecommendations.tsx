"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, ThumbsUp, ThumbsDown, MessageSquare, Share2, TrendingUp, Lightbulb, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"
import Image from "next/image"

interface GeniyRecommendationsProps {
    campaignId?: string
    hasResponses?: boolean
}

export function GeniyRecommendations({ campaignId, hasResponses = false }: GeniyRecommendationsProps) {
  const { token } = useAuth()
  const [insights, setInsights] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const hasAttemptedRef = useRef(false)

  useEffect(() => {
    if (campaignId && token) {
        loadInsights()
    }
  }, [campaignId, token])

  const loadInsights = async () => {
      try {
          setIsLoading(true)
          const data = await api.getInsights(campaignId!, token!)
          if (data && data.content) {
              setInsights(data.content)
          } else if (hasResponses && !hasAttemptedRef.current) {
              // Auto-generate if no insights exist but we have responses
              hasAttemptedRef.current = true
              generateInsights(true)
          }
      } catch (error) {
          console.error("Failed to load insights", error)
      } finally {
          setIsLoading(false)
      }
  }

  const generateInsights = async (isAuto = false) => {
      if (!campaignId || !token) return
      
      setIsGenerating(true)
      try {
          const data = await api.generateInsights(campaignId, token)
          if (data && data.content) {
              setInsights(data.content)
              if (!isAuto) toast.success("Insights generated successfully!")
          }
      } catch (error) {
          console.error("Failed to generate insights", error)
          if (!isAuto) toast.error("Failed to generate insights.")
      } finally {
          setIsGenerating(false)
      }
  }

  const handleGenerate = () => generateInsights(false)

  if (!campaignId) return null

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between text-zinc-900 dark:text-white">
        <div className="flex items-center gap-2">
            <Image src="/gen_states/gen_consultant.png" alt="Logo" width={60} height={60} className="w-16 h-16 text-violet-600 dark:text-violet-500" />
            <h2 className="font-semibold text-lg ml-[-10px]">Geniy Consultant</h2>
        </div>
        {!insights && !isLoading && (
            <Button 
                size="sm" 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="bg-violet-600 hover:bg-violet-700 text-white"
            >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Insights
            </Button>
        )}
      </div>

      {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
              <GenStateIllustration state="loading" label="Analyzing insights..." width={150} height={150} />
          </div>
      ) : !insights ? (
        <Card className="p-8 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
                <h3 className="font-medium">No Insights Yet</h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                    Geniy can analyze your responses to find trends, sentiment, and actionable advice.
                </p>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Analyzing..." : "Generate AI Report"}
            </Button>
        </Card>
      ) : (
        <div className="space-y-4">
            {/* Executive Summary - Always Visible */}
            <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-zinc-900">
                <div className="space-y-2">
                    <h3 className="font-medium text-sm text-violet-700 dark:text-violet-300 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Executive Summary
                    </h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {insights.summary}
                    </p>
                </div>
            </Card>

            {/* Mobile Toggle Button */}
            <div className="md:hidden">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full text-zinc-500 hover:text-violet-600"
                >
                    {isExpanded ? (
                        <>Show Less <ChevronUp className="w-4 h-4 ml-2" /></>
                    ) : (
                        <>Show Full Report <ChevronDown className="w-4 h-4 ml-2" /></>
                    )}
                </Button>
            </div>

            {/* Collapsible Content */}
            <div className={cn("space-y-4", !isExpanded && "hidden md:block")}>
                {/* Sentiment */}
                <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl shrink-0 ${
                            insights.sentiment?.label === 'Positive' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            insights.sentiment?.label === 'Negative' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                            {insights.sentiment?.label === 'Positive' ? <ThumbsUp className="w-6 h-6" /> :
                            insights.sentiment?.label === 'Negative' ? <ThumbsDown className="w-6 h-6" /> :
                            <TrendingUp className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Overall Sentiment: {insights.sentiment?.label}</h3>
                                <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                                    {insights.sentiment?.score}/100
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {insights.sentiment?.breakdown}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Trends */}
                <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" /> Key Trends
                        </h3>
                        <div className="space-y-3">
                            {insights.trends?.map((trend: any, i: number) => (
                                <div key={i} className="text-sm">
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200 block mb-0.5">• {trend.title}</span>
                                    <span className="text-zinc-500 dark:text-zinc-400 text-xs">{trend.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Recommendations */}
                <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" /> Recommendations
                        </h3>
                        <div className="space-y-2">
                            {insights.recommendations?.map((rec: string, i: number) => (
                                <div key={i} className="flex gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
                                    <span>{rec}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
                
                {insights && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="w-full text-xs text-zinc-500"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                        Refresh Analysis
                    </Button>
                )}
            </div>
        </div>
      )}
    </div>
  )
}
