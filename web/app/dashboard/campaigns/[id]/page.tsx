"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2, MoreHorizontal, Eye, Copy, Check } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { LiveAnalytics } from "@/components/campaigns/LiveAnalytics"
import { GeniyRecommendations } from "@/components/campaigns/GeniyRecommendations"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SurveyRenderer } from "@/components/survey/SurveyRenderer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

import { use } from "react"

export default function CampaignInsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user, token } = useAuth()
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      if (!token) return null
      return api.getCampaign(id, token)
    },
    enabled: !!token
  })

  const survey = campaign?.surveys?.[0]
  const shareUrl = survey ? `${window.location.origin}/s/${survey.publicSlug}` : ""

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-screen">Loading campaign...</div>
  }

  if (!campaign) {
    return <div className="p-8 flex items-center justify-center min-h-screen">Campaign not found</div>
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            {survey && (
                <SurveyRenderer 
                    surveyData={survey.jsonSchema} 
                    isPreview={true} 
                />
            )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <Link href="/dashboard/campaigns" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Campaigns
            </Link>
            <span>/</span>
            <span>{campaign.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">{campaign.name}</h1>
            <Badge variant="outline" className={
                survey?.isPublished 
                ? "border-green-200 text-green-700 bg-green-50 dark:border-green-900 dark:text-green-500 dark:bg-green-950/20"
                : "border-zinc-200 text-zinc-700 bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400"
            }>
                {survey?.isPublished ? "Active" : "Draft"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Share Survey</h4>
                    <p className="text-sm text-zinc-500">
                        Anyone with this link can view and answer the survey.
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                        <Input value={shareUrl} readOnly className="h-8 text-xs" />
                        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
          </Popover>

          <Link href={`/dashboard/campaigns/${id}/responses`}>
            <Button variant="outline" className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white">
              View Responses
            </Button>
          </Link>
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            Export Report
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Analytics (2/3) */}
        <motion.div variants={item} className="lg:col-span-2 space-y-8">
          <LiveAnalytics totalResponses={survey?._count?.responses || 0} />
        </motion.div>

        {/* Sidebar: Geniy Consultant (1/3) */}
        <motion.div variants={item} className="space-y-6">
          <GeniyRecommendations />
        </motion.div>
      </div>
    </motion.div>
  )
}
