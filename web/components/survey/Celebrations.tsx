"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"

interface CelebrationProps {
    trigger: 'answer' | 'milestone' | 'complete' | null
    milestone?: number // 25, 50, 75, 100
    onComplete?: () => void
}

/**
 * Celebration animations for survey gamification
 * - Answer: Subtle pulse/check
 * - Milestone: Badge + brief confetti  
 * - Complete: Full confetti celebration
 */
export function Celebrations({ trigger, milestone, onComplete }: CelebrationProps) {
    const [showMilestone, setShowMilestone] = useState(false)

    useEffect(() => {
        if (!trigger) return

        if (trigger === 'answer') {
            // Subtle feedback handled by parent
        } else if (trigger === 'milestone' && milestone) {
            setShowMilestone(true)
            
            // Light confetti for milestones
            confetti({
                particleCount: 30,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
                disableForReducedMotion: true
            })
            
            setTimeout(() => {
                setShowMilestone(false)
                onComplete?.()
            }, 1500)
            
        } else if (trigger === 'complete') {
            // Full celebration
            const duration = 2000
            const end = Date.now() + duration

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6']
                })
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#8b5cf6', '#22c55e', '#f59e0b', '#3b82f6']
                })

                if (Date.now() < end) {
                    requestAnimationFrame(frame)
                }
            }

            frame()
            setTimeout(() => onComplete?.(), duration)
        }
    }, [trigger, milestone, onComplete])

    return (
        <AnimatePresence>
            {showMilestone && milestone && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl">
                        <div className="text-center">
                            <div className="text-3xl mb-1">
                                {milestone === 25 && '🌟'}
                                {milestone === 50 && '🔥'}
                                {milestone === 75 && '💪'}
                                {milestone === 100 && '🎉'}
                            </div>
                            <div className="font-bold text-lg">
                                {milestone}% Complete!
                            </div>
                            <div className="text-sm text-violet-200">
                                {milestone === 25 && "Great start!"}
                                {milestone === 50 && "Halfway there!"}
                                {milestone === 75 && "Almost done!"}
                                {milestone === 100 && "You did it!"}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/**
 * Subtle answer feedback animation
 */
export function AnswerFeedback({ show }: { show: boolean }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.3 }}
                    >
                        ✓
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

/**
 * Enhanced progress bar with milestone indicators
 */
interface ProgressBarProps {
    current: number
    total: number
    showMilestones?: boolean
}

export function GamifiedProgressBar({ current, total, showMilestones = true }: ProgressBarProps) {
    const progress = total > 0 ? (current / total) * 100 : 0
    const milestones = [25, 50, 75, 100]

    return (
        <div className="w-full space-y-2">
            {/* Progress info */}
            <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                    Question {current} of {total}
                </span>
                <span className="font-medium text-violet-600 dark:text-violet-400">
                    {Math.round(progress)}%
                </span>
            </div>
            
            {/* Progress bar */}
            <div className="relative h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                {/* Milestone markers */}
                {showMilestones && milestones.map(m => (
                    <div
                        key={m}
                        className={`absolute top-0 bottom-0 w-0.5 transition-colors duration-300 ${
                            progress >= m 
                                ? 'bg-violet-400 dark:bg-violet-500' 
                                : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                        style={{ left: `${m}%` }}
                    />
                ))}
                
                {/* Progress fill */}
                <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>
        </div>
    )
}

/**
 * Completion screen with stats
 */
interface CompletionScreenProps {
    timeTaken: number // seconds
    totalQuestions: number
    onClose?: () => void
}

export function CompletionScreen({ timeTaken, totalQuestions, onClose }: CompletionScreenProps) {
    const minutes = Math.floor(timeTaken / 60)
    const seconds = timeTaken % 60
    const timeString = minutes > 0 
        ? `${minutes}m ${seconds}s` 
        : `${seconds} seconds`

    const messages = [
        "You're awesome! Thanks for sharing your thoughts.",
        "That was quick! Your feedback really helps.",
        "All done! We appreciate you taking the time.",
        "Great job! Your insights make a difference."
    ]
    const message = messages[Math.floor(Math.random() * messages.length)]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 px-6"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20"
            >
                <span className="text-4xl">🎉</span>
            </motion.div>

            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                Survey Complete!
            </h2>
            
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                {message}
            </p>

            <div className="flex justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                    <span className="text-lg">⏱️</span>
                    <span>{timeString}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    <span>{totalQuestions} questions</span>
                </div>
            </div>
        </motion.div>
    )
}
