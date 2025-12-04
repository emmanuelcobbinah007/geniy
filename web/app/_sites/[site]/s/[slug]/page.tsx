import { Metadata } from "next"
import { api } from "@/lib/api"
import { SurveyPageClient } from "@/app/s/[slug]/SurveyPageClient"

interface PageProps {
  params: {
    site: string
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const survey = await api.getSurveyBySlug(params.slug)
    return {
      title: survey.title || "Survey",
      description: survey.campaign?.name || "Please take a moment to complete this survey.",
    }
  } catch (error) {
    return {
      title: "Survey Not Found",
    }
  }
}

export default async function CustomDomainSurveyPage({ params }: PageProps) {
  let surveyData = null;
  
  try {
    // We can use the same API because the slug is unique globally
    surveyData = await api.getSurveyBySlug(params.slug)
  } catch (error) {
    console.error("Failed to pre-fetch survey:", error)
  }

  return <SurveyPageClient slug={params.slug} initialSurveyData={surveyData} />
}
