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

interface ContextDocument {
  id: string
  name: string
  type: string
  size: number
  createdAt: string
}

interface AnalysisResult {
  companyName: string
  industry: string
  targetAudience: string[]
  competitors?: string[]
}

interface Strategy {
  objectives: string[]
  hypotheses: string[]
}

interface ContextKnowledgeProps {
  initialContext: string
  documents: ContextDocument[]
  workspaceId: string
}

export function ContextKnowledge({ initialContext, documents, workspaceId }: ContextKnowledgeProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [context, setContext] = useState(initialContext)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [strategy, setStrategy] = useState<Strategy | null>(null)

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
      
      // Format context string
      let contextString = `Company: ${data.companyName}\nIndustry: ${data.industry}\nTarget Audience: ${data.targetAudience.join(', ')}\n\n`;
      
      if (data.competitors && data.competitors.length > 0) {
          contextString += `Competitors:\n- ${data.competitors.join('\n- ')}\n\n`;
      }

      // Trigger strategy generation automatically
      strategyMutation.mutate(data);
      
      // Update local state
      setContext(contextString);
      
      // Save to DB
      if (token) {
        api.updateContext(workspaceId, contextString, token)
          .then(() => queryClient.invalidateQueries({ queryKey: ["context", workspaceId] }))
          .catch(err => console.error("Failed to save context", err));
      }
    },
    onError: () => {
      alert("Failed to analyze context")
    }
  })

  // Generate Strategy Mutation
  const strategyMutation = useMutation({
    mutationFn: async (analysisData?: AnalysisResult) => {
      const dataToUse = analysisData || analysisResult;
      if (!token || !dataToUse) return
      return api.generateStrategy(dataToUse, token)
    },
    onSuccess: (data) => {
      setStrategy(data)
      
      // Append strategy to context string
      setContext(prev => {
          let newContext = prev;
          if (!newContext.includes("Strategy Objectives:")) {
              newContext += `Strategy Objectives:\n- ${data.objectives.join('\n- ')}\n\n`;
              newContext += `Hypotheses:\n- ${data.hypotheses.join('\n- ')}\n`;
              
              // Save updated context with strategy
              if (token) {
                api.updateContext(workspaceId, newContext, token)
                    .then(() => queryClient.invalidateQueries({ queryKey: ["context", workspaceId] }))
                    .catch(err => console.error("Failed to save strategy", err));
              }
          }
          return newContext;
      })
    },
    onError: () => {
      alert("Failed to generate strategy")
    }
  })

  // Clear Context Mutation
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!token) return
      return api.clearContext(workspaceId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", workspaceId] })
      setContext("")
      setAnalysisResult(null)
      setStrategy(null)
      toast.success("Memory cleared successfully")
    },
    onError: () => {
      toast.error("Failed to clear memory")
    }
  })

  const handleClearMemory = () => {
      if (window.confirm("Are you sure? This will wipe all context and documents for this workspace. This action cannot be undone.")) {
          clearMutation.mutate()
      }
  }

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
                variant="destructive"
                size="sm"
                onClick={handleClearMemory}
                disabled={clearMutation.isPending || (!context && documents.length === 0)}
                className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20"
            >
                {clearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Clear Memory
            </Button>
            <Button 
                onClick={() => analyzeMutation.mutate()} 
                disabled={analyzeMutation.isPending || !context}
                className="bg-violet-600 hover:bg-violet-700 text-white"
            >
            {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze Context"}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6 h-full">
            {/* Text Context */}
            <Card className="p-6 flex flex-col flex-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-zinc-500">Business Context</label>
                {strategyMutation.isPending && <span className="text-xs text-violet-500 animate-pulse">Generating Strategy...</span>}
            </div>
            <Textarea 
                value={context}
                readOnly
                className="flex-1 resize-none border-zinc-200 dark:border-zinc-800 focus:ring-0 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 font-mono text-sm leading-relaxed"
                placeholder="Context will appear here after AI analysis or document upload..."
            />
            </Card>

            {/* Documents */}
            <Card className="p-6 flex flex-col h-1/3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
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
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
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
      </div>
    </div>
  )
}
