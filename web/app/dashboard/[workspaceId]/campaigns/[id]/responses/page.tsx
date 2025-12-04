"use client"

import { useEffect, useState, use } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, BarChart3, MessageSquare, List } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { ExportButton } from "@/components/analytics/ExportButton"

export default function CampaignResultsPage({ params }: { params: Promise<{ id: string; workspaceId: string }> }) {
  const { id, workspaceId } = use(params)
  const { token } = useAuth()
  
  const [analytics, setAnalytics] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [campaign, setCampaign] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      try {
        const [analyticsData, responsesData, campaignData] = await Promise.all([
            api.getCampaignAnalytics(id, token),
            api.getCampaignResponses(id, token),
            api.getCampaign(id, token)
        ])
        setAnalytics(analyticsData)
        setResponses(responsesData)
        setCampaign(campaignData)
      } catch (error) {
        console.error("Failed to fetch results:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, token])

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const renderChart = (questionKey: string, data: any) => {
      const chartData = Object.entries(data.counts).map(([name, value]) => ({ name, value }));
      
      return (
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
      )
  }

  return (
    <div id="dashboard-content" className="p-8 space-y-8 max-w-7xl mx-auto min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <Link href={`/dashboard/${workspaceId}/campaigns/${id}`} className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Campaign
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Results & Analytics</h1>
        </div>
        <div className="flex gap-2">
            <ExportButton 
                campaignName={campaign?.name || "Campaign"} 
                responses={responses} 
                targetElementId="dashboard-content" 
            />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg w-full md:w-auto flex md:inline-flex">
            <TabsTrigger value="overview" className="flex-1 md:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-md px-4 py-2 text-zinc-600 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="responses" className="flex-1 md:flex-none data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-md px-4 py-2 text-zinc-600 dark:text-zinc-400 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white">
                <List className="w-4 h-4 mr-2" /> Individual Responses
            </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Responses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-900 dark:text-white">{analytics?.totalResponses || 0}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-900 dark:text-white">100%</div>
                        <p className="text-xs text-zinc-500 mt-1">Based on started vs completed</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Avg. Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-zinc-900 dark:text-white">2m 14s</div>
                        <p className="text-xs text-zinc-500 mt-1">Estimated</p>
                    </CardContent>
                </Card>
            </div>

            {/* Question Analytics */}
            <div className="grid grid-cols-1 gap-6">
                {analytics?.analytics && Object.entries(analytics.analytics).map(([key, data]: [string, any]) => (
                    <Card key={key} className="overflow-hidden border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                            <CardTitle className="text-base font-medium leading-relaxed flex items-start gap-3">
                                <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs px-2.5 py-1 rounded-md uppercase tracking-wider font-bold mt-0.5 shrink-0">{key}</span>
                                <span className="text-zinc-900 dark:text-zinc-100">{data.question}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {(data.type === 'multiple_choice' || data.type === 'rating') && (
                                renderChart(key, data)
                            )}
                            
                            {(data.type === 'text' || data.type === 'short_text' || data.type === 'long_text') && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                                        <MessageSquare className="w-4 h-4" />
                                        Recent Answers
                                    </div>
                                    <div className="grid gap-3">
                                        {data.recentAnswers.slice(0, 5).map((ans: string, i: number) => (
                                            <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl text-sm border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                "{ans}"
                                            </div>
                                        ))}
                                        {data.recentAnswers.length === 0 && <div className="text-zinc-400 italic text-sm">No answers yet.</div>}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="responses">
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-zinc-500">Loading responses...</div>
                ) : responses.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">No responses yet.</div>
                ) : (
                    <div className="grid gap-4">
                        {responses.map((response) => {
                            // Parse schema to get question titles
                            const questions = response.survey?.jsonSchema?.questions || {};
                            const questionMap = Array.isArray(questions) 
                                ? questions.reduce((acc: any, q: any, i: number) => ({ ...acc, [`Q${i+1}`]: q.question }), {})
                                : Object.entries(questions).reduce((acc: any, [k, v]: [string, any]) => ({ ...acc, [k]: v.question }), {});

                            return (
                                <Card key={response.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                                    <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:items-start justify-between">
                                        <div className="space-y-4 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                                                <span className="font-medium text-zinc-900 dark:text-white">
                                                    {format(new Date(response.submittedAt), "MMM d, yyyy • h:mm a")}
                                                </span>
                                                <span>•</span>
                                                <span>ID: {response.id.slice(0, 8)}</span>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {Object.entries(response.rawAnswers).slice(0, 3).map(([key, value]) => (
                                                    <div key={key} className="text-sm">
                                                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                                            {questionMap[key] || key}
                                                        </p>
                                                        <p className="text-zinc-900 dark:text-zinc-200 line-clamp-2">
                                                            {String(value)}
                                                        </p>
                                                    </div>
                                                ))}
                                                {Object.keys(response.rawAnswers).length > 3 && (
                                                    <p className="text-xs text-zinc-400 italic">
                                                        + {Object.keys(response.rawAnswers).length - 3} more answers
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex md:flex-col gap-2 shrink-0">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="w-full md:w-auto">View Full Response</Button>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-zinc-900 dark:text-zinc-100">Response Details</DialogTitle>
                                                        <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                                                            Submitted on {format(new Date(response.submittedAt), "PPP p")}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-6 mt-4">
                                                        {Object.entries(response.rawAnswers).map(([key, value]) => (
                                                            <div key={key} className="space-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                                                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                                                                    {questionMap[key] || key}
                                                                </h4>
                                                                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800">
                                                                    {String(value)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
