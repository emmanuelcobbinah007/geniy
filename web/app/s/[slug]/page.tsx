"use client";

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { SurveyRenderer } from "@/components/survey/SurveyRenderer"

export default function PublicSurveyPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (slug) {
      loadSurvey()
    }
  }, [slug])

  const loadSurvey = async () => {
    try {
      const data = await api.getSurveyBySlug(slug)
      setSurvey(data)
    } catch (err) {
      setError("Failed to load survey")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <SurveyRenderer surveyData={survey} slug={slug} />
    </div>
  )
}
