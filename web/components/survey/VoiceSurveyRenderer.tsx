"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX, Send, SkipForward, RefreshCw } from "lucide-react"
import Image from "next/image"

interface VoiceSurveyRendererProps {
    surveyData: any
    slug?: string
    isPreview?: boolean
    onComplete?: () => void
}

interface Message {
    role: 'assistant' | 'user'
    content: string
    questionId?: string
}

export function VoiceSurveyRenderer({ surveyData, slug, isPreview = false, onComplete }: VoiceSurveyRendererProps) {
    // State
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isProcessing, setIsProcessing] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)
    const [audioEnabled, setAudioEnabled] = useState(true)
    const [hasStarted, setHasStarted] = useState(false)

    // Refs
    const recognitionRef = useRef<any>(null)
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Get questions from survey
    const getQuestions = useCallback(() => {
        return surveyData?.jsonSchema?.questions || surveyData?.questions || {}
    }, [surveyData])

    // Text-to-speech
    const speak = useCallback((text: string) => {
        if (!audioEnabled || typeof window === 'undefined') return Promise.resolve()
        
        return new Promise<void>((resolve) => {
            window.speechSynthesis.cancel()
            
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = 0.95
            utterance.pitch = 1.0
            
            // Try to find a natural voice
            const voices = window.speechSynthesis.getVoices()
            const preferredVoice = voices.find(v => 
                v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
            )
            if (preferredVoice) utterance.voice = preferredVoice
            
            utterance.onstart = () => setIsSpeaking(true)
            utterance.onend = () => {
                setIsSpeaking(false)
                resolve()
            }
            utterance.onerror = () => {
                setIsSpeaking(false)
                resolve()
            }
            
            synthRef.current = utterance
            window.speechSynthesis.speak(utterance)
        })
    }, [audioEnabled])

    // Speech recognition
    const startListening = useCallback(() => {
        if (typeof window === 'undefined') return
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported')
            return
        }

        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
            let final = ''
            let interim = ''
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const text = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    final += text
                } else {
                    interim += text
                }
            }
            
            setTranscript(prev => prev + final + interim)
        }

        recognitionRef.current.onerror = (e: any) => {
            console.error('Speech recognition error:', e.error)
            setIsListening(false)
        }

        recognitionRef.current.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current.start()
        setIsListening(true)
    }, [])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        setIsListening(false)
    }, [])

    // Process user response
    const processResponse = useCallback(async (response: string) => {
        if (!response.trim() || !currentQuestionId) return
        
        setIsProcessing(true)
        
        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: response }])
        setTranscript("")
        
        // Save answer
        const questions = getQuestions()
        const currentQ = questions[currentQuestionId]
        
        // Parse response based on question type
        let parsedAnswer = response
        if (currentQ.type === 'scale' || currentQ.type === 'nps') {
            const num = parseInt(response.match(/\d+/)?.[0] || '0')
            parsedAnswer = num
        } else if (currentQ.type === 'single_choice') {
            // Try to match to an option
            const options = currentQ.options || []
            const matched = options.find((opt: any) => {
                const optText = typeof opt === 'string' ? opt : opt.text
                return response.toLowerCase().includes(optText.toLowerCase())
            })
            if (matched) {
                parsedAnswer = typeof matched === 'string' ? matched : matched.text
            }
        }
        
        setAnswers(prev => ({ ...prev, [currentQuestionId]: parsedAnswer }))
        
        // Get next question
        let nextQId = currentQ.next
        
        // Check branches
        if (currentQ.branches) {
            for (const branch of currentQ.branches) {
                if (branch.if === true || branch.if === parsedAnswer) {
                    nextQId = branch.next
                    break
                }
            }
        }
        
        if (nextQId === "END" || !nextQId || !questions[nextQId]) {
            // Survey complete
            await finishSurvey({ ...answers, [currentQuestionId]: parsedAnswer })
        } else {
            // Ask next question
            const nextQ = questions[nextQId]
            const questionText = formatQuestionForVoice(nextQ)
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: questionText,
                questionId: nextQId 
            }])
            setCurrentQuestionId(nextQId)
            
            await speak(questionText)
        }
        
        setIsProcessing(false)
    }, [currentQuestionId, answers, getQuestions, speak])

    // Format question for voice
    const formatQuestionForVoice = (question: any): string => {
        let text = question.text || question.question || ""
        
        if (question.type === 'single_choice' && question.options) {
            text += " Your options are: "
            const opts = question.options.map((o: any) => typeof o === 'string' ? o : o.text)
            text += opts.join(", ")
        } else if (question.type === 'scale') {
            text += ` Please give a number from ${question.min || 1} to ${question.max || 10}.`
        } else if (question.type === 'nps') {
            text += " On a scale from 0 to 10, where 0 is not at all likely and 10 is extremely likely."
        }
        
        return text
    }

    // Finish survey
    const finishSurvey = async (finalAnswers: Record<string, any>) => {
        setIsCompleted(true)
        
        const completionMessage = "Thank you for completing this survey! Your responses have been recorded. Have a great day!"
        setMessages(prev => [...prev, { role: 'assistant', content: completionMessage }])
        
        await speak(completionMessage)
        
        if (!isPreview && slug) {
            try {
                const { api } = await import("@/lib/api")
                await api.submitResponse(slug, finalAnswers, {
                    mode: 'voice',
                    timeTaken: Math.round((Date.now() - startTimeRef.current) / 1000)
                })
            } catch (err) {
                console.error('Failed to submit:', err)
            }
        }
        
        onComplete?.()
    }

    const startTimeRef = useRef(Date.now())

    // Start survey
    const startSurvey = async () => {
        setHasStarted(true)
        startTimeRef.current = Date.now()
        
        const questions = getQuestions()
        const firstKey = Object.keys(questions)[0]
        
        if (!firstKey) return
        
        const intro = `Hi there! I'm Geniy, and I'll be guiding you through this survey. Feel free to respond naturally - I'll listen and understand. Let's begin!`
        
        setMessages([{ role: 'assistant', content: intro }])
        await speak(intro)
        
        // Wait a moment, then ask first question
        await new Promise(r => setTimeout(r, 500))
        
        const firstQ = questions[firstKey]
        const questionText = formatQuestionForVoice(firstQ)
        
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: questionText,
            questionId: firstKey 
        }])
        setCurrentQuestionId(firstKey)
        
        await speak(questionText)
    }

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Title
    const title = surveyData?.title || surveyData?.name || "Voice Survey"

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-violet-950 via-zinc-950 to-zinc-900 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="mb-8">
                        <Image 
                            src="/gen_states/gen_thinking.png" 
                            alt="Geniy" 
                            width={120} 
                            height={120}
                            className="mx-auto"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
                    <p className="text-zinc-400 mb-8">
                        This is a voice-based survey. I'll ask you questions and listen to your responses naturally.
                    </p>
                    <Button 
                        size="lg" 
                        className="bg-violet-600 hover:bg-violet-700 text-lg px-8 py-6"
                        onClick={startSurvey}
                    >
                        <Mic className="mr-2 w-5 h-5" />
                        Start Voice Survey
                    </Button>
                    <p className="text-xs text-zinc-500 mt-4">
                        Make sure your microphone is enabled
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-950 via-zinc-950 to-zinc-900 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Image src="/gen_states/gen_thinking.png" alt="Geniy" width={32} height={32} />
                    <span className="text-white font-medium">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className="text-zinc-400 hover:text-white"
                    >
                        {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </Button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                msg.role === 'user' 
                                    ? 'bg-violet-600 text-white' 
                                    : 'bg-zinc-800 text-zinc-100'
                            }`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {/* Speaking indicator */}
                {isSpeaking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-violet-400"
                    >
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm">Speaking...</span>
                    </motion.div>
                )}
                
                {/* Processing indicator */}
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-zinc-400"
                    >
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Processing...</span>
                    </motion.div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {!isCompleted && (
                <div className="p-4 border-t border-zinc-800 space-y-3">
                    {/* Transcript */}
                    {transcript && (
                        <div className="bg-zinc-800/50 rounded-xl px-4 py-2 text-zinc-300 text-sm">
                            {transcript}
                        </div>
                    )}
                    
                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                        <Button
                            size="lg"
                            variant={isListening ? "destructive" : "default"}
                            className={`rounded-full w-16 h-16 ${
                                isListening 
                                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                                    : 'bg-violet-600 hover:bg-violet-700'
                            }`}
                            onClick={isListening ? stopListening : startListening}
                            disabled={isSpeaking || isProcessing}
                        >
                            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </Button>
                        
                        {transcript && (
                            <Button
                                size="lg"
                                className="bg-green-600 hover:bg-green-700 rounded-full px-6"
                                onClick={() => {
                                    stopListening()
                                    processResponse(transcript)
                                }}
                                disabled={isProcessing}
                            >
                                <Send className="w-5 h-5 mr-2" />
                                Send
                            </Button>
                        )}
                    </div>
                    
                    <p className="text-center text-xs text-zinc-500">
                        {isListening ? "Listening... Tap to stop" : "Tap the mic to speak"}
                    </p>
                </div>
            )}

            {/* Completed */}
            {isCompleted && (
                <div className="p-6 text-center">
                    <p className="text-zinc-400">Survey completed. Thank you!</p>
                </div>
            )}
        </div>
    )
}
