"use client"

import { CampaignCard } from "@/components/campaigns/CampaignCard"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"

import { useParams } from "next/navigation"

export default function CampaignsPage() {
  const { user, token } = useAuth()
  const params = useParams()
  const workspaceId = params?.workspaceId as string
  
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', workspaceId],
    queryFn: async () => {
      if (!workspaceId || !token) return []
      return api.getCampaigns(workspaceId, token)
    },
    enabled: !!workspaceId && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  })

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Campaigns</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your research projects and view insights.
          </p>
        </div>
        <Link href={`/create-survey?workspaceId=${workspaceId}`}>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20">
            <Plus className="mr-2 h-4 w-4" />
            New Survey
          </Button>
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input placeholder="Search campaigns..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </motion.div>

      {/* Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
            <div className="col-span-full flex items-center justify-center min-h-[400px]">
                <GenStateIllustration state="loading" label="Loading campaigns..." />
            </div>
        ) : campaigns?.length === 0 ? (
            <div className="col-span-full py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
                <GenStateIllustration 
                    state="empty" 
                    label="No campaigns found" 
                    className="mb-6"
                />
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-center">
                    Create your first campaign to start gathering insights from your users.
                </p>
                <Link href={`/create-survey?workspaceId=${workspaceId}`}>
                    <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                    </Button>
                </Link>
            </div>
        ) : (
            campaigns?.map((campaign: any) => (
            <CampaignCard 
                key={campaign.id} 
                id={campaign.id}
                name={campaign.name}
                status={campaign.surveys?.[0]?.isPublished ? "Active" : "Draft"}
                responses={campaign._count?.surveys || 0} // Using survey count as proxy for now, ideally sum responses
                date={new Date(campaign.createdAt).toLocaleDateString()}
                // Mock data for now as backend doesn't provide these yet
                trend={undefined} 
                insight={undefined}
                workspaceId={workspaceId}
                publicSlug={campaign.surveys?.[0]?.publicSlug}
            />
            ))
        )}
      </motion.div>
    </motion.div>
  )
}
