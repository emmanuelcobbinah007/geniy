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

export default function CreateSurveyPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true)
    }
  }, [isLoading, user])

  return (
    <main className="h-screen flex flex-col bg-background text-foreground font-sans overflow-hidden">
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      
      {/* Header */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-zinc-500 hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">New Survey</span>
            <span className="text-zinc-400 text-sm">/</span>
            <Input 
              className="h-8 w-48 bg-transparent border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 text-sm font-medium text-foreground placeholder:text-zinc-400 px-2 transition-all" 
              defaultValue="Untitled Survey"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-foreground">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-medium">
            <Play className="w-3 h-3 mr-2" />
            Publish
          </Button>
        </div>
      </header>

      {/* Split View Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Geniy Chat (30%) */}
        <div className="w-[30%] min-w-[320px] max-w-[450px] h-full">
          <GeniyChat />
        </div>

        {/* Right Panel: Survey Editor (70%) */}
        <div className="flex-1 h-full relative">
          <SurveyEditor />
        </div>
      </div>
    </main>
  )
}
