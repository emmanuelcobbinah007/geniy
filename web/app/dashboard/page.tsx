"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (user && user.workspaces && user.workspaces.length > 0) {
        router.push(`/dashboard/${user.workspaces[0].id}`)
      } else if (user && user.sharedWorkspaces && user.sharedWorkspaces.length > 0) {
        router.push(`/dashboard/${user.sharedWorkspaces[0].id}`)
      } else if (!user) {
        router.push("/")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  )
}
