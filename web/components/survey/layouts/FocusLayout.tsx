"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Theme } from "../ThemeEditor"
import { useState } from "react"

interface LayoutProps {
    currentQ: any
    currentQuestionId: string | null
    isCompleted: boolean
    history: string[]
    totalQuestions: number
    theme?: Theme
    onAnswer: (value: any) => void
    onBack: () => void
    onRestart?: () => void
    isPreview?: boolean
    hasStarted?: boolean
    onStart?: () => void
    title?: string
    description?: string
    companyName?: string
}

export function FocusLayout({ 
    currentQ, 
    currentQuestionId, 
    isCompleted, 
    history, 
    totalQuestions, 
    theme, 
    onAnswer, 
    onBack,
    onRestart,
    isPreview,
    hasStarted = true,
    onStart,
    title,
    description,
    companyName
}: LayoutProps) {
    
    const isSystem = theme?.mode === 'system' || !theme
  
    const themeStyles = (theme && !isSystem) ? {
      "--primary": theme.primaryColor,
      "--bg": theme.backgroundColor,
      "--text": theme.textColor,
      "--accent": theme.accentColor,
      "--radius": theme.borderRadius,
      "--font": theme.fontFamily,
    } as React.CSSProperties : {}

    // Ranking Component Logic (Internal)
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
                    className={`w-full mt-4 ${isSystem ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
                    disabled={available.length > 0} // Require ranking all
                    onClick={() => onAnswer(ranked)}
                    style={{ 
                        backgroundColor: !isSystem && theme ? 'var(--primary)' : undefined,
                        borderRadius: !isSystem && theme ? 'var(--radius)' : undefined
                    }}
                >
                    Confirm Ranking
                </Button>
            </div>
        )
    }

    // Checkbox (Multi-select) Component
    const CheckboxQuestion = ({ options, onAnswer, theme, isSystem }: { options: string[], onAnswer: (val: string[]) => void, theme?: Theme, isSystem: boolean }) => {
        const [selected, setSelected] = useState<string[]>([])
    
        const toggleOption = (opt: string) => {
            setSelected(prev => 
                prev.includes(opt) 
                    ? prev.filter(o => o !== opt) 
                    : [...prev, opt]
            )
        }
    
        return (
            <div className="space-y-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Select all that apply</p>
                <div className="grid gap-3">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => toggleOption(opt)}
                            className={`w-full text-left p-4 border transition-all font-medium flex items-center gap-3 rounded-xl ${
                                selected.includes(opt)
                                    ? (isSystem ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300' : '')
                                    : (isSystem ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-500 dark:hover:border-violet-500 text-zinc-700 dark:text-zinc-300' : '')
                            }`}
                            style={{
                                borderRadius: !isSystem && theme ? 'var(--radius)' : undefined,
                                borderColor: !isSystem && theme ? (selected.includes(opt) ? 'var(--primary)' : 'var(--accent)') : undefined,
                                backgroundColor: !isSystem && theme ? (selected.includes(opt) ? 'var(--accent)' : 'var(--bg)') : undefined,
                                color: !isSystem && theme ? 'var(--text)' : undefined,
                            }}
                        >
                            {/* Checkbox indicator */}
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                selected.includes(opt)
                                    ? (isSystem ? 'bg-violet-600 border-violet-600' : '')
                                    : (isSystem ? 'border-zinc-300 dark:border-zinc-600' : '')
                            }`}
                                style={{
                                    backgroundColor: !isSystem && theme && selected.includes(opt) ? 'var(--primary)' : undefined,
                                    borderColor: !isSystem && theme ? (selected.includes(opt) ? 'var(--primary)' : 'var(--accent)') : undefined,
                                }}
                            >
                                {selected.includes(opt) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            {opt}
                        </button>
                    ))}
                </div>
                
                <Button 
                    className={`w-full mt-2 ${isSystem ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
                    disabled={selected.length === 0}
                    onClick={() => onAnswer(selected)}
                    style={{ 
                        backgroundColor: !isSystem && theme ? 'var(--primary)' : undefined,
                        borderRadius: !isSystem && theme ? 'var(--radius)' : undefined
                    }}
                >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        )
    }

    return (
        <div 
            className={`flex flex-col h-full w-full transition-colors duration-300 ${isSystem ? 'bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50' : ''}`}
            style={{
                ...themeStyles,
                backgroundColor: !isSystem && theme ? 'var(--bg)' : undefined,
                color: !isSystem && theme ? 'var(--text)' : undefined,
                fontFamily: !isSystem && theme ? 'var(--font)' : undefined,
            }}
        >
          {/* Progress Bar (Simple) */}
          <div className={`h-1 w-full shrink-0 ${isSystem ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`} style={{ backgroundColor: !isSystem && theme ? 'var(--accent)' : undefined }}>
            <div 
                className={`h-full transition-all duration-500 ${isSystem ? 'bg-violet-600 dark:bg-violet-500' : ''}`}
                style={{ 
                    width: `${isCompleted ? 100 : ((history.length) / totalQuestions) * 100}%`,
                    backgroundColor: !isSystem && theme ? 'var(--primary)' : undefined
                }}
            />
          </div>
    
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto w-full overflow-y-auto relative">
            {/* Back Button */}
            {!isCompleted && hasStarted && history.length > 0 && (
                <button 
                    onClick={onBack}
                    className={`absolute top-4 left-4 md:top-8 md:left-0 text-sm font-medium transition-colors flex items-center gap-1 ${isSystem ? 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100' : ''}`}
                    style={{ color: !isSystem && theme ? 'var(--text)' : undefined, opacity: !isSystem && theme ? 0.6 : 1 }}
                >
                    ← Back
                </button>
            )}
    
            <AnimatePresence mode="wait">
              {!hasStarted && !isCompleted ? (
                 <motion.div
                    key="welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-6 max-w-lg"
                 >
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ color: theme ? 'var(--text)' : undefined }}>
                            {title || "Welcome"}
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-500 leading-relaxed" style={{ color: theme ? 'var(--text)' : undefined, opacity: 0.8 }}>
                            {description}
                        </p>
                    </div>
                    <Button 
                        size="lg"
                        className={`mt-8 px-8 text-lg h-14 ${isSystem ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
                        onClick={onStart}
                        style={{ 
                            backgroundColor: !isSystem && theme ? 'var(--primary)' : undefined,
                            borderRadius: !isSystem && theme ? 'var(--radius)' : undefined
                        }}
                    >
                        Start Survey <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                 </motion.div>
              ) : !isCompleted && currentQ && (
                <motion.div
                  key={currentQuestionId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full space-y-8"
                >
                  <div className="space-y-2">
                    {/* For explainer type, show as an info block */}
                    {currentQ.type === "explainer" ? (
                      <div 
                        className={`p-6 rounded-xl border-2 border-dashed ${isSystem ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800' : ''}`}
                        style={{ 
                          backgroundColor: !isSystem && theme ? 'var(--accent)' : undefined,
                          borderColor: !isSystem && theme ? 'var(--primary)' : undefined
                        }}
                      >
                        <p className={`text-lg leading-relaxed ${isSystem ? 'text-zinc-700 dark:text-zinc-300' : ''}`} style={{ color: !isSystem && theme ? 'var(--text)' : undefined }}>
                          {currentQ.question}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* For rating questions, show header separately (with fallback) */}
                        {currentQ.type === "rating" && (
                          <p className={`text-base md:text-lg font-medium ${isSystem ? 'text-zinc-500 dark:text-zinc-400' : ''}`} style={{ color: !isSystem && theme ? 'var(--text)' : undefined, opacity: 0.8 }}>
                            {currentQ.ratingHeader || "Rate on a scale of 1-5 (1 = lowest, 5 = highest):"}
                          </p>
                        )}
                        <h2 className={`text-2xl md:text-3xl font-bold ${isSystem ? 'text-zinc-900 dark:text-zinc-100' : ''}`} style={{ color: !isSystem && theme ? 'var(--text)' : undefined }}>
                          {currentQ.question}
                        </h2>
                      </>
                    )}
                    {currentQ.required && currentQ.type !== "explainer" && <span className="text-xs text-red-500 uppercase tracking-wider font-medium">Required</span>}
                  </div>
    
                  <div className="space-y-3">
                    {currentQ.type === "multiple_choice" && (() => {
                      // Check if any option is an "Other" type that needs text input
                      const hasOtherOption = currentQ.options?.some((opt: any) => 
                        (typeof opt === 'object' && opt.allowOther) || 
                        (typeof opt === 'string' && opt.toLowerCase().includes('other') && opt.toLowerCase().includes('specify'))
                      );
                      
                      const [showOtherInput, setShowOtherInput] = useState(false);
                      const [otherText, setOtherText] = useState("");
                      
                      return (
                        <div className="grid gap-3">
                          {currentQ.options?.map((opt: any) => {
                            const optText = typeof opt === 'object' ? opt.text : opt;
                            const isOtherOption = (typeof opt === 'object' && opt.allowOther) || 
                              (typeof optText === 'string' && optText.toLowerCase().includes('other') && optText.toLowerCase().includes('specify'));
                            
                            if (isOtherOption && showOtherInput) {
                              // Show text input for "Other" option
                              return (
                                <div key={optText} className="space-y-2">
                                  <div 
                                    className={`w-full p-4 border-2 rounded-xl ${isSystem ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : ''}`}
                                    style={{
                                      borderRadius: !isSystem && theme ? 'var(--radius)' : undefined,
                                      borderColor: !isSystem && theme ? 'var(--primary)' : undefined,
                                      backgroundColor: !isSystem && theme ? 'var(--accent)' : undefined,
                                    }}
                                  >
                                    <p className={`font-medium mb-2 ${isSystem ? 'text-zinc-700 dark:text-zinc-300' : ''}`} style={{ color: !isSystem && theme ? 'var(--text)' : undefined }}>
                                      {optText}
                                    </p>
                                    <div className="flex gap-2">
                                      <Input 
                                        autoFocus
                                        className={`h-10 ${isSystem ? 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700' : ''}`}
                                        style={{
                                          borderRadius: !isSystem && theme ? 'var(--radius)' : undefined,
                                          borderColor: !isSystem && theme ? 'var(--accent)' : undefined,
                                          backgroundColor: !isSystem && theme ? 'var(--bg)' : undefined,
                                          color: !isSystem && theme ? 'var(--text)' : undefined
                                        }}
                                        placeholder="Please specify..."
                                        value={otherText}
                                        onChange={(e) => setOtherText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && otherText.trim()) {
                                            onAnswer(`Other: ${otherText.trim()}`);
                                          }
                                        }}
                                      />
                                      <Button 
                                        size="icon" 
                                        className={`h-10 w-10 shrink-0 ${isSystem ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
                                        style={{ 
                                          backgroundColor: !isSystem && theme ? 'var(--primary)' : undefined,
                                          borderRadius: !isSystem && theme ? 'var(--radius)' : undefined
                                        }}
                                        onClick={() => {
                                          if (otherText.trim()) {
                                            onAnswer(`Other: ${otherText.trim()}`);
                                          }
                                        }}
                                        disabled={!otherText.trim()}
                                      >
                                        <ArrowRight className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <button 
                                      className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mt-2"
                                      onClick={() => setShowOtherInput(false)}
                                    >
                                      ← Choose another option
                                    </button>
                                  </div>
                                </div>
                              );
                            }
                            
                            return (
                              <button
                                key={optText}
                                onClick={() => {
                                  if (isOtherOption) {
                                    setShowOtherInput(true);
                                  } else {
                                    onAnswer(optText);
                                  }
                                }}
                                className={`w-full text-left p-4 border transition-all font-medium flex items-center justify-between group rounded-xl ${isSystem ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-zinc-700 dark:text-zinc-300' : ''}`}
                                style={{
                                    borderRadius: !isSystem && theme ? 'var(--radius)' : undefined,
                                    borderColor: !isSystem && theme ? 'var(--accent)' : undefined,
                                    backgroundColor: !isSystem && theme ? 'var(--bg)' : undefined,
                                    color: !isSystem && theme ? 'var(--text)' : undefined,
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSystem && theme) {
                                        e.currentTarget.style.borderColor = 'var(--primary)'
                                        e.currentTarget.style.backgroundColor = 'var(--accent)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSystem && theme) {
                                        e.currentTarget.style.borderColor = 'var(--accent)'
                                        e.currentTarget.style.backgroundColor = 'var(--bg)'
                                    }
                                }}
                              >
                                {optText}
                                <ArrowRight 
                                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-violet-500" 
                                    style={{ color: theme ? 'var(--primary)' : undefined }}
                                />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {currentQ.type === "checkbox" && (
                      <CheckboxQuestion 
                        options={currentQ.options || []} 
                        onAnswer={onAnswer}
                        theme={theme}
                        isSystem={isSystem}
                      />
                    )}
    
                    {(currentQ.type === "text" || currentQ.type === "short_text" || currentQ.type === "long_text" || currentQ.type === "textarea") && (
                      <div className="flex gap-2">
                        <Input 
                          className={`h-12 text-lg ${isSystem ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' : ''}`}
                          style={{
                              borderRadius: !isSystem && theme ? 'var(--radius)' : undefined,
                              borderColor: !isSystem && theme ? 'var(--accent)' : undefined,
                              backgroundColor: !isSystem && theme ? 'var(--bg)' : undefined,
                              color: !isSystem && theme ? 'var(--text)' : undefined
                          }}
                          placeholder="Type your answer..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onAnswer(e.currentTarget.value)
                            }
                          }}
                        />
                        <Button size="icon" className={`h-12 w-12 shrink-0 ${isSystem ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
                            style={{ 
                                backgroundColor: !isSystem && theme ? 'var(--primary)' : undefined,
                                borderRadius: !isSystem && theme ? 'var(--radius)' : undefined
                            }}
                            onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                onAnswer(input.value)
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
                                    onClick={() => onAnswer(rating)}
                                    className="w-12 h-12 border transition-all font-bold text-lg rounded-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-violet-600 hover:text-white hover:border-violet-600"
                                    style={{
                                        borderRadius: !isSystem && theme ? '50%' : undefined,
                                        borderColor: !isSystem && theme ? 'var(--accent)' : undefined,
                                        backgroundColor: !isSystem && theme ? 'var(--bg)' : undefined,
                                        color: !isSystem && theme ? 'var(--text)' : undefined
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSystem && theme) {
                                            e.currentTarget.style.backgroundColor = 'var(--primary)'
                                            e.currentTarget.style.color = '#ffffff'
                                            e.currentTarget.style.borderColor = 'var(--primary)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isSystem && theme) {
                                            e.currentTarget.style.backgroundColor = 'var(--bg)'
                                            e.currentTarget.style.color = 'var(--text)'
                                            e.currentTarget.style.borderColor = 'var(--accent)'
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
                            onAnswer={onAnswer} 
                        />
                    )}

                    {/* Continue button for explainer type */}
                    {currentQ.type === "explainer" && (
                      <Button 
                        size="lg"
                        className={`mt-4 ${isSystem ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
                        onClick={() => onAnswer("_explainer_continue_")}
                        style={{ 
                          backgroundColor: !isSystem && theme ? 'var(--primary)' : undefined,
                          borderRadius: !isSystem && theme ? 'var(--radius)' : undefined
                        }}
                      >
                        Continue <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    
                    {/* Fallback for other types */}
                    {!["explainer", "multiple_choice", "checkbox", "text", "short_text", "long_text", "textarea", "rating", "ranking"].includes(currentQ.type) && (
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
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-green-100 dark:bg-green-900/30"
                    style={{ backgroundColor: theme ? 'var(--accent)' : undefined }}
                  >
                    <Check 
                        className="w-10 h-10 text-green-600 dark:text-green-500" 
                        style={{ color: theme ? 'var(--primary)' : undefined }}
                    />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100" style={{ color: theme ? 'var(--text)' : undefined }}>Thank you!</h1>
                    <p className="text-lg text-zinc-500" style={{ color: theme ? 'var(--text)' : undefined, opacity: theme ? 0.8 : 1 }}>Your response has been recorded.</p>
                  </div>
                  <p className="max-w-md mx-auto leading-relaxed text-zinc-400" style={{ color: theme ? 'var(--text)' : undefined, opacity: theme ? 0.6 : 1 }}>
                    Your feedback is incredibly valuable and will help us build a beautiful product tailored to your needs.
                  </p>
                  {isPreview && onRestart && (
                    <Button variant="outline" className="mt-8" onClick={onRestart}>
                        Restart Preview
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="p-4 text-center text-xs shrink-0 text-zinc-400" style={{ color: theme ? 'var(--text)' : undefined, opacity: theme ? 0.5 : 1 }}>
            Powered by <span className="font-bold text-zinc-600 dark:text-zinc-300" style={{ color: theme ? 'var(--text)' : undefined }}>Geniy</span>
          </div>
        </div>
      )
}
