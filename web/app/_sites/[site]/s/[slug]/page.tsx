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
    const title = survey.title || "Survey"
    const description = survey.campaign?.name || survey.description || "Please take a moment to complete this survey."
    
    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        type: "website",
      },
      twitter: {
        card: "summary",
        title: title,
        description: description,
      },
    }
  } catch (error) {
    return {
      title: "Survey Not Found",
      description: "This survey could not be found or may no longer be available.",
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
