"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowRight, Sparkles, FileText, LineChart, Search } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { AuthModal } from "@/components/auth/auth-modal"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export function Hero() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const handleStartSurvey = () => {
    if (user) {
      router.push("/create-survey?source=hero")
    } else {
      setShowAuthModal(true)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    router.push("/create-survey?source=hero")
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background pt-32 md:pt-40 transition-colors duration-300">
      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal} 
        onSuccess={handleAuthSuccess}
      />

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 z-10" /> {/* Overlay for readability */}
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{ 
                backgroundImage: `url('/hero_concept_visionary_1764767464824.png')`,
                backgroundPosition: 'center 20%' // Adjust focus to the person/cliff
            }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent z-10" />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full border-zinc-200 bg-white/50 text-zinc-600 backdrop-blur-md hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition-colors">
              <Sparkles className="w-3.5 h-3.5 mr-2 text-violet-500" />
              <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent font-semibold">
                AI-Powered Market Intelligence
              </span>
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-5xl"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold font-display tracking-tight text-white mb-6 drop-shadow-2xl">
              Market research in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 animate-gradient-x">
                minutes, not months.
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl"
          >
            <p className="text-xl text-zinc-200 leading-relaxed drop-shadow-md">
              Upload your business context. Geniy’s AI builds dynamic surveys, analyzes competitors, and delivers actionable strategic insights—automatically.
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg rounded-full bg-foreground text-background hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-lg transition-all hover:scale-105"
              onClick={handleStartSurvey}
            >
              Start with a Survey
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-zinc-200 bg-white/50 text-foreground hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 backdrop-blur-sm">
              View Interactive Demo
            </Button>
          </motion.div>
        </div>

        {/* Transformation Pipeline Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative mt-24 mb-12 mx-auto max-w-6xl"
        >
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-6 items-center">
            
            {/* Step 1: Input (Raw Context) */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <Card className="relative h-64 bg-white/80 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between backdrop-blur-xl">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium">Business_Context.pdf</span>
                </div>
                <div className="space-y-2 opacity-50">
                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                  <div className="h-2 w-5/6 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                  <div className="h-2 w-4/6 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                  <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                </div>
                <div className="mt-auto">
                  <Badge variant="outline" className="border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Input</Badge>
                </div>
              </Card>
            </motion.div>

            {/* Step 2: AI Processing (The Core) */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="relative flex justify-center items-center"
            >
              {/* Connecting Lines (Desktop) */}
              <div className="hidden md:block absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-zinc-200 via-violet-500/50 to-zinc-200 dark:from-zinc-800 dark:to-zinc-800 -z-10" />
              
              {/* Connecting Line (Mobile) */}
              <div className="md:hidden absolute top-[-4rem] bottom-[-10rem] w-0.5 bg-gradient-to-b from-zinc-200 via-violet-500/50 to-zinc-200 dark:from-zinc-800 dark:to-zinc-800 -z-10" />

              <div className="relative w-48 h-48">
                <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-full h-full bg-white dark:bg-zinc-950 border border-violet-500/30 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(124,58,237,0.2)]">
                  <div className="absolute inset-0 rounded-full border border-violet-500/20 animate-[spin_10s_linear_infinite]" />
                  <div className="absolute inset-2 rounded-full border border-fuchsia-500/20 animate-[spin_15s_linear_infinite_reverse]" />
                  <Sparkles className="w-16 h-16 text-violet-600 dark:text-white drop-shadow-[0_0_10px_rgba(124,58,237,0.5)] dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center w-max">
                  <div className="text-sm font-semibold text-violet-600 dark:text-violet-300">Geniy AI Engine</div>
                  <div className="text-xs text-zinc-500">Processing...</div>
                </div>
              </div>
            </motion.div>

            {/* Step 3: Output (Structured Insights) */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <Card className="relative h-64 bg-white/80 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 p-6 flex flex-col backdrop-blur-xl overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400">
                    <LineChart className="w-5 h-5" />
                    <span className="text-sm font-semibold">Strategic Insights</span>
                  </div>
                  <Badge className="bg-fuchsia-500/10 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 border-fuchsia-500/30">Ready</Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Customer Segments</span>
                    <span>4 Identified</span>
                  </div>
                  <div className="flex gap-2 h-16 items-end">
                    <div className="w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-t h-[40%]" />
                    <div className="w-1/4 bg-violet-500/50 rounded-t h-[80%]" />
                    <div className="w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded-t h-[60%]" />
                    <div className="w-1/4 bg-fuchsia-500/50 rounded-t h-[90%]" />
                  </div>
                  <div className="p-3 rounded bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                      <Search className="w-3 h-3" />
                      <span>Competitor Gap Found</span>
                    </div>
                    <div className="h-1.5 w-2/3 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                  </div>
                </div>
              </Card>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </section>
  )
}
