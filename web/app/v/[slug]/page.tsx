import { Metadata } from "next"
import { api } from "@/lib/api"
import { VoiceSurveyPageClient } from "./VoiceSurveyPageClient"

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
    const title = `${survey.title || "Survey"} - Voice Mode`
    const description = "Complete this survey using your voice - just speak naturally!"
    
    return {
      title: title,
      description: description,
      openGraph: {
        title: title,
        description: description,
        type: "website",
        siteName: "Geniy",
      },
    }
  } catch (error) {
    return {
      title: "Voice Survey | Geniy",
      description: "Voice-powered survey experience",
    }
  }
}

export default async function VoiceSurveyPage({ params }: PageProps) {
  const { slug } = await params
  let surveyData = null;
  
  try {
    surveyData = await api.getSurveyBySlug(slug)
  } catch (error) {
    console.error("Failed to pre-fetch survey:", error)
  }

  return <VoiceSurveyPageClient slug={slug} initialSurveyData={surveyData} />
}
