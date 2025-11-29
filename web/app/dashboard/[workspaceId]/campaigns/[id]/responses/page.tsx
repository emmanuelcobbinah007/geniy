"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
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
import { format } from "date-fns"

import { use } from "react"

export default function CampaignResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { token } = useAuth()
  const [responses, setResponses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResponses = async () => {
      if (!token) return
      try {
        const data = await api.getCampaignResponses(id, token)
        setResponses(data)
      } catch (error) {
        console.error("Failed to fetch responses:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResponses()
  }, [id, token])

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
            <Link href={`/dashboard/campaigns/${id}`} className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Campaign
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-zinc-900 dark:text-white">Survey Responses</h1>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Responses Table */}
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
    </div>
  )
}
