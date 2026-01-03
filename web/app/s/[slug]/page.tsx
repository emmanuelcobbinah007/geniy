import { Metadata } from "next"
import { api } from "@/lib/api"
import { SurveyPageClient } from "./SurveyPageClient"

export async function generateStaticParams() {
  return [] 
}

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  try {
    const survey = await api.getSurveyBySlug(slug)
    const title = survey.title || "Survey"
    const description = survey.campaign?.name || survey.description || "Please take a moment to complete this survey."
    
    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        type: "website",
        siteName: "Geniy",
      },
      twitter: {
        card: "summary",
        title: title,
        description: description,
      },
    }
  } catch (error) {
    return {
      title: "Survey Not Found | Geniy",
      description: "This survey could not be found or may no longer be available.",
    }
  }
}

export default async function PublicSurveyPage({ params }: PageProps) {
  const { slug } = await params
  let surveyData = null;
  
  try {
    surveyData = await api.getSurveyBySlug(slug)
  } catch (error) {
    console.error("Failed to pre-fetch survey:", error)
  }

  return <SurveyPageClient slug={slug} initialSurveyData={surveyData} />
}
