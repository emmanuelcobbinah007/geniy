"use client";

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { SurveyRenderer } from "@/components/survey/SurveyRenderer"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"

interface SurveyPageClientProps {
  slug: string
  initialSurveyData: any
}

export function SurveyPageClient({ slug, initialSurveyData }: SurveyPageClientProps) {
  const [survey, setSurvey] = useState<any>(initialSurveyData)
  const [loading, setLoading] = useState(!initialSurveyData)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!initialSurveyData && slug) {
      loadSurvey()
    }
  }, [slug, initialSurveyData])

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

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <GenStateIllustration state="loading" label="Loading survey..." />
    </div>
  )
  if (error) return (
    <div className="h-screen flex items-center justify-center">
      <GenStateIllustration state="error" label={error} />
    </div>
  )

  return (
    <div className="h-screen flex flex-col">
      <SurveyRenderer 
        surveyData={survey} 
        slug={slug} 
        theme={survey.themeConfig || undefined}
      />
    </div>
  )
}
