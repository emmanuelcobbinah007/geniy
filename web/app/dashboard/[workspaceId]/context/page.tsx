"use client"

import { ContextKnowledge } from "@/components/context/ContextKnowledge"
import { ContextTour } from "@/components/onboarding/ContextTour"
import { BrainChat } from "@/components/context/BrainChat"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

import { useParams } from "next/navigation"
import { LenisScroll } from "@/components/ui/lenis-scroll"

export default function ContextPage() {
  const { token } = useAuth()
  const params = useParams()
  const workspaceId = params?.workspaceId as string
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [analyzingCompetitors, setAnalyzingCompetitors] = useState<string[]>([])

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ["context", workspaceId],
    queryFn: async () => {
      if (!token || !workspaceId) return null
      return api.getContext(workspaceId, token)
    },
    enabled: !!token && !!workspaceId,
    staleTime: 0, // Always fetch fresh data to ensure context is up-to-date
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Poll every 5 seconds to check for background analysis updates
  })



  // Effect to clear analyzing state when data actually updates
  useEffect(() => {
      if (data?.competitors) {
          // Clear "analyzing" state for any competitor that now has data
          setAnalyzingCompetitors(prev => {
              if (prev.length === 0) return prev;
              // Refined logic: If "ALL" was active, we transition to tracking specific unanalyzed competitors
              // preventing the loaders from stopping prematurely when one finishes.
              
              if (prev.includes("ALL")) {
                  const stillUnanalyzed = data.competitors
                      .filter((c: any) => !c.analysis)
                      .map((c: any) => c.name);
                  
                  // If all are analyzed, clear the state.
                  // Otherwise, return the specific names of those still pending.
                  return stillUnanalyzed;
              }

              const next = prev.filter(name => {
                  const comp = data.competitors.find((c: any) => c.name === name);
                  return !comp?.analysis; // Keep analyzing if no analysis yet
              });
              
              return next;
          });
      }
  }, [data?.competitors]);

  // Toast notification on completion
  const wasAnalyzing = useRef(false);
  useEffect(() => {
      if (analyzingCompetitors.length > 0) {
          wasAnalyzing.current = true;
      } else if (wasAnalyzing.current && analyzingCompetitors.length === 0) {
          wasAnalyzing.current = false;
          // Simple completion message
          toast.success("Competitor Deep Dive Complete", {
              description: "Geniy has finished analyzing all selected competitors."
          });
      }
  }, [analyzingCompetitors]);

  const handleAnalysisStart = (target: string) => {
      setAnalyzingCompetitors(prev => [...prev, target]);
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] p-6 flex items-center justify-center">
        <GenStateIllustration state="loading" label="Loading context..." />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] p-6 gap-6 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
      <ContextTour />
      {isRefetching && (
          <div className="absolute top-6 right-6 text-xs text-zinc-400 animate-pulse">
              Refreshing context...
          </div>
      )}
      {/* Left: Knowledge Base */}
      <LenisScroll className="lg:col-span-2 pr-2">
        <ContextKnowledge 
            initialContext={data?.businessContext || ""} 
            documents={data?.documents || []} 
            workspaceId={workspaceId}
            competitors={data?.competitors || []}
            lastAnalysisSummary={data?.lastAnalysisSummary}

            gapAnalysis={data?.gapAnalysis}
            analyzingCompetitors={analyzingCompetitors}
        />
      </LenisScroll>

      {/* Right: Brain Chat - Desktop */}
      <div className="hidden lg:block h-full min-h-0">
        <BrainChat 
            context={data?.businessContext || ""} 
            workspaceId={workspaceId} 
            onAnalysisStart={handleAnalysisStart}
            initialMessages={data?.chatHistory}
        />
      </div>

      {/* Mobile Chat FAB */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-violet-600 hover:bg-violet-700 text-white p-0 overflow-hidden"
            onClick={() => setShowMobileChat(true)}
        >
            <Image src="/gen_states/gen_thinking.png" alt="Gen" width={56} height={56} className="w-full h-full object-cover" />
        </Button>
      </div>

      {/* Mobile Chat Drawer */}
      <AnimatePresence>
        {showMobileChat && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileChat(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="lg:hidden fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-xl z-50 flex flex-col overflow-hidden border-t border-zinc-200 dark:border-zinc-800"
                >
                    <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                            <Image src="/gen_states/gen_thinking.png" alt="Gen" width={32} height={32} />
                            <h3 className="font-semibold">Chat with Geniy</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowMobileChat(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex-1 min-h-0">
                        <BrainChat 
                            context={data?.businessContext || ""} 
                            workspaceId={workspaceId} 
                            hideHeader={true} 
                            onAnalysisStart={handleAnalysisStart}
                            initialMessages={data?.chatHistory}
                        />
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  )
}
