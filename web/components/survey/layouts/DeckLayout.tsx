"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check, X } from "lucide-react"
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion"
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

export function DeckLayout({ 
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

    // Card Drag Logic
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-10, 10])
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            // Swiped Right (Positive/Next) - For binary choices or just "next"
            // For now, we just treat it as a visual effect unless we map it to an answer
             x.set(0) // Reset for now as we rely on clicking options
        } else if (info.offset.x < -100) {
            // Swiped Left (Negative/Back)
             x.set(0)
        }
    }

    return (
        <div 
            className={`flex flex-col items-center justify-center h-full w-full p-4 overflow-hidden ${isSystem ? 'bg-zinc-100 dark:bg-zinc-950' : ''}`}
            style={{
                ...themeStyles,
                backgroundColor: !isSystem && theme ? 'var(--bg)' : undefined,
                color: !isSystem && theme ? 'var(--text)' : undefined,
                fontFamily: !isSystem && theme ? 'var(--font)' : undefined,
            }}
        >
            {/* Progress Indicator (Card Count) */}
            <div className="absolute top-8 font-bold text-sm tracking-widest uppercase opacity-50">
                Card {hasStarted ? history.length + (isCompleted ? 0 : 1) : 0} / {totalQuestions}
            </div>

            <div className="relative w-full max-w-md aspect-[3/4] flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                    {!hasStarted && !isCompleted ? (
                        <motion.div
                            key="welcome"
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0, transition: { duration: 0.2 } }}
                            className={`absolute inset-0 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col justify-between items-center text-center ${isSystem ? 'bg-white dark:bg-zinc-900' : ''}`}
                            style={{ backgroundColor: theme ? 'var(--bg)' : undefined }}
                        >
                            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                                <div className="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center rotate-3" style={{ backgroundColor: theme ? 'var(--accent)' : undefined }}>
                                    <span className="text-4xl">👋</span>
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold leading-tight">
                                        {title || "Welcome"}
                                    </h1>
                                    <p className="text-zinc-500 font-medium" style={{ color: theme ? 'var(--text)' : undefined, opacity: 0.7 }}>
                                        {description}
                                    </p>
                                </div>
                            </div>
                            
                            <Button 
                                className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-violet-500/20"
                                onClick={onStart}
                                style={{ 
                                    backgroundColor: theme ? 'var(--primary)' : undefined,
                                    boxShadow: theme ? `0 10px 20px -5px var(--primary)` : undefined
                                }}
                            >
                                Start Deck
                            </Button>
                        </motion.div>
                    ) : !isCompleted && currentQ && (
                        <motion.div
                            key={currentQuestionId}
                            style={{ x, rotate, opacity, backgroundColor: theme ? 'var(--bg)' : '#ffffff' }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={handleDragEnd}
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 1.1, opacity: 0, transition: { duration: 0.2 } }}
                            className={`absolute inset-0 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col justify-between ${isSystem ? 'bg-white dark:bg-zinc-900' : ''}`}
                        >
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold leading-tight">
                                    {currentQ.question}
                                </h2>
                                {currentQ.required && <span className="text-xs font-bold uppercase tracking-wider text-red-500">Required</span>}
                            </div>

                            <div className="space-y-3 overflow-y-auto max-h-[60%] pr-2">
                                {currentQ.type === "multiple_choice" && (
                                    <div className="grid gap-2">
                                        {currentQ.options?.map((opt: string) => (
                                            <button
                                                key={opt}
                                                onClick={() => onAnswer(opt)}
                                                className="w-full text-left p-4 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all font-medium"
                                                style={{ 
                                                    borderColor: theme ? 'var(--accent)' : undefined,
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (theme) {
                                                        e.currentTarget.style.borderColor = 'var(--primary)'
                                                        e.currentTarget.style.backgroundColor = 'var(--accent)'
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (theme) {
                                                        e.currentTarget.style.borderColor = 'var(--accent)'
                                                        e.currentTarget.style.backgroundColor = 'transparent'
                                                    }
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {(currentQ.type === "text" || currentQ.type === "short_text" || currentQ.type === "long_text") && (
                                    <div className="space-y-4">
                                        <Input 
                                            className="h-14 text-lg bg-zinc-50 dark:bg-zinc-800 border-transparent focus:border-violet-500 rounded-xl"
                                            placeholder="Type your answer..."
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") onAnswer(e.currentTarget.value)
                                            }}
                                        />
                                        <Button 
                                            className="w-full h-12 rounded-xl text-lg font-bold"
                                            onClick={(e) => {
                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                                onAnswer(input.value)
                                            }}
                                            style={{ backgroundColor: theme ? 'var(--primary)' : undefined }}
                                        >
                                            Next Card
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Back Button (Small, at bottom) */}
                            {history.length > 0 && (
                                <button 
                                    onClick={onBack}
                                    className="self-center text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors mt-4"
                                >
                                    Undo / Back
                                </button>
                            )}
                        </motion.div>
                    )}

                    {isCompleted && (
                        <motion.div
                            key="completed"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`absolute inset-0 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col items-center justify-center text-center space-y-6 ${isSystem ? 'bg-white dark:bg-zinc-900' : ''}`}
                            style={{ backgroundColor: theme ? 'var(--bg)' : undefined }}
                        >
                            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                <Check className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold">All Done!</h2>
                            <p className="text-zinc-500">You've cleared the deck.</p>
                             {isPreview && onRestart && (
                                <Button variant="outline" onClick={onRestart}>
                                    Deal Again
                                </Button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Background Cards Stack Effect */}
                {!isCompleted && (
                    <>
                        <div className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 scale-95 translate-y-4 -z-10 opacity-50" style={{ backgroundColor: theme ? 'var(--bg)' : undefined }} />
                        <div className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-lg border border-zinc-200 dark:border-zinc-800 scale-90 translate-y-8 -z-20 opacity-25" style={{ backgroundColor: theme ? 'var(--bg)' : undefined }} />
                    </>
                )}
            </div>
        </div>
    )
}
