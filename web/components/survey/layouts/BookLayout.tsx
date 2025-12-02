"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check, BookOpen } from "lucide-react"
import { motion, AnimatePresence, Variants } from "framer-motion"
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
}

export function BookLayout({ 
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
    description
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

    // Page Flip Animation Variants
    const pageVariants: Variants = {
        initial: { 
            rotateY: 90, 
            opacity: 0, 
            transformOrigin: "left center",
            boxShadow: "-5px 0 10px rgba(0,0,0,0.1)" 
        },
        enter: { 
            rotateY: 0, 
            opacity: 1, 
            transition: { 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1], // Custom spring-like ease
                staggerChildren: 0.1
            },
            boxShadow: "0 0 0 rgba(0,0,0,0)" 
        },
        exit: { 
            rotateY: -90, 
            opacity: 0, 
            transition: { duration: 0.5, ease: "easeIn" },
            boxShadow: "5px 0 10px rgba(0,0,0,0.1)" 
        }
    }

    return (
        <div 
            className={`flex items-center justify-center h-full w-full p-4 md:p-8 perspective-1000 ${isSystem ? 'bg-zinc-100 dark:bg-zinc-950' : ''}`}
            style={{
                ...themeStyles,
                backgroundColor: !isSystem && theme ? '#e5e5e5' : undefined, // Outer background
                perspective: '2000px'
            }}
        >
            {/* The Book */}
            <div 
                className="relative w-full max-w-5xl aspect-[3/2] flex perspective-2000"
                style={{
                     boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)'
                }}
            >
                {/* Hardcover Backing */}
                <div className="absolute inset-0 bg-[#2a2a2a] rounded-sm -z-20 transform scale-[1.02] translate-y-1" />

                {/* Pages Underneath Effect (Right Side) - Simulating thickness */}
                <div className="absolute top-1 bottom-1 right-0 w-3 bg-[#fdfbf7] border-l border-zinc-200 -z-10 transform translate-x-1 rounded-r-sm" 
                     style={{ 
                         boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                         background: `linear-gradient(to left, #e3e0d9 0%, #fdfbf7 100%)`
                     }} 
                />
                <div className="absolute top-2 bottom-2 right-0 w-3 bg-[#fdfbf7] border-l border-zinc-200 -z-10 transform translate-x-2 rounded-r-sm" 
                     style={{ 
                         boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                         background: `linear-gradient(to left, #e3e0d9 0%, #fdfbf7 100%)`
                     }} 
                />
                <div className="absolute top-3 bottom-3 right-0 w-3 bg-[#fdfbf7] border-l border-zinc-200 -z-10 transform translate-x-3 rounded-r-sm" 
                     style={{ 
                         boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                         background: `linear-gradient(to left, #e3e0d9 0%, #fdfbf7 100%)`
                     }} 
                />

                {/* Left Page (Static) */}
                <div 
                    className="w-1/2 h-full bg-[#fdfbf7] relative z-10 overflow-hidden rounded-l-sm border-r border-zinc-300"
                    style={{ 
                        backgroundColor: !isSystem && theme ? 'var(--bg)' : '#fdfbf7',
                        // Curvature gradient
                        background: `linear-gradient(to right, 
                            #e3e0d9 0%, 
                            ${!isSystem && theme ? 'var(--bg)' : '#fdfbf7'} 12%, 
                            ${!isSystem && theme ? 'var(--bg)' : '#fdfbf7'} 85%, 
                            #e3e0d9 100%)`
                    }}
                >
                    {/* Left Page Thickness (Side) */}
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-r from-zinc-200 to-zinc-100 border-r border-zinc-300 transform -translate-x-full" />

                    <div className="h-full p-8 md:p-12 flex flex-col justify-between relative z-10 mix-blend-multiply">
                        <div className="space-y-4 opacity-80">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-zinc-800" style={{ color: theme ? 'var(--primary)' : undefined }} />
                                <span className="text-sm font-serif italic text-zinc-600" style={{ color: theme ? 'var(--text)' : undefined }}>
                                    {!hasStarted ? "Prologue" : `Chapter ${history.length + 1}`}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight text-zinc-900" style={{ color: theme ? 'var(--text)' : undefined, fontFamily: theme ? 'var(--font)' : undefined }}>
                                {isCompleted ? "The End" : (hasStarted ? "Your Story" : (title || "The Survey"))}
                            </h1>
                        </div>

                        <div className="text-sm text-zinc-400 font-serif italic">
                            Page {hasStarted ? history.length + 1 : "i"} of {totalQuestions}
                        </div>
                    </div>
                </div>

                {/* Right Page (Active Content) */}
                <div className="w-1/2 h-full relative z-20 perspective-2000">
                    {/* Right Page Thickness (Static base) */}
                    <div className="absolute inset-0 bg-white border-l border-zinc-300 rounded-r-sm" 
                         style={{
                            background: `linear-gradient(to left, 
                                #e3e0d9 0%, 
                                #fdfbf7 12%, 
                                #fdfbf7 95%, 
                                #d1cfc7 100%)`
                         }}
                    />

                    <AnimatePresence mode="wait" initial={false}>
                        {!hasStarted && !isCompleted ? (
                             <motion.div
                                key="welcome"
                                variants={pageVariants}
                                initial="initial"
                                animate="enter"
                                exit="exit"
                                className="absolute inset-0 h-full w-full origin-left p-8 md:p-12 flex flex-col justify-center items-center text-center backface-hidden rounded-r-sm"
                                style={{ 
                                    backgroundColor: theme ? 'var(--bg)' : '#fdfbf7',
                                    background: `linear-gradient(to left, 
                                        #e3e0d9 0%, 
                                        ${!isSystem && theme ? 'var(--bg)' : '#fdfbf7'} 12%, 
                                        ${!isSystem && theme ? 'var(--bg)' : '#fdfbf7'} 94%, 
                                        #d1cfc7 100%)`,
                                    transformStyle: 'preserve-3d',
                                    borderLeft: '1px solid rgba(0,0,0,0.1)'
                                }}
                            >
                                <div className="space-y-6 max-w-sm relative z-10 mix-blend-multiply">
                                    <h2 className="text-3xl font-serif italic text-zinc-900" style={{ color: theme ? 'var(--text)' : undefined }}>
                                        {title || "Welcome"}
                                    </h2>
                                    <div className="w-16 h-0.5 bg-zinc-300 mx-auto" style={{ backgroundColor: theme ? 'var(--accent)' : undefined }} />
                                    <p className="font-serif text-zinc-600 leading-relaxed" style={{ color: theme ? 'var(--text)' : undefined, opacity: 0.8 }}>
                                        {description}
                                    </p>
                                    
                                    <Button 
                                        variant="ghost" 
                                        className="mt-8 text-lg font-serif italic hover:bg-transparent hover:underline"
                                        onClick={onStart}
                                        style={{ color: theme ? 'var(--primary)' : undefined }}
                                    >
                                        Begin Story →
                                    </Button>
                                </div>
                            </motion.div>
                        ) : !isCompleted && currentQ && (
                            <motion.div
                                key={currentQuestionId}
                                variants={pageVariants}
                                initial="initial"
                                animate="enter"
                                exit="exit"
                                className="absolute inset-0 h-full w-full origin-left p-8 md:p-12 flex flex-col justify-center backface-hidden rounded-r-sm"
                                style={{ 
                                    backgroundColor: theme ? 'var(--bg)' : '#fdfbf7',
                                    // Curvature gradient for right page
                                    background: `linear-gradient(to left, 
                                        #e3e0d9 0%, 
                                        ${!isSystem && theme ? 'var(--bg)' : '#fdfbf7'} 12%, 
                                        ${!isSystem && theme ? 'var(--bg)' : '#fdfbf7'} 94%, 
                                        #d1cfc7 100%)`,
                                    transformStyle: 'preserve-3d',
                                    borderLeft: '1px solid rgba(0,0,0,0.1)'
                                }}
                            >
                                {/* Back Button */}
                                {history.length > 0 && (
                                    <button 
                                        onClick={onBack}
                                        className="absolute top-8 left-8 text-xs font-serif italic hover:underline transition-all z-50 text-zinc-500"
                                        style={{ color: theme ? 'var(--text)' : undefined, opacity: 0.6 }}
                                    >
                                        ← Previous Page
                                    </button>
                                )}

                                <div className="space-y-8 w-full relative z-10 mix-blend-multiply">
                                    <h2 className="text-2xl font-serif font-medium leading-relaxed text-zinc-900" style={{ color: theme ? 'var(--text)' : undefined, fontFamily: theme ? 'var(--font)' : undefined }}>
                                        {currentQ.question}
                                    </h2>

                                    <div className="space-y-3">
                                        {currentQ.type === "multiple_choice" && (
                                            <div className="grid gap-2">
                                                {currentQ.options?.map((opt: string) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => onAnswer(opt)}
                                                        className="w-full text-left p-3 border-b border-zinc-300 hover:border-zinc-900 transition-colors font-serif text-lg group flex items-center justify-between text-zinc-800"
                                                        style={{ 
                                                            borderColor: theme ? 'var(--accent)' : undefined,
                                                            color: theme ? 'var(--text)' : undefined
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (theme) e.currentTarget.style.borderColor = 'var(--primary)'
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (theme) e.currentTarget.style.borderColor = 'var(--accent)'
                                                        }}
                                                    >
                                                        <span>{opt}</span>
                                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">❧</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {(currentQ.type === "text" || currentQ.type === "short_text" || currentQ.type === "long_text") && (
                                            <div className="space-y-4">
                                                <Input 
                                                    className="border-0 border-b-2 border-zinc-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-zinc-900 font-serif text-xl placeholder:italic text-zinc-800 placeholder:text-zinc-400"
                                                    style={{ 
                                                        borderColor: theme ? 'var(--accent)' : undefined,
                                                        color: theme ? 'var(--text)' : undefined,
                                                        backgroundColor: 'transparent'
                                                    }}
                                                    placeholder="Write your thoughts..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") onAnswer(e.currentTarget.value)
                                                    }}
                                                />
                                                <Button 
                                                    variant="ghost" 
                                                    className="w-full hover:bg-transparent hover:underline font-serif italic justify-start px-0 text-zinc-800"
                                                    onClick={(e) => {
                                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement
                                                        onAnswer(input.value)
                                                    }}
                                                    style={{ color: theme ? 'var(--primary)' : undefined }}
                                                >
                                                    Turn Page →
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {isCompleted && (
                            <motion.div
                                key="completed"
                                variants={pageVariants}
                                initial="initial"
                                animate="enter"
                                className="absolute inset-0 h-full w-full origin-left p-8 md:p-12 flex flex-col justify-center items-center text-center backface-hidden rounded-r-sm"
                                style={{ 
                                    backgroundColor: theme ? 'var(--bg)' : '#fdfbf7',
                                    background: `linear-gradient(to left, 
                                        #e3e0d9 0%, 
                                        ${!isSystem && theme ? 'var(--bg)' : '#fdfbf7'} 12%, 
                                        ${!isSystem && theme ? 'var(--bg)' : '#fdfbf7'} 94%, 
                                        #d1cfc7 100%)`
                                }}
                            >
                                <div className="w-16 h-16 mx-auto border-2 border-zinc-900 rounded-full flex items-center justify-center" style={{ borderColor: theme ? 'var(--primary)' : undefined }}>
                                    <Check className="w-8 h-8 text-zinc-900" style={{ color: theme ? 'var(--primary)' : undefined }} />
                                </div>
                                <h2 className="text-3xl font-serif italic mt-6 text-zinc-900" style={{ color: theme ? 'var(--text)' : undefined }}>Fin.</h2>
                                <p className="font-serif text-zinc-500 mt-2" style={{ color: theme ? 'var(--text)' : undefined, opacity: 0.7 }}>Thank you for sharing your story.</p>
                                
                                {isPreview && onRestart && (
                                    <Button variant="link" onClick={onRestart} className="font-serif italic mt-4 text-zinc-800">
                                        Read Again
                                    </Button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
