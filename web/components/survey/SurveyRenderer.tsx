"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { api } from "@/lib/api"
import { Theme } from "./ThemeEditor"
import { FocusLayout } from "./layouts/FocusLayout"
import { BookLayout } from "./layouts/BookLayout"
import { DeckLayout } from "./layouts/DeckLayout"
import { TerminalLayout } from "./layouts/TerminalLayout"
import { Celebrations } from "./Celebrations"

// Supported Google Fonts for surveys
const GOOGLE_FONTS = [
  'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Playfair Display', 'Merriweather', 'Roboto Mono', 'Space Grotesk', 'DM Sans'
]

interface SurveyRendererProps {
  surveyData: any;
  slug?: string; // Required for submission if not preview
  isPreview?: boolean;
  onComplete?: () => void;
  theme?: Theme;
}

export function SurveyRenderer({ surveyData, slug, isPreview = false, onComplete, theme }: SurveyRendererProps) {
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  
  // Gamification state
  const [celebrationTrigger, setCelebrationTrigger] = useState<'answer' | 'milestone' | 'complete' | null>(null)
  const [currentMilestone, setCurrentMilestone] = useState<number | undefined>(undefined)
  const lastMilestoneRef = useRef<number>(0)

  // Load Google Font dynamically
  useEffect(() => {
    if (theme?.fontFamily && GOOGLE_FONTS.includes(theme.fontFamily)) {
      const fontName = theme.fontFamily.replace(/ /g, '+')
      const linkId = `google-font-${fontName}`
      
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`
        document.head.appendChild(link)
      }
    }
  }, [theme?.fontFamily])

  useEffect(() => {
    if (surveyData?.jsonSchema?.questions) {
      const questions = surveyData.jsonSchema.questions
      const firstKey = Object.keys(questions)[0]
      setCurrentQuestionId(firstKey)
      setHistory([])
    } else if (surveyData?.questions) {
        // Handle direct questions object (from preview state)
        const questions = surveyData.questions
        const firstKey = Object.keys(questions)[0]
        setCurrentQuestionId(firstKey)
        setHistory([])
    }
  }, [surveyData])

  const getQuestions = () => {
      return surveyData?.jsonSchema?.questions || surveyData?.questions || {}
  }

  const handleBack = () => {
    if (history.length === 0) return
    const prevQuestionId = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    setCurrentQuestionId(prevQuestionId)
  }

  const handleRestart = () => {
    setAnswers({})
    setIsCompleted(false)
    const questions = getQuestions()
    setCurrentQuestionId(Object.keys(questions)[0])
    setHistory([])
    lastMilestoneRef.current = 0
  }

  // Check for milestones
  const checkMilestone = useCallback((answeredCount: number, total: number) => {
    const progress = (answeredCount / total) * 100
    const milestones = [25, 50, 75]
    
    for (const m of milestones) {
      if (progress >= m && lastMilestoneRef.current < m) {
        lastMilestoneRef.current = m
        setCurrentMilestone(m)
        setCelebrationTrigger('milestone')
        return
      }
    }
  }, [])

  const handleAnswer = (value: any) => {
    if (!currentQuestionId) return

    // Validation
    const questions = getQuestions()
    const currentQ = questions[currentQuestionId]
    
    if (currentQ.required && (value === null || value === "" || (Array.isArray(value) && value.length === 0))) {
        alert("This question is required.")
        return
    }

    const newAnswers = { ...answers, [currentQuestionId]: value }
    setAnswers(newAnswers)

    // Check for milestone celebration
    const totalQuestions = Object.keys(questions).length
    const answeredCount = Object.keys(newAnswers).length
    checkMilestone(answeredCount, totalQuestions)

    // Determine next question
    let nextQId = currentQ.next

    // Check branches
    if (currentQ.branches) {
      for (const branch of currentQ.branches) {
        if (branch.if === true || branch.if === value) {
          nextQId = branch.next
          break
        }
      }
    }

    if (nextQId === "END" || !nextQId || !questions[nextQId]) {
      submitSurvey(newAnswers)
    } else {
      setHistory(prev => [...prev, currentQuestionId])
      setCurrentQuestionId(nextQId)
    }
  }

  const startTime = useRef<number>(Date.now())

  const isSubmittingRef = useRef(false)

  const submitSurvey = async (finalAnswers: any) => {
    if (isPreview) {
      setIsCompleted(true)
      setCelebrationTrigger('complete')
      if (onComplete) onComplete()
      return
    }

    if (!slug) return
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    setIsSubmitting(true)
    try {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000) // in seconds
      const metadata = {
        timeTaken,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
      
      await api.submitResponse(slug, finalAnswers, metadata)
      setIsCompleted(true)
      setCelebrationTrigger('complete')
      if (onComplete) onComplete()
    } catch (err) {
      alert("Failed to submit response. Please try again.")
      // Only unlock on error to allow retry. 
      // On success, we stay locked to prevent post-completion submissions.
      isSubmittingRef.current = false 
    } finally {
      setIsSubmitting(false)
    }
  }

  const questions = getQuestions()
  const currentQ = currentQuestionId ? questions[currentQuestionId] : null
  const totalQuestions = Object.keys(questions).length
  const timeTaken = Math.round((Date.now() - startTime.current) / 1000)

  const [hasStarted, setHasStarted] = useState(false)

  // Extract metadata
  const title = surveyData?.title || surveyData?.name || "Survey"
  const description = surveyData?.description || "Please answer the following questions."

  // Layout Engine
  const LayoutComponent = {
      'focus': FocusLayout,
      'book': BookLayout,
      'deck': DeckLayout,
      'terminal': TerminalLayout
  }[theme?.layout as 'focus' | 'book' | 'deck' | 'terminal' || 'focus']

  return (
      <>
          {/* Celebration animations */}
          <Celebrations 
            trigger={celebrationTrigger}
            milestone={currentMilestone}
            onComplete={() => {
              setCelebrationTrigger(null)
              setCurrentMilestone(undefined)
            }}
          />
          
          <LayoutComponent 
              currentQ={currentQ}
              currentQuestionId={currentQuestionId}
              isCompleted={isCompleted}
              history={history}
              totalQuestions={totalQuestions}
              theme={theme}
              onAnswer={handleAnswer}
              onBack={handleBack}
              onRestart={handleRestart}
              isPreview={isPreview}
              hasStarted={hasStarted}
              onStart={() => setHasStarted(true)}
              title={title}
              description={description}
              // Pass company name if available in surveyData
              companyName={surveyData?.companyName || "Geniy"} 
          />
      </>
  )
}

