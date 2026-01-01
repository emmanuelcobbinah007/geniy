"use client"

import { Sidebar } from "@/components/dashboard/Sidebar"
import { useAuth } from "@/context/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect } from "react"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"
import { GatingProvider } from "@/context/gating-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const workspaceId = params?.workspaceId as string

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <GenStateIllustration state="loading" label="Loading workspace..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <GatingProvider workspaceId={workspaceId}>
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </GatingProvider>
  )
}
