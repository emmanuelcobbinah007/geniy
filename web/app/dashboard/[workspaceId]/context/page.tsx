"use client"

import { ContextKnowledge } from "@/components/context/ContextKnowledge"
import { BrainChat } from "@/components/context/BrainChat"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

import { useParams } from "next/navigation"

export default function ContextPage() {
  const { token } = useAuth()
  const params = useParams()
  const workspaceId = params?.workspaceId as string

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
      <div className="h-[calc(100vh-4rem)] p-6 gap-6 grid grid-cols-1 lg:grid-cols-3">
        {/* Left: Knowledge Base Skeleton */}
        <div className="h-full min-h-0 lg:col-span-2">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>

        {/* Right: Brain Chat Skeleton */}
        <div className="h-full min-h-0">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] p-6 gap-6 grid grid-cols-1 lg:grid-cols-3">
      {/* Left: Knowledge Base */}
      <div className="h-full min-h-0 lg:col-span-2">
        <ContextKnowledge 
            initialContext={data?.businessContext || ""} 
            documents={data?.documents || []} 
            workspaceId={workspaceId}
        />
      </div>

      {/* Right: Brain Chat */}
      <div className="h-full min-h-0">
        <BrainChat />
      </div>
    </div>
  )
}
