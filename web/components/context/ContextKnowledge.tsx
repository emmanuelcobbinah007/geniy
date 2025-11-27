"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, FileText, Save, Loader2, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner" // Assuming sonner is used, or I'll use simple alert if not

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

  // Update Context Mutation
  const updateContextMutation = useMutation({
    mutationFn: async () => {
      if (!token) return
      return api.updateContext(workspaceId, context, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["context", workspaceId] })
      // toast.success("Context updated") 
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
        <Button 
            onClick={() => updateContextMutation.mutate()} 
            disabled={updateContextMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          {updateContextMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Context
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Text Context */}
        <Card className="p-4 flex flex-col h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <label className="text-sm font-medium text-zinc-500 mb-2">Business Context</label>
          <Textarea 
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="flex-1 resize-none border-zinc-200 dark:border-zinc-800 focus:ring-violet-500 bg-transparent dark:text-white"
            placeholder="Describe your business, target audience, and key value propositions..."
          />
        </Card>

        {/* Documents */}
        <Card className="p-4 flex flex-col h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
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
                        {/* Delete button could go here */}
                    </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
