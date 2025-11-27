"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"

interface SurveyRendererProps {
  surveyData: any;
  slug?: string; // Required for submission if not preview
  isPreview?: boolean;
  onComplete?: () => void;
}

export function SurveyRenderer({ surveyData, slug, isPreview = false, onComplete }: SurveyRendererProps) {
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (surveyData?.jsonSchema?.questions) {
      const questions = surveyData.jsonSchema.questions
      const firstKey = Object.keys(questions)[0]
      setCurrentQuestionId(firstKey)
    } else if (surveyData?.questions) {
        // Handle direct questions object (from preview state)
        const questions = surveyData.questions
        const firstKey = Object.keys(questions)[0]
        setCurrentQuestionId(firstKey)
    }
  }, [surveyData])

  const getQuestions = () => {
      return surveyData?.jsonSchema?.questions || surveyData?.questions || {}
  }

  const handleAnswer = (value: any) => {
    if (!currentQuestionId) return

    const newAnswers = { ...answers, [currentQuestionId]: value }
    setAnswers(newAnswers)

    // Determine next question
    const questions = getQuestions()
    const currentQ = questions[currentQuestionId]
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
      setCurrentQuestionId(nextQId)
    }
  }

  const submitSurvey = async (finalAnswers: any) => {
    if (isPreview) {
      setIsCompleted(true)
      if (onComplete) onComplete()
      return
    }

    if (!slug) return

    setIsSubmitting(true)
    try {
      await api.submitResponse(slug, finalAnswers)
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

  return (
    <div className="flex flex-col h-full w-full bg-zinc-50 dark:bg-zinc-950">
      {/* Progress Bar (Simple) */}
      <div className="h-1 bg-zinc-200 dark:bg-zinc-800 w-full shrink-0">
        <div 
            className="h-full bg-violet-600 transition-all duration-500"
            style={{ width: `${isCompleted ? 100 : (Object.keys(answers).length / Object.keys(questions).length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto w-full overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isCompleted && currentQ && (
            <motion.div
              key={currentQuestionId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {currentQ.question}
                </h2>
                {currentQ.required && <span className="text-xs text-red-500 uppercase tracking-wider font-medium">Required</span>}
              </div>

              <div className="space-y-3">
                {currentQ.type === "multiple_choice" && (
                  <div className="grid gap-3">
                    {currentQ.options?.map((opt: string) => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between group"
                      >
                        {opt}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-violet-500" />
                      </button>
                    ))}
                  </div>
                )}

                {(currentQ.type === "text" || currentQ.type === "short_text" || currentQ.type === "long_text") && (
                  <div className="flex gap-2">
                    <Input 
                      className="h-12 text-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      placeholder="Type your answer..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAnswer(e.currentTarget.value)
                        }
                      }}
                    />
                    <Button size="icon" className="h-12 w-12 shrink-0" onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                        handleAnswer(input.value)
                    }}>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {currentQ.type === "rating" && (
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                onClick={() => handleAnswer(rating)}
                                className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all font-bold text-lg"
                            >
                                {rating}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* Fallback for other types */}
                {!["multiple_choice", "text", "short_text", "long_text", "rating"].includes(currentQ.type) && (
                    <div className="text-red-500">Unsupported question type: {currentQ.type}</div>
                )}
              </div>
            </motion.div>
          )}

          {isCompleted && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600 dark:text-green-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Thank you!</h1>
                <p className="text-zinc-500 text-lg">Your response has been recorded.</p>
              </div>
              <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
                Your feedback is incredibly valuable and will help us build a beautiful product tailored to your needs.
              </p>
              {isPreview && (
                <Button variant="outline" className="mt-8" onClick={() => {
                    setAnswers({})
                    setIsCompleted(false)
                    const questions = getQuestions()
                    setCurrentQuestionId(Object.keys(questions)[0])
                }}>
                    Restart Preview
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-4 text-center text-xs text-zinc-400 shrink-0">
        Powered by <span className="font-bold text-zinc-600 dark:text-zinc-300">Geniy</span>
      </div>
    </div>
  )
}
