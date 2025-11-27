"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Eye, Play } from "lucide-react"
import { useState, useEffect } from "react"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/context/auth-context"
import { GeniyChat } from "@/components/create-survey/GeniyChat"
import { SurveyEditor } from "@/components/create-survey/SurveyEditor"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
// import { useToast } from "@/components/ui/use-toast"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SurveyRenderer } from "@/components/survey/SurveyRenderer"

export default function CreateSurveyPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, isLoading, token } = useAuth()
  const router = useRouter()

  const [title, setTitle] = useState("Market Research Survey")
  const [description, setDescription] = useState("")
  const [questions, setQuestions] = useState([
    { id: 1, type: "multiple_choice", title: "What is your primary goal?", required: true, options: ["Market Research", "Product Feedback", "Customer Satisfaction"], logic: [] as any[] }
  ])
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true)
    }
  }, [isLoading, user])

  const getSurveyData = () => {
    return {
        questions: questions.reduce((acc: any, q: any, index: number, arr: any[]) => {
            const isLast = index === arr.length - 1;
            acc[`Q${q.id}`] = {
                type: q.type,
                question: q.title,
                options: q.options,
                required: q.required,
                next: isLast ? "END" : `Q${q.id + 1}`,
                branches: q.logic?.map((l: any) => ({
                    if: l.if,
                    next: l.then === "end" ? "END" : `Q${l.then}`
                }))
            };
            return acc;
        }, {})
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  const handlePublish = async () => {
    if (isLoading) return

    if (!user || !token) {
      setShowAuthModal(true)
      return
    }

    setIsPublishing(true)
    try {
      const payload = {
        workspaceId: user.workspaces?.[0]?.id, 
        name: title,
        description: description,
        surveyTitle: title,
        questions: {
            title: title,
            version: "1.0",
            ...getSurveyData()
        }
      }

      const result = await api.createCampaign(payload, token);
      router.push(`/dashboard/campaigns/${result.campaign.id}`);

    } catch (error) {
      console.error("Failed to publish:", error)
      alert("Failed to publish survey. Please try again.")
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} onSuccess={handleAuthSuccess} />
      
      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <SurveyRenderer 
                surveyData={getSurveyData()} 
                isPreview={true} 
            />
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-500 hover:text-foreground transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">New Survey</span>
            <span className="text-zinc-400 text-sm">/</span>
            <Input 
              className="h-8 w-48 bg-transparent border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 text-sm font-medium text-foreground placeholder:text-zinc-400 px-2 transition-all" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-500 hover:text-foreground"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button 
            size="sm" 
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-medium"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? "Publishing..." : (
                <>
                <Play className="w-3 h-3 mr-2" />
                Publish
                </>
            )}
          </Button>
        </div>
      </header>

      {/* Split View Content */}
      <div className="flex-1 flex items-start">
        {/* Left Panel: Geniy Chat (30%) - Sticky */}
        <div className="w-[30%] min-w-[320px] max-w-[450px] sticky top-14 h-[calc(100vh-3.5rem)]">
          <GeniyChat />
        </div>

        {/* Right Panel: Survey Editor (70%) - Natural Flow */}
        <div className="flex-1 min-w-0">
          <SurveyEditor 
            questions={questions} 
            setQuestions={setQuestions}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
          />
        </div>
      </div>
    </main>
  )
}
