import { Metadata } from "next"
import { api } from "@/lib/api"
import { SurveyPageClient } from "./SurveyPageClient"

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const survey = await api.getSurveyBySlug(params.slug)
    return {
      title: survey.title || "Survey | Geniy",
      description: survey.campaign?.name || "Please take a moment to complete this survey.",
    }
  } catch (error) {
    return {
      title: "Survey Not Found | Geniy",
    }
  }
}

export default async function PublicSurveyPage({ params }: PageProps) {
  let surveyData = null;
  
  try {
    surveyData = await api.getSurveyBySlug(params.slug)
  } catch (error) {
    // We'll let the client component handle the error state or we could render an error here
    console.error("Failed to pre-fetch survey:", error)
  }

  return <SurveyPageClient slug={params.slug} initialSurveyData={surveyData} />
}
