"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api"

interface Theme {
  primaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  fontFamily: string
  borderRadius: string
}

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

  // Ranking Component Logic
  const RankingQuestion = ({ options, onAnswer }: { options: string[], onAnswer: (val: string[]) => void }) => {
    const [ranked, setRanked] = useState<string[]>([])
    const [available, setAvailable] = useState<string[]>(options)

    const handleSelect = (opt: string) => {
        setAvailable(prev => prev.filter(o => o !== opt))
        setRanked(prev => [...prev, opt])
    }

    const handleUnselect = (opt: string) => {
        setRanked(prev => prev.filter(o => o !== opt))
        setAvailable(prev => [...prev, opt])
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Ranked (Top to Bottom)</label>
                {ranked.map((opt, i) => (
                    <div key={opt} onClick={() => handleUnselect(opt)} className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 flex items-center gap-3 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 transition-colors group">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span className="flex-1 font-medium">{opt}</span>
                    </div>
                ))}
                {ranked.length === 0 && <div className="text-sm text-zinc-400 italic p-2">Tap options below to rank them</div>}
            </div>

            {available.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <label className="text-sm font-medium text-zinc-500">Options</label>
                    {available.map((opt) => (
                        <div key={opt} onClick={() => handleSelect(opt)} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-violet-500 cursor-pointer transition-all flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600" />
                            <span>{opt}</span>
                        </div>
                    ))}
                </div>
            )}

            <Button 
                className="w-full mt-4" 
                disabled={available.length > 0} // Require ranking all
                onClick={() => onAnswer(ranked)}
            >
                Confirm Ranking
            </Button>
        </div>
    )
  }

  const themeStyles = theme ? {
    "--primary": theme.primaryColor,
    "--bg": theme.backgroundColor,
    "--text": theme.textColor,
    "--accent": theme.accentColor,
    "--radius": theme.borderRadius,
    "--font": theme.fontFamily,
  } as React.CSSProperties : {}

  return (
    <div 
        className="flex flex-col h-full w-full transition-colors duration-300"
        style={{
            ...themeStyles,
            backgroundColor: theme ? 'var(--bg)' : undefined,
            color: theme ? 'var(--text)' : undefined,
            fontFamily: theme ? 'var(--font)' : undefined,
        }}
    >
      {/* Progress Bar (Simple) */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: theme ? 'var(--accent)' : '#e4e4e7' }}>
        <div 
            className="h-full transition-all duration-500"
            style={{ 
                width: `${isCompleted ? 100 : (Object.keys(answers).length / Object.keys(questions).length) * 100}%`,
                backgroundColor: theme ? 'var(--primary)' : '#7c3aed'
            }}
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
                <h2 className="text-2xl md:text-3xl font-bold" style={{ color: theme ? 'var(--text)' : undefined }}>
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
                        className="w-full text-left p-4 border transition-all font-medium flex items-center justify-between group"
                        style={{
                            borderRadius: theme ? 'var(--radius)' : '0.75rem',
                            borderColor: theme ? 'var(--accent)' : '#e4e4e7',
                            backgroundColor: theme ? 'var(--bg)' : '#ffffff',
                            color: theme ? 'var(--text)' : '#3f3f46'
                        }}
                        onMouseEnter={(e) => {
                            if (theme) {
                                e.currentTarget.style.borderColor = 'var(--primary)'
                                e.currentTarget.style.backgroundColor = 'var(--accent)'
                            } else {
                                e.currentTarget.classList.add('border-violet-500', 'bg-violet-50')
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (theme) {
                                e.currentTarget.style.borderColor = 'var(--accent)'
                                e.currentTarget.style.backgroundColor = 'var(--bg)'
                            } else {
                                e.currentTarget.classList.remove('border-violet-500', 'bg-violet-50')
                            }
                        }}
                      >
                        {opt}
                        <ArrowRight 
                            className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                            style={{ color: theme ? 'var(--primary)' : '#8b5cf6' }}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {(currentQ.type === "text" || currentQ.type === "short_text" || currentQ.type === "long_text") && (
                  <div className="flex gap-2">
                    <Input 
                      className="h-12 text-lg"
                      style={{
                          borderRadius: theme ? 'var(--radius)' : '0.5rem',
                          borderColor: theme ? 'var(--accent)' : undefined,
                          backgroundColor: theme ? 'var(--bg)' : undefined,
                          color: theme ? 'var(--text)' : undefined
                      }}
                      placeholder="Type your answer..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAnswer(e.currentTarget.value)
                        }
                      }}
                    />
                    <Button size="icon" className="h-12 w-12 shrink-0" 
                        style={{ 
                            backgroundColor: theme ? 'var(--primary)' : undefined,
                            borderRadius: theme ? 'var(--radius)' : undefined
                        }}
                        onClick={(e) => {
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
                                className="w-12 h-12 border transition-all font-bold text-lg"
                                style={{
                                    borderRadius: theme ? '50%' : '9999px',
                                    borderColor: theme ? 'var(--accent)' : '#e4e4e7',
                                    backgroundColor: theme ? 'var(--bg)' : '#ffffff',
                                    color: theme ? 'var(--text)' : undefined
                                }}
                                onMouseEnter={(e) => {
                                    if (theme) {
                                        e.currentTarget.style.backgroundColor = 'var(--primary)'
                                        e.currentTarget.style.color = '#ffffff'
                                        e.currentTarget.style.borderColor = 'var(--primary)'
                                    } else {
                                        e.currentTarget.classList.add('bg-violet-600', 'text-white', 'border-violet-600')
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (theme) {
                                        e.currentTarget.style.backgroundColor = 'var(--bg)'
                                        e.currentTarget.style.color = 'var(--text)'
                                        e.currentTarget.style.borderColor = 'var(--accent)'
                                    } else {
                                        e.currentTarget.classList.remove('bg-violet-600', 'text-white', 'border-violet-600')
                                    }
                                }}
                            >
                                {rating}
                            </button>
                        ))}
                    </div>
                )}

                {currentQ.type === "ranking" && (
                    <RankingQuestion 
                        options={currentQ.options || []} 
                        onAnswer={handleAnswer} 
                    />
                )}
                
                {/* Fallback for other types */}
                {!["multiple_choice", "text", "short_text", "long_text", "rating", "ranking"].includes(currentQ.type) && (
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
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: theme ? 'var(--accent)' : '#dcfce7' }}
              >
                <Check 
                    className="w-10 h-10" 
                    style={{ color: theme ? 'var(--primary)' : '#16a34a' }}
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold" style={{ color: theme ? 'var(--text)' : undefined }}>Thank you!</h1>
                <p className="text-lg" style={{ color: theme ? 'var(--text)' : '#71717a', opacity: 0.8 }}>Your response has been recorded.</p>
              </div>
              <p className="max-w-md mx-auto leading-relaxed" style={{ color: theme ? 'var(--text)' : '#a1a1aa', opacity: 0.6 }}>
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
      
      <div className="p-4 text-center text-xs shrink-0" style={{ color: theme ? 'var(--text)' : '#a1a1aa', opacity: 0.5 }}>
        Powered by <span className="font-bold" style={{ color: theme ? 'var(--text)' : '#52525b' }}>Geniy</span>
      </div>
    </div>
  )
}
