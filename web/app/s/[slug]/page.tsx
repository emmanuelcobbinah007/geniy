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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> 
{
  const { slug } = await params
  try {
    const survey = await api.getSurveyBySlug(slug)
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
  const { slug } = await params
  let surveyData = null;
  
  try {
    surveyData = await api.getSurveyBySlug(slug)
  } catch (error) {
    console.error("Failed to pre-fetch survey:", error)
  }

  return <SurveyPageClient slug={slug} initialSurveyData={surveyData} />
}
