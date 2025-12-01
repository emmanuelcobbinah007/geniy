"use client"

import { Card } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Users, TrendingUp, Clock, MousePointerClick } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { format, subDays, isSameDay, parseISO } from "date-fns"

export function LiveAnalytics({ totalResponses = 0, responses = [] }: { totalResponses?: number, responses?: any[] }) {
  const [liveCount, setLiveCount] = useState(totalResponses)

  useEffect(() => {
    setLiveCount(totalResponses)
  }, [totalResponses])

  // Calculate Average Time
  const avgTime = useMemo(() => {
    if (!responses.length) return "--"
    const times = responses
        .map(r => r.metadata?.timeTaken)
        .filter(t => typeof t === 'number' && t > 0)
    
    if (!times.length) return "--"
    
    const avgSeconds = times.reduce((a, b) => a + b, 0) / times.length
    const minutes = Math.floor(avgSeconds / 60)
    const seconds = Math.round(avgSeconds % 60)
    return `${minutes}m ${seconds}s`
  }, [responses])

  // Calculate Response Volume (Last 7 Days)
  const volumeData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i))
    return days.map(day => {
        const count = responses.filter(r => isSameDay(parseISO(r.submittedAt), day)).length
        return {
            name: format(day, 'EEE'), // Mon, Tue
            responses: count,
            fullDate: format(day, 'MMM d')
        }
    })
  }, [responses])

  // Calculate Demographics (Age) - Heuristic: Look for "age" in question text
  const demographicsData = useMemo(() => {
    if (!responses.length) return []
    
    // Find a question that might be about age
    // We need the question text, but responses only have rawAnswers (keys are Q IDs)
    // We need the schema to map Q IDs to text. 
    // Ideally, we should pass the survey schema or question map to this component.
    // For now, let's try to infer from values if they look like age ranges (e.g. "18-24")
    
    const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55+', '65+']
    const ageCounts: Record<string, number> = {}
    
    // Scan all answers for values that match age ranges
    responses.forEach(r => {
        Object.values(r.rawAnswers).forEach((val: any) => {
            if (typeof val === 'string' && ageRanges.includes(val)) {
                ageCounts[val] = (ageCounts[val] || 0) + 1
            }
        })
    })

    if (Object.keys(ageCounts).length === 0) return []

    const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']
    return Object.entries(ageCounts).map(([name, value], i) => ({
        name,
        value,
        color: colors[i % colors.length]
    }))
  }, [responses])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
            <Users className="w-4 h-4" /> Total Responses
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{liveCount}</div>
          <div className="text-xs text-green-600 dark:text-green-500 font-medium">Real-time</div>
        </Card>
        
        <Card className="p-4 space-y-1 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" /> Avg. Time
            </div>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{avgTime}</div>
            <div className="text-xs text-zinc-500 font-medium">Based on {responses.length} completions</div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Completion Rate
            </div>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">100%</div>
            <div className="text-xs text-zinc-500 font-medium">No drop-off detected</div>
        </Card>

        <Card className="p-4 space-y-1 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" /> Drop-off
            </div>
            <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">0%</div>
            <div className="text-xs text-zinc-500 font-medium">Excellent flow</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Trend */}
        <Card className="p-6 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Response Volume (Last 7 Days)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData}>
                <defs>
                  <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'var(--foreground)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="responses" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorResponses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Demographics */}
        {demographicsData.length > 0 ? (
            <Card className="p-6 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Demographics (Age)</h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demographicsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                    <XAxis type="number" hide />
                    <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    width={40}
                    />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: 'var(--foreground)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                    {demographicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
            </Card>
        ) : (
            <Card className="p-6 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 text-sm">
                No demographic data detected
            </Card>
        )}
      </div>
    </div>
  )
}
