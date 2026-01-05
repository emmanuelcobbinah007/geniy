"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { VoiceSurveyRenderer } from "@/components/survey/VoiceSurveyRenderer"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"

interface VoiceSurveyPageClientProps {
    slug: string
    initialSurveyData?: any
}

export function VoiceSurveyPageClient({ slug, initialSurveyData }: VoiceSurveyPageClientProps) {
    const [surveyData, setSurveyData] = useState(initialSurveyData)
    const [loading, setLoading] = useState(!initialSurveyData)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!initialSurveyData) {
            const fetchSurvey = async () => {
                try {
                    const data = await api.getSurveyBySlug(slug)
                    setSurveyData(data)
                } catch (err: any) {
                    setError(err.message || "Survey not found")
                } finally {
                    setLoading(false)
                }
            }
            fetchSurvey()
        }
    }, [slug, initialSurveyData])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-zinc-950 to-zinc-900 flex items-center justify-center">
                <GenStateIllustration state="loading" label="Loading survey..." />
            </div>
        )
    }

    if (error || !surveyData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-zinc-950 to-zinc-900 flex items-center justify-center p-6">
                <div className="text-center">
                    <GenStateIllustration state="error" label="Survey not found" />
                    <p className="text-zinc-400 mt-4">This survey may have been removed or the link is incorrect.</p>
                </div>
            </div>
        )
    }

    return (
        <VoiceSurveyRenderer
            surveyData={surveyData}
            slug={slug}
            isPreview={false}
        />
    )
}
