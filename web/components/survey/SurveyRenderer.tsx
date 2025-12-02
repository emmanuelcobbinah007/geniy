"use client"

import { useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { Theme } from "./ThemeEditor"
import { FocusLayout } from "./layouts/FocusLayout"
import { BookLayout } from "./layouts/BookLayout"
import { DeckLayout } from "./layouts/DeckLayout"
import { TerminalLayout } from "./layouts/TerminalLayout"

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
  }

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

  const submitSurvey = async (finalAnswers: any) => {
    if (isPreview) {
      setIsCompleted(true)
      if (onComplete) onComplete()
      return
    }

    if (!slug) return

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
      if (onComplete) onComplete()
    } catch (err) {
      alert("Failed to submit response. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const questions = getQuestions()
  const currentQ = currentQuestionId ? questions[currentQuestionId] : null
  const totalQuestions = Object.keys(questions).length

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
      />
  )
}
