"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ArrowRight, TrendingUp, Users, AlertCircle } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface CampaignCardProps {
  id: string
  name: string
  status: "Active" | "Draft" | "Completed" | "Analyzing"
  responses: number
  date: string
  trend?: number
  insight?: string
  workspaceId: string
  publicSlug?: string
}

export function CampaignCard({ id, name, status, responses, date, trend, insight, workspaceId, publicSlug }: CampaignCardProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!token) return
      return api.deleteCampaign(id, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', workspaceId] })
      toast.success("Campaign deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete campaign")
    }
  })

  const handleShare = () => {
    if (!publicSlug) {
      toast.error("Public link not available")
      return
    }
    const url = `${window.location.origin}/s/${publicSlug}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  const handleEdit = () => {
    toast.info("Editing surveys is coming soon!")
  }

  return (
    <Card className="p-6 group relative overflow-hidden bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:shadow-violet-500/5 hover:border-violet-500/50 hover:-translate-y-1 transition-all duration-300">
      {/* Status Badge */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <Badge variant="outline" className={
          status === "Active" ? "border-green-200 text-green-700 dark:border-green-900 dark:text-green-500" :
          status === "Analyzing" ? "border-violet-200 text-violet-700 dark:border-violet-900 dark:text-violet-500" :
          "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-500"
        }>
          {status}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <DropdownMenuItem onClick={handleEdit} className="focus:bg-zinc-100 dark:focus:bg-zinc-900 focus:text-zinc-900 dark:focus:text-zinc-200 cursor-pointer">Edit Survey</DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare} className="focus:bg-zinc-100 dark:focus:bg-zinc-900 focus:text-zinc-900 dark:focus:text-zinc-200 cursor-pointer">Share Link</DropdownMenuItem>
            <DropdownMenuItem 
                onClick={() => {
                    if (confirm("Are you sure you want to delete this campaign?")) {
                        deleteMutation.mutate()
                    }
                }} 
                className="text-red-600 dark:text-red-900 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700 dark:focus:text-red-500 cursor-pointer"
            >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-xl text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors pr-24 truncate">
            <Link href={`/dashboard/${workspaceId}/campaigns/${id}`} className="before:absolute before:inset-0">{name}</Link>
          </h3>
          <p className="text-sm text-zinc-500 mt-1">{date}</p>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">{responses}</div>
            <div className="text-xs text-zinc-500 flex items-center gap-1">
              <Users className="h-3 w-3" /> Responses
            </div>
          </div>
          {trend && (
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-500">+{trend}%</div>
              <div className="text-xs text-zinc-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> This Week
              </div>
            </div>
          )}
        </div>

        {/* Geniy Insight Badge - Minimal */}
        {insight && (
          <div className="py-3 px-0 border-t border-zinc-100 dark:border-zinc-900 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-600">Geniy Insight</p>
              <p className="text-xs text-zinc-500 mt-0.5">{insight}</p>
            </div>
          </div>
        )}

        {/* Footer Action */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
            <Link href={`/dashboard/${workspaceId}/campaigns/${id}`} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center transition-colors">
              View Insights <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
        </div>
      </div>
    </Card>
  )
}
