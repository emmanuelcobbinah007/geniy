"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, FileText, Save, Loader2, Trash2, Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

interface Document {
  id: string
  name: string
  type: string
  size: number
  createdAt: string
}

interface ContextKnowledgeProps {
  initialContext: string
  documents: Document[]
  workspaceId: string
}

export function ContextKnowledge({ initialContext, documents, workspaceId }: ContextKnowledgeProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [context, setContext] = useState(initialContext)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [strategy, setStrategy] = useState<any>(null)

  // Update Context Mutation
  const updateContextMutation = useMutation({
    mutationFn: async () => {
      if (!token) return
      return api.updateContext(workspaceId, context, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", workspaceId] })
      alert("Context updated successfully")
    },
    onError: () => {
      alert("Failed to update context")
    }
  })

  // Upload Document Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!token) return
      return api.uploadDocument(workspaceId, file, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", workspaceId] })
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    onError: () => {
      setIsUploading(false)
      alert("Failed to upload document")
    }
  })

  // Analyze Context Mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!token || !context) return
      return api.analyzeContext(context, token)
    },
    onSuccess: (data) => {
      setAnalysisResult(data)
    },
    onError: () => {
      alert("Failed to analyze context")
    }
  })

  // Generate Strategy Mutation
  const strategyMutation = useMutation({
    mutationFn: async () => {
      if (!token || !analysisResult) return
      return api.generateStrategy(analysisResult, token)
    },
    onSuccess: (data) => {
      setStrategy(data)
    },
    onError: () => {
      alert("Failed to generate strategy")
    }
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      uploadMutation.mutate(file)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Geniy's Brain</h2>
        <div className="flex gap-2">
            <Button 
                onClick={() => analyzeMutation.mutate()} 
                disabled={analyzeMutation.isPending || !context}
                variant="outline"
                className="border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-900/20"
            >
            {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze with AI
            </Button>
            <Button 
                onClick={() => updateContextMutation.mutate()} 
                disabled={updateContextMutation.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white"
            >
            {updateContextMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Context
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6 h-full">
            {/* Text Context */}
            <Card className="p-4 flex flex-col flex-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <label className="text-sm font-medium text-zinc-500 mb-2">Business Context</label>
            <Textarea 
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="flex-1 resize-none border-zinc-200 dark:border-zinc-800 focus:ring-violet-500 bg-transparent dark:text-white"
                placeholder="Describe your business, target audience, and key value propositions..."
            />
            </Card>

            {/* Documents */}
            <Card className="p-4 flex flex-col h-1/3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-zinc-500">Documents</label>
                <div className="relative">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                    />
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                        Upload
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {documents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No documents uploaded yet</p>
                    </div>
                ) : (
                    documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 text-violet-600 dark:text-violet-400">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">{doc.name}</p>
                                    <p className="text-xs text-zinc-500">{(doc.size / 1024).toFixed(1)} KB • {new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            </Card>
        </div>

        {/* AI Analysis & Strategy Column */}
        <div className="flex flex-col gap-6 h-full overflow-y-auto">
            {analysisResult && (
                <Card className="p-6 border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-900/10">
                    <h3 className="text-lg font-semibold text-violet-900 dark:text-violet-100 mb-4 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-violet-600" />
                        AI Analysis
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-violet-600 uppercase tracking-wider">Company</label>
                            <p className="text-zinc-800 dark:text-zinc-200">{analysisResult.companyName}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-violet-600 uppercase tracking-wider">Industry</label>
                            <p className="text-zinc-800 dark:text-zinc-200">{analysisResult.industry}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-violet-600 uppercase tracking-wider">Target Audience</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {analysisResult.targetAudience.map((aud: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-white dark:bg-zinc-800 rounded text-xs border border-violet-100 dark:border-violet-900">
                                        {aud}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        {!strategy && (
                            <Button 
                                onClick={() => strategyMutation.mutate()}
                                disabled={strategyMutation.isPending}
                                className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                {strategyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Generate Research Strategy
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {strategy && (
                <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <h3 className="text-lg font-semibold mb-4">Research Strategy</h3>
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-medium mb-2 text-sm text-zinc-500">Objectives</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {strategy.objectives.map((obj: string, i: number) => (
                                    <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{obj}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2 text-sm text-zinc-500">Hypotheses</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {strategy.hypotheses.map((hyp: string, i: number) => (
                                    <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300">{hyp}</li>
                                ))}
                            </ul>
                        </div>
                         <Button 
                            className="w-full bg-black hover:bg-zinc-800 text-white dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                            onClick={() => alert("Coming soon: Generate Survey!")}
                        >
                            Create Survey from Strategy
                        </Button>
                    </div>
                </Card>
            )}
            
            {!analysisResult && (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-center max-w-xs">
                        Analyze your context to unlock AI-powered insights and strategy generation.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
