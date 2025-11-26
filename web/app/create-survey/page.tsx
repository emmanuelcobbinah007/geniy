"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Sparkles, Plus, GripVertical, Trash2, Upload, GitBranch, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/context/auth-context"

import { Reorder, useDragControls } from "framer-motion"

export default function CreateSurveyPage() {
  const [questions, setQuestions] = useState([
    { id: 1, type: "multiple_choice", title: "What is your primary goal?", required: true, options: ["Market Research", "Product Feedback", "Customer Satisfaction"], logic: [] as any[] }
  ])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true)
    }
  }, [isLoading, user])

  const addLogic = (qId: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, logic: [...q.logic, { if: "", then: "" }] }
      }
      return q
    }))
  }

  const deleteQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      
      {/* Header */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-500 hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
          <Input 
            className="h-8 w-48 bg-transparent border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 text-sm font-medium text-foreground placeholder:text-zinc-400 px-2 transition-all" 
            defaultValue="Untitled Survey"
          />
        </div>

        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-300 hover:bg-violet-500/20 border border-violet-500/20 transition-all hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Sparkles className="w-4 h-4 mr-2 text-violet-500 dark:text-violet-400" />
                Let Geniy Take Over
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-foreground sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-display">Upload Context</DialogTitle>
                <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                  Upload your Business Context Document (business plan, notes, or competitor list). Geniy will generate a tailored survey structure for you.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-violet-500/50 hover:bg-violet-500/5 transition-all cursor-pointer group">
                  <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4 group-hover:bg-violet-500/20 transition-colors">
                    <Upload className="w-6 h-6 text-zinc-400 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Click to upload or drag and drop</p>
                  <p className="text-xs text-zinc-500 mt-1">PDF, DOCX, or TXT (Max 10MB)</p>
                </div>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Survey
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 font-medium">Publish</Button>
        </div>
      </header>

      {/* Builder Canvas */}
      <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Survey Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
          >
            <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-transparent hover:border-zinc-300 dark:hover:border-zinc-800 transition-all shadow-sm dark:shadow-none">
              <Input 
                className="text-4xl md:text-5xl font-bold font-display bg-transparent border-none px-0 h-auto placeholder:text-zinc-400 focus-visible:ring-0 text-foreground" 
                placeholder="Survey Title"
                defaultValue="Market Research Survey"
              />
              <Textarea 
                className="mt-4 text-xl text-zinc-600 dark:text-zinc-300 bg-transparent border-none px-0 resize-none min-h-[60px] focus-visible:ring-0 placeholder:text-zinc-400 leading-relaxed"
                placeholder="Describe what this survey is about..."
              />
            </div>
          </motion.div>

          {/* Question List */}
          <div className="space-y-6">
            <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-6">
              <AnimatePresence>
                {questions.map((q) => (
                  <Reorder.Item key={q.id} value={q} style={{ listStyle: "none" }}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group relative"
                    >
                      <div className="absolute left-0 top-6 -translate-x-full pr-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block cursor-grab active:cursor-grabbing">
                        <div className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                          <GripVertical className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <Card className={cn(
                        "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-6 transition-all duration-200",
                        "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
                        "focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20"
                      )}>
                        <div className="flex items-start gap-4">
                          <div className="flex-1 space-y-4">
                            <Input 
                              className="bg-transparent border-none text-xl font-medium text-foreground placeholder:text-zinc-400 px-0 focus-visible:ring-0 h-auto"
                              placeholder="Type your question here..."
                              defaultValue={q.title}
                            />
                            
                            {/* Options Area (if applicable) */}
                            {q.type === "multiple_choice" && (
                              <div className="space-y-2 pl-1">
                                {q.options?.map((opt, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700" />
                                    <Input 
                                      className="h-8 bg-transparent border-none text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 px-2 focus-visible:ring-0 focus:bg-zinc-100 dark:focus:bg-zinc-950/50 rounded"
                                      defaultValue={opt}
                                    />
                                  </div>
                                ))}
                                <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                                  <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-700 border-dashed" />
                                  <span className="text-sm text-zinc-500 px-2">Add option</span>
                                </div>
                              </div>
                            )}

                            {/* Controls */}
                            <div className="flex items-center gap-4 pt-2">
                              <Select defaultValue={q.type || "text"}>
                                <SelectTrigger className="w-[140px] h-8 text-xs bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Short Text</SelectItem>
                                  <SelectItem value="long_text">Long Text</SelectItem>
                                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                  <SelectItem value="rating">Rating</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
                              
                              <div className="flex items-center gap-2">
                                <input type="checkbox" id={`req-${q.id}`} className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-violet-600 focus:ring-violet-600 focus:ring-offset-white dark:focus:ring-offset-zinc-950" defaultChecked={q.required} />
                                <label htmlFor={`req-${q.id}`} className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer transition-colors">Required</label>
                              </div>

                              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10"
                                onClick={() => addLogic(q.id)}
                              >
                                <GitBranch className="w-3.5 h-3.5 mr-1.5" />
                                <span className="text-xs">Logic</span>
                              </Button>
                            </div>

                            {/* Logic Section */}
                            {q.logic && q.logic.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/50 space-y-2"
                              >
                                {q.logic.map((rule, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/50">
                                    <GitBranch className="w-3.5 h-3.5 text-violet-500" />
                                    <span>If answer is</span>
                                    <Select>
                                      <SelectTrigger className="w-[140px] h-7 text-xs border-none bg-transparent p-0 focus:ring-0 shadow-none hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 px-2 rounded-md transition-colors">
                                        <SelectValue placeholder="Select option..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {q.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                                    <span>jump to</span>
                                    <Select>
                                      <SelectTrigger className="w-[140px] h-7 text-xs border-none bg-transparent p-0 focus:ring-0 shadow-none hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 px-2 rounded-md transition-colors">
                                        <SelectValue placeholder="Select question..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="end">End of Survey</SelectItem>
                                        {questions.filter(targetQ => targetQ.id !== q.id).map(targetQ => (
                                          <SelectItem key={targetQ.id} value={targetQ.id.toString()}>
                                            {targetQ.id}. {targetQ.title || "Untitled"}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteQuestion(q.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          </div>

          {/* Add Question Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center py-8"
          >
            <Button 
              variant="ghost" 
              className="text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              onClick={() => setQuestions([...questions, { id: questions.length + 1, type: "text", title: "", required: false, options: [], logic: [] }])}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Question
            </Button>
          </motion.div>

        </div>
      </div>
    </main>
  )
}
