"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, ArrowRight, ThumbsUp, ThumbsDown, MessageSquare, Share2 } from "lucide-react"

export function GeniyRecommendations() {
  return (
    <div className="space-y-6 relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-white/50 dark:bg-black/50 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-full font-bold text-sm shadow-xl">
            Coming Soon
        </div>
      </div>

      <div className="flex items-center gap-2 text-zinc-900 dark:text-white opacity-50">
        <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-500" />
        <h2 className="font-semibold text-lg">Geniy Consultant</h2>
      </div>

      <div className="space-y-4 opacity-50 pointer-events-none">
        {/* Insight 1 */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-200">Demographic Skew Detected</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Responses are heavily skewed towards the 18-24 age group (65%). To get a representative sample, you need more data from 35+.
              </p>
              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs h-8 bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white">
                  Generate LinkedIn Post <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Insight 2 */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
              <ThumbsUp className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-200">Positive Sentiment Spike</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                "Pricing" is being mentioned positively in 80% of recent responses. This validates your new pricing tier.
              </p>
              <div className="flex gap-2 pt-1">
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"><ThumbsUp className="w-3 h-3" /></Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"><ThumbsDown className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Insight 3 */}
        <Card className="p-5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-200">Distribution Opportunity</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Completion rate is highest (92%) from email referrals. Consider sending a reminder email to non-openers.
              </p>
              <div className="pt-2">
                <Button size="sm" className="w-full text-xs h-8 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-100 dark:hover:bg-white text-black border-none">
                  Draft Email
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
