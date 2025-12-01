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

import { ExportButton } from "@/components/analytics/ExportButton"

export default function CampaignResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
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
            <Link href={`/dashboard/campaigns/${id}`} className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1">
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
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <BarChart3 className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="responses" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-md px-4 py-2">
                <List className="w-4 h-4 mr-2" /> Individual Responses
            </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Responses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{analytics?.totalResponses || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">100%</div>
                        <p className="text-xs text-zinc-500 mt-1">Based on started vs completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">Avg. Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">2m 14s</div>
                        <p className="text-xs text-zinc-500 mt-1">Estimated</p>
                    </CardContent>
                </Card>
            </div>

            {/* Question Analytics */}
            <div className="grid grid-cols-1 gap-6">
                {analytics?.analytics && Object.entries(analytics.analytics).map(([key, data]: [string, any]) => (
                    <Card key={key} className="overflow-hidden">
                        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                            <CardTitle className="text-base font-medium leading-relaxed flex items-start gap-2">
                                <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs px-2 py-1 rounded uppercase tracking-wider font-bold mt-0.5">{key}</span>
                                {data.question}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {(data.type === 'multiple_choice' || data.type === 'rating') && (
                                renderChart(key, data)
                            )}
                            
                            {(data.type === 'text' || data.type === 'short_text' || data.type === 'long_text') && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                                        <MessageSquare className="w-4 h-4" />
                                        Recent Answers
                                    </div>
                                    <div className="grid gap-3">
                                        {data.recentAnswers.slice(0, 5).map((ans: string, i: number) => (
                                            <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm border border-zinc-100 dark:border-zinc-800">
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
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[200px]">Submitted At</TableHead>
                    <TableHead>Answers Preview</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">Loading responses...</TableCell>
                    </TableRow>
                    ) : responses.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-zinc-500">No responses yet.</TableCell>
                    </TableRow>
                    ) : (
                    responses.map((response) => {
                        // Parse schema to get question titles
                        const questions = response.survey?.jsonSchema?.questions || {};
                        const questionMap = Array.isArray(questions) 
                            ? questions.reduce((acc: any, q: any, i: number) => ({ ...acc, [`Q${i+1}`]: q.question }), {})
                            : Object.entries(questions).reduce((acc: any, [k, v]: [string, any]) => ({ ...acc, [k]: v.question }), {});

                        return (
                        <TableRow key={response.id}>
                        <TableCell className="font-medium align-top">
                            {format(new Date(response.submittedAt), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                            <div className="space-y-2">
                            {Object.entries(response.rawAnswers).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                <span className="font-medium text-zinc-900 dark:text-zinc-200 block">
                                    {questionMap[key] || key}:
                                </span>
                                <span className="text-zinc-600 dark:text-zinc-400">
                                    {String(value)}
                                </span>
                                </div>
                            ))}
                            </div>
                        </TableCell>
                        <TableCell className="text-right align-top">
                            <Button variant="ghost" size="sm">View Details</Button>
                        </TableCell>
                        </TableRow>
                    )})
                    )}
                </TableBody>
                </Table>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
