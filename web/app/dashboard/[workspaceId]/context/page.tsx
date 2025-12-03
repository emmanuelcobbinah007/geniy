"use client"

import { ContextKnowledge } from "@/components/context/ContextKnowledge"
import { ContextTour } from "@/components/onboarding/ContextTour"
import { BrainChat } from "@/components/context/BrainChat"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useParams } from "next/navigation"

export default function ContextPage() {
  const { token } = useAuth()
  const params = useParams()
  const workspaceId = params?.workspaceId as string
  const [showMobileChat, setShowMobileChat] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["context", workspaceId],
    queryFn: async () => {
      if (!token || !workspaceId) return null
      return api.getContext(workspaceId, token)
    },
    enabled: !!token && !!workspaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] p-6 flex items-center justify-center">
        <GenStateIllustration state="loading" label="Loading context..." />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] p-6 gap-6 grid grid-cols-1 lg:grid-cols-3">
      <ContextTour />
      {/* Left: Knowledge Base */}
      <div className="h-full min-h-0 lg:col-span-2">
        <ContextKnowledge 
            initialContext={data?.businessContext || ""} 
            documents={data?.documents || []} 
            workspaceId={workspaceId}
        />
      </div>

      {/* Right: Brain Chat - Desktop */}
      <div className="hidden lg:block h-full min-h-0">
        <BrainChat context={data?.businessContext || ""} workspaceId={workspaceId} />
      </div>

      {/* Mobile Chat FAB */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => setShowMobileChat(true)}
        >
            <Sparkles className="w-6 h-6" />
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
                            <Sparkles className="w-5 h-5 text-violet-600" />
                            <h3 className="font-semibold">Chat with Geniy</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowMobileChat(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="flex-1 min-h-0">
                        <BrainChat context={data?.businessContext || ""} workspaceId={workspaceId} hideHeader={true} />
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  )
}
