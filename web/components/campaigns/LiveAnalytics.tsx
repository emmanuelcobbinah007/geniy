"use client"

import { Card } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Users, TrendingUp, Clock, MousePointerClick } from "lucide-react"
import { useState, useEffect } from "react"

const data = [
  { name: 'Mon', responses: 40 },
  { name: 'Tue', responses: 30 },
  { name: 'Wed', responses: 20 },
  { name: 'Thu', responses: 27 },
  { name: 'Fri', responses: 18 },
  { name: 'Sat', responses: 23 },
  { name: 'Sun', responses: 34 },
];

const demographics = [
  { name: '18-24', value: 35, color: '#8b5cf6' },
  { name: '25-34', value: 45, color: '#a78bfa' },
  { name: '35-44', value: 15, color: '#c4b5fd' },
  { name: '45+', value: 5, color: '#ddd6fe' },
];

export function LiveAnalytics({ totalResponses = 0 }: { totalResponses?: number }) {
  const [liveCount, setLiveCount] = useState(totalResponses)

  // Update live count when prop changes
  useEffect(() => {
    setLiveCount(totalResponses)
  }, [totalResponses])

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
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">2m 14s</div>
          <div className="text-xs text-zinc-500 font-medium">-10s vs benchmark</div>
        </Card>
        <Card className="p-4 space-y-1 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Completion Rate
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">87%</div>
          <div className="text-xs text-green-600 dark:text-green-500 font-medium">+2% this week</div>
        </Card>
        <Card className="p-4 space-y-1 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-2">
            <MousePointerClick className="w-4 h-4" /> Drop-off
          </div>
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Q4</div>
          <div className="text-xs text-zinc-500 font-medium">Pricing Question</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Trend */}
        <Card className="p-6 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Response Volume (Last 7 Days)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
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
        <Card className="p-6 bg-white dark:bg-black border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold mb-6 text-zinc-900 dark:text-zinc-100">Demographics (Age)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demographics} layout="vertical">
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
                  {demographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
