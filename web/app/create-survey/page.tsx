"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Eye, Play, Sparkles, X, ChevronLeft, ChevronRight, GripVertical, Palette } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { userFriendlyError } from "@/lib/error-utils"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/context/auth-context"
import { GeniyChat } from "@/components/create-survey/GeniyChat"
import { SurveyEditor } from "@/components/create-survey/SurveyEditor"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SurveyRenderer } from "@/components/survey/SurveyRenderer"
import { ShareModal } from "@/components/create-survey/ShareModal"
import { WorkspaceSelectionModal } from "@/components/create-survey/WorkspaceSelectionModal"
import { useSearchParams } from "next/navigation"
import { ThemeEditor, Theme, DEFAULT_THEME } from "@/components/survey/ThemeEditor"

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
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME)
  const [showThemePanel, setShowThemePanel] = useState(false)

  const [contextData, setContextData] = useState<any>(null)

  const [initialContext, setInitialContext] = useState<string>("")

  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [createdCampaignId, setCreatedCampaignId] = useState("")


  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspaceId")
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false)
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX
        if (newWidth > 280 && newWidth < 800) {
            setSidebarWidth(newWidth)
        }
      }
    },
    [isResizing]
  )

  useEffect(() => {
    if (isResizing) {
        window.addEventListener("mousemove", resize)
        window.addEventListener("mouseup", stopResizing)
    }
    return () => {
      window.removeEventListener("mousemove", resize)
      window.removeEventListener("mouseup", stopResizing)
    }
  }, [isResizing, resize, stopResizing])

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
        title: title,
        description: description,
        questions: questions.reduce((acc: any, q: any) => {
            acc[`Q${q.id}`] = {
                type: q.type,
                question: q.title,
                options: q.options,
                required: q.required,
                next: nextMap[q.id],
                branches: q.logic
                    ?.filter((l: any) => 
                        // Only include rules that have both a condition AND a destination
                        l.if !== undefined && l.if !== null && l.if !== "" && 
                        l.then !== undefined && l.then !== null && l.then !== ""
                    )
                    .map((l: any) => ({
                        if: l.if,
                        next: l.then === "end" ? "END" : `Q${l.then}`
                    })) || undefined
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
        themeConfig: theme, // Include theme customization
        questions: {
            version: "1.0",
            ...getSurveyData()
        },

      }

      const result = await api.createCampaign(payload, token);
      
      // Show Share Modal instead of immediate redirect
      const url = `${window.location.origin}/s/${result.survey.publicSlug}`;
      setShareUrl(url);
      setCreatedCampaignId(result.campaign.id);
      setShowShareModal(true);

    } catch (error) {
      console.error("Failed to publish:", error)
      alert(userFriendlyError(error))
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
            variant={showThemePanel ? "secondary" : "ghost"}
            size="sm" 
            className={cn(
              "px-2",
              showThemePanel ? "text-violet-600 bg-violet-100 dark:bg-violet-900/30" : "text-zinc-500 hover:text-foreground"
            )}
            onClick={() => setShowThemePanel(!showThemePanel)}
          >
            <Palette className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Theme</span>
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
        {/* Left Panel: Geniy Chat - Resizable & Animated on Mobile */}
        {/* Desktop Sidebar */}
        <div 
            ref={sidebarRef}
            className={cn(
                "hidden md:flex bg-background border-r border-zinc-200 dark:border-zinc-800 relative flex-col shrink-0 sticky top-14 h-[calc(100vh-3.5rem)]",
                !isResizing && "transition-[width] duration-300 ease-in-out"
            )}
            style={{ 
                width: isCollapsed ? 20 : sidebarWidth 
            }}
        >
            {/* Collapse Toggle Button */}
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -right-3 top-6 z-50 h-6 w-6 rounded-full border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 flex items-center justify-center p-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>

            {/* Chat Content */}
            <div className={cn("flex-1 overflow-hidden w-full h-full", isCollapsed && "opacity-0 invisible")}>
                <GeniyChat 
                    setQuestions={setQuestions}
                    setTitle={setTitle}
                    setDescription={setDescription}
                    setContextData={setContextData}
                    initialContext={initialContext}
                    workspaceId={workspaceId || user?.workspaces?.[0]?.id}
                    initialPrompt={searchParams.get("prompt") || undefined}
                />
            </div>

            {/* Drag Handle */}
            {!isCollapsed && (
                <div
                    className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 transition-colors z-10 group"
                    onMouseDown={startResizing}
                >
                    <div className="absolute top-1/2 -translate-y-1/2 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-8 w-4 text-zinc-400" />
                    </div>
                </div>
            )}
        </div>

        {/* Mobile Chat FAB */}
        <div className="md:hidden fixed bottom-6 right-6 z-50">
            <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg bg-violet-600 hover:bg-violet-700 text-white p-0 overflow-hidden"
                onClick={() => setIsMobileChatOpen(true)}
            >
                <Image src="/gen_states/gen_thinking.png" alt="Gen" width={56} height={56} className="w-full h-full object-cover" />
            </Button>
        </div>

        {/* Mobile Chat Drawer */}
        <AnimatePresence>
            {isMobileChatOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileChatOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="md:hidden fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-zinc-900 rounded-t-3xl shadow-xl z-50 flex flex-col overflow-hidden border-t border-zinc-200 dark:border-zinc-800"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Image src="/gen_states/gen_thinking.png" alt="Gen Thinking" width={40} height={40}/>
                                <div>
                                    <h3 className="font-semibold text-sm">Geniy Assistant</h3>
                                    <p className="text-xs text-zinc-500">AI Research Partner</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsMobileChatOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex-1 min-h-0">
                            <GeniyChat 
                                setQuestions={setQuestions}
                                setTitle={setTitle}
                                setDescription={setDescription}
                                setContextData={setContextData}
                                initialContext={initialContext}
                                workspaceId={workspaceId || user?.workspaces?.[0]?.id}
                                hideHeader={true}
                                initialPrompt={searchParams.get("prompt") || undefined}
                            />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        {/* Right Panel: Survey Editor (70%) - Natural Flow */}
        <div className="flex-1 min-w-0 flex">
          <div className={cn("flex-1 transition-all duration-300", showThemePanel && "md:pr-80")}>
            <SurveyEditor 
              questions={questions} 
              setQuestions={setQuestions}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
            />
          </div>
          
          {/* Theme Panel - Slides in from right */}
          <AnimatePresence>
            {showThemePanel && (
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto z-40 shadow-xl"
              >
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900">
                  <h3 className="font-semibold flex items-center gap-2">
                    Survey Theme
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowThemePanel(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-4">
                  <ThemeEditor theme={theme} onThemeChange={setTheme} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
