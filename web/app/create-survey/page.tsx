"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Eye, Play, Sparkles, X } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/context/auth-context"
import { GeniyChat } from "@/components/create-survey/GeniyChat"
import { SurveyEditor } from "@/components/create-survey/SurveyEditor"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
// import { useToast } from "@/components/ui/use-toast"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SurveyRenderer } from "@/components/survey/SurveyRenderer"
import { ShareModal } from "@/components/create-survey/ShareModal"
import { WorkspaceSelectionModal } from "@/components/create-survey/WorkspaceSelectionModal"
import { useSearchParams } from "next/navigation"
import { ThemeEditor, Theme } from "@/components/survey/ThemeEditor"
import { Palette } from "lucide-react"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"

import { Suspense } from "react"

function CreateSurveyContent() {
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

  const [contextData, setContextData] = useState<any>(null)

  const [initialContext, setInitialContext] = useState<string>("")

  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [createdCampaignId, setCreatedCampaignId] = useState("")
  const [showCustomize, setShowCustomize] = useState(false)
  const [theme, setTheme] = useState<Theme>({
    mode: 'system',
    layout: 'focus',
    primaryColor: "#7c3aed",
    backgroundColor: "#ffffff",
    textColor: "#18181b",
    accentColor: "#f4f4f5",
    fontFamily: "Inter",
    borderRadius: "0.5rem"
  })

  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspaceId")
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true)
    } else if (user && token) {
        if (workspaceId) {
            // Workspace selected, fetch context
            api.getContext(workspaceId, token).then(data => {
                if (data?.businessContext) {
                    setInitialContext(data.businessContext)
                }
            }).catch(err => console.error("Failed to fetch context:", err))
        } else {
            // No workspace selected, show selection modal
            // Only if we have workspaces to select from, otherwise force create? 
            // The modal handles both cases.
            setShowWorkspaceModal(true)
        }
    }
  }, [isLoading, user, token, workspaceId])

  const getSurveyData = () => {
    // Calculate "Next" targets based on logic (Auto-Merge)
    const nextMap: Record<number, string> = {};
    
    // Initialize with default linear flow
    questions.forEach((q, index) => {
        const isLast = index === questions.length - 1;
        nextMap[q.id] = isLast ? "END" : `Q${q.id + 1}`;
    });

    // Apply merge logic
    questions.forEach((q) => {
        if (q.logic && q.logic.length > 0) {
            const targets = q.logic.map((l: any) => l.then === "end" ? -1 : parseInt(l.then));
            const validTargets = targets.filter((t: number) => t !== -1);
            
            if (validTargets.length > 0) {
                const maxTarget = Math.max(...validTargets);
                const mergePoint = `Q${maxTarget + 1}`;
                
                // Set the 'next' for all questions in the range to the merge point
                // This ensures that Q2 and Q3 both jump to Q4 if Q1 branches to them
                for (let i = q.id + 1; i <= maxTarget; i++) {
                    // Only update if it's not the last question (which should stay END unless overridden by a larger scope? No, END is final)
                    // Actually, we just update the map. If i is the last question, maxTarget would be >= i.
                    // We need to be careful not to overwrite "END" if we are at the end of the survey, 
                    // but if logic jumps to the last question, then the merge point is "END" (or Q_last+1 which doesn't exist).
                    
                    // If maxTarget is the last question, mergePoint should be END
                    const isMaxLast = maxTarget === questions[questions.length - 1].id;
                    const finalMerge = isMaxLast ? "END" : mergePoint;
                    
                    if (nextMap[i] !== "END") {
                         nextMap[i] = finalMerge;
                    }
                }
            }
        }
    });

    return {
        questions: questions.reduce((acc: any, q: any) => {
            acc[`Q${q.id}`] = {
                type: q.type,
                question: q.title,
                options: q.options,
                required: q.required,
                next: nextMap[q.id],
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
        workspaceId: workspaceId || user.workspaces?.[0]?.id, // Fallback just in case, but modal should ensure workspaceId
        name: title,
        description: description,
        surveyTitle: title,
        contextData: contextData, // Pass the AI context data
        questions: {
            title: title,
            version: "1.0",

            ...getSurveyData()
        },
        themeConfig: theme
      }

      const result = await api.createCampaign(payload, token);
      
      // Show Share Modal instead of immediate redirect
      const url = `${window.location.origin}/s/${result.survey.publicSlug}`;
      setShareUrl(url);
      setCreatedCampaignId(result.campaign.id);
      setShowShareModal(true);

    } catch (error) {
      console.error("Failed to publish:", error)
      alert("Failed to publish survey. Please try again.")
    } finally {
      setIsPublishing(false)
    }
  }

  const handleDashboardRedirect = () => {
      router.push(`/dashboard/${workspaceId || user?.workspaces?.[0]?.id}/campaigns/${createdCampaignId}`);
  }

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} onSuccess={handleAuthSuccess} />
      <WorkspaceSelectionModal open={showWorkspaceModal} onOpenChange={setShowWorkspaceModal} />
      <ShareModal 
        open={showShareModal} 
        onOpenChange={setShowShareModal} 
        shareUrl={shareUrl} 
        onDashboard={handleDashboardRedirect} 
      />
      
      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <SurveyRenderer 
                surveyData={getSurveyData()} 
                isPreview={true} 
                theme={theme}
            />
        </DialogContent>
      </Dialog>

      {/* Customize Modal */}
      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="max-w-6xl h-[90vh] md:h-[80vh] p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 h-[40%] md:h-full border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 p-4 md:p-6 overflow-y-auto bg-white dark:bg-zinc-950">
                <div className="flex items-center gap-2 mb-4 md:mb-6 sticky top-0 bg-white dark:bg-zinc-950 z-10 py-2">
                    <Palette className="w-5 h-5 text-violet-600" />
                    <h2 className="font-semibold text-lg">Customize Theme</h2>
                </div>
                <ThemeEditor theme={theme} onThemeChange={setTheme} />
            </div>
            <div className="w-full md:flex-1 h-[60%] md:h-full bg-zinc-100 dark:bg-zinc-900/50 p-4 md:p-8 overflow-y-auto flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="w-full max-w-md h-full max-h-[600px] bg-white dark:bg-zinc-900 shadow-xl rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 scale-90 md:scale-100 transition-transform origin-center flex flex-col">
                        <SurveyRenderer 
                            surveyData={getSurveyData()} 
                            isPreview={true} 
                            theme={theme}
                        />
                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="sticky top-0 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-3 md:px-4 shrink-0 z-50 gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-500 hover:text-foreground transition-colors shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="hidden md:block h-6 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="hidden md:inline font-semibold text-sm shrink-0">New Survey</span>
            <span className="hidden md:inline text-zinc-400 text-sm shrink-0">/</span>
            <Input 
              className="h-8 w-full md:w-48 bg-transparent border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 text-sm font-medium text-foreground placeholder:text-zinc-400 px-2 transition-all min-w-[100px]" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={isMobileChatOpen ? "secondary" : "ghost"}
            size="sm"
            className="md:hidden text-violet-600 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/30 px-2"
            onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
          >
            {isMobileChatOpen ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">{isMobileChatOpen ? "Close" : "AI"}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-500 hover:text-foreground px-2"
            onClick={() => setShowCustomize(true)}
          >
            <Palette className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Customize</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-zinc-500 hover:text-foreground px-2"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Preview</span>
          </Button>
          <Button 
            size="sm" 
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-medium px-3"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? (
                <span className="text-xs">Saving...</span>
            ) : (
                <>
                <Play className="w-3 h-3 md:mr-2" />
                <span className="hidden md:inline">Publish</span>
                </>
            )}
          </Button>
        </div>
      </header>

      {/* Split View Content */}
      <div className="flex-1 flex items-start relative">
        {/* Left Panel: Geniy Chat (30%) - Sticky on Desktop, Fixed Overlay on Mobile */}
        <div className={cn(
            "bg-background border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out",
            // Desktop Styles
            "md:block md:w-[30%] md:min-w-[320px] md:max-w-[450px] md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:z-0",
            // Mobile Styles
            isMobileChatOpen ? "fixed inset-0 top-14 z-40 w-full h-[calc(100vh-3.5rem)] block" : "hidden"
        )}>
          <GeniyChat 
            setQuestions={setQuestions}
            setTitle={setTitle}
            setDescription={setDescription}
            setContextData={setContextData}
            initialContext={initialContext}
            workspaceId={workspaceId || user?.workspaces?.[0]?.id}
          />
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

export default function CreateSurveyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <GenStateIllustration state="loading" label="Loading editor..." />
      </div>
    }>
      <CreateSurveyContent />
    </Suspense>
  )
}
