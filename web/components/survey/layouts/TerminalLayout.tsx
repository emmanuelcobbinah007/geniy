"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Terminal as TerminalIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Theme } from "../ThemeEditor"
import { useState, useEffect, useRef } from "react"

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

export function TerminalLayout({ 
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
    
    const [typedText, setTypedText] = useState("")
    const [cursorVisible, setCursorVisible] = useState(true)
    const inputRef = useRef<HTMLInputElement>(null)

    // Cursor blink effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCursorVisible(v => !v)
        }, 500)
        return () => clearInterval(interval)
    }, [])

    // Auto-focus input
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [currentQuestionId, hasStarted])

    const isSystem = theme?.mode === 'system' || !theme
    
    // Force monospace font for terminal
    const themeStyles = {
      "--primary": theme?.primaryColor || "#22c55e", // Default green
      "--bg": "#0c0c0c", // Always dark
      "--text": theme?.primaryColor || "#22c55e",
      "--font": "monospace",
    } as React.CSSProperties

    return (
        <div 
            className="flex flex-col h-full w-full p-4 md:p-8 bg-black text-green-500 font-mono overflow-hidden"
            style={themeStyles}
        >
            <div className="flex-1 max-w-3xl mx-auto w-full border border-green-900/50 rounded-lg bg-black/90 shadow-2xl flex flex-col overflow-hidden relative">
                {/* Terminal Header */}
                <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    <div className="ml-4 text-xs text-zinc-500 flex items-center gap-1">
                        <TerminalIcon className="w-3 h-3" />
                        <span>geniy_survey.exe</span>
                    </div>
                </div>

                {/* Terminal Content */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-sm md:text-base">
                    <div className="text-zinc-500">
                        Microsoft Windows [Version 10.0.19045.3693]<br/>
                        (c) Geniy Corporation. All rights reserved.
                    </div>
                    
                    <div className="text-zinc-500 mb-8">
                        C:\Users\Guest&gt; {hasStarted ? "run survey_init" : "boot_sequence.exe"}
                    </div>

                    {/* History Log (Previous Answers) */}
                    {hasStarted && history.map((qId, index) => (
                        <div key={qId} className="opacity-50">
                            <div className="text-zinc-400">[?] Question {index + 1}: Completed</div>
                            <div className="text-green-800">&gt; Data saved.</div>
                        </div>
                    ))}

                    <AnimatePresence mode="wait">
                        {!hasStarted && !isCompleted ? (
                             <motion.div
                                key="welcome"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                             >
                                <div className="space-y-2">
                                    <div className="text-green-400">&gt; SYSTEM READY.</div>
                                    <div className="text-green-400">&gt; LOADING MODULES... OK.</div>
                                    <div className="text-green-400">&gt; ESTABLISHING CONNECTION... OK.</div>
                                </div>

                                <div className="border-l-2 border-green-500 pl-4 py-2 bg-green-900/10">
                                    <h1 className="text-xl md:text-2xl font-bold text-green-400 mb-2">
                                        {title || "TERMINAL ACCESS"}
                                    </h1>
                                    <p className="text-green-600/80 max-w-lg">
                                        {description || "Please initialize the survey sequence."}
                                    </p>
                                </div>

                                <div className="pt-4">
                                    <span className="text-green-500 mr-2">C:\Users\Guest&gt;</span>
                                    <span className="animate-pulse">_</span>
                                </div>

                                <Button 
                                    variant="outline"
                                    className="mt-4 border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-mono"
                                    onClick={onStart}
                                >
                                    [ EXECUTE SURVEY ]
                                </Button>
                             </motion.div>
                        ) : !isCompleted && currentQ && (
                            <motion.div
                                key={currentQuestionId}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="text-white font-bold text-lg">
                                    <span className="text-green-500 mr-2">?</span>
                                    {currentQ.question}
                                </div>

                                <div className="pl-4 border-l-2 border-green-900/30 space-y-2">
                                    {currentQ.type === "multiple_choice" && (
                                        <div className="grid gap-1">
                                            {currentQ.options?.map((opt: string, i: number) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => onAnswer(opt)}
                                                    className="text-left hover:bg-green-900/20 hover:text-green-400 px-2 py-1 -ml-2 w-full flex items-center gap-2 group"
                                                >
                                                    <span className="text-zinc-600 group-hover:text-green-500">[{i + 1}]</span>
                                                    <span>{opt}</span>
                                                </button>
                                            ))}
                                            <div className="text-xs text-zinc-600 mt-2">Select an option by clicking or typing...</div>
                                        </div>
                                    )}

                                    {(currentQ.type === "text" || currentQ.type === "short_text" || currentQ.type === "long_text") && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-500">&gt;</span>
                                            <input 
                                                ref={inputRef}
                                                className="bg-transparent border-none outline-none text-green-400 w-full font-mono placeholder-green-900"
                                                placeholder="Type answer..."
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") onAnswer(e.currentTarget.value)
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {isCompleted && (
                            <motion.div
                                key="completed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4 text-green-400"
                            >
                                <div>&gt; Compiling results... 100%</div>
                                <div>&gt; Uploading to server... Done.</div>
                                <div className="text-white font-bold mt-4">
                                    SURVEY COMPLETED SUCCESSFULLY.
                                </div>
                                <div className="animate-pulse">_</div>
                                
                                {isPreview && onRestart && (
                                    <Button 
                                        variant="outline" 
                                        className="mt-4 border-green-800 text-green-500 hover:bg-green-900/20 hover:text-green-400"
                                        onClick={onRestart}
                                    >
                                        ./restart.sh
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
