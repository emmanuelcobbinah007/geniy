"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, FileText, Save, Loader2, Trash2, Sparkles, Target } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompetitorBattlecard } from "@/components/competitor/CompetitorBattlecard"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { LenisScroll } from "@/components/ui/lenis-scroll"
import { useSearchParams, useRouter } from "next/navigation"
import { GatedButton, GatedFeature } from "@/components/ui/gated-feature"

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
  competitors?: any[]
  lastAnalysisSummary?: string | null
  gapAnalysis?: any
  analyzingCompetitors?: string[]
}

export function ContextKnowledge({ initialContext, documents, workspaceId, competitors = [], lastAnalysisSummary, gapAnalysis, analyzingCompetitors = [] }: ContextKnowledgeProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [context, setContext] = useState(initialContext)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  
  const [gapAnalysisData, setGapAnalysisData] = useState<any | null>(gapAnalysis || null)
  const [isGapAnalysisOpen, setIsGapAnalysisOpen] = useState(false)
  
  const displayCompetitors = analysisResult?.competitors && analysisResult.competitors.length > 0 ? analysisResult.competitors : competitors;

  // Track the last summary we showed to avoid duplicate toasts
  const lastShownSummaryRef = useRef<string | null>(null);

  useEffect(() => {
      if (lastAnalysisSummary && lastAnalysisSummary !== lastShownSummaryRef.current) {
          // Show toast with the summary
          toast.success("Analysis Complete!", {
              description: lastAnalysisSummary,
              duration: 8000, // Show for longer so they can read it
          });
          lastShownSummaryRef.current = lastAnalysisSummary;
      }
  }, [lastAnalysisSummary]);

  // Sync local state when initialContext updates (e.g. after file upload)
  useEffect(() => {
    setContext(initialContext)
    
    // Attempt to parse existing context for analysis data
    if (initialContext) {
        const companyMatch = initialContext.match(/Company:\s*(.+?)(\n|$)/);
        const industryMatch = initialContext.match(/Industry:\s*(.+?)(\n|$)/);
        const audienceMatch = initialContext.match(/Target Audience:\s*(.+?)(\n|$)/);
        
        // Use DB competitors if available, otherwise parse from text
        let competitorNames: string[] = [];
        
        // Merge DB and Text competitors (Unique) with DB taking precedence on name casing
        if (initialContext || (competitors && competitors.length > 0)) {
            const dbNames = competitors && competitors.length > 0 ? competitors.filter(c => c && typeof c === 'object' && c.name).map(c => c.name) : [];
            const textNames = [];
            
             // Fallback: Extract competitors from text if not in DB
             // We do this to catch "just discovered" competitors that aren't in DB yet
             // Fallback: Extract competitors from text if not in DB
             // We do this to catch "just discovered" competitors that aren't in DB yet
             const competitorsSplit = initialContext.split("Competitors:");
             if (competitorsSplit.length > 1) {
                 const competitorsSection = competitorsSplit[1].split("\n\n")[0];
                 const lines = competitorsSection.split('\n');
                 for (const line of lines) {
                     const trimmed = line.trim();
                     if (trimmed.startsWith('- ')) {
                         const name = trimmed.substring(2);
                         if (!dbNames.some(dbn => dbn.toLowerCase() === name.toLowerCase())) {
                            textNames.push(name);
                         }
                     }
                 }
             }
             
             competitorNames = [...dbNames, ...textNames];
        } else {
             // If local array was empty, check text
             const competitorsSplit = initialContext.split("Competitors:");
             if (competitorsSplit.length > 1) {
                 const competitorsSection = competitorsSplit[1].split("\n\n")[0];
                 const lines = competitorsSection.split('\n');
                 for (const line of lines) {
                     const trimmed = line.trim();
                     if (trimmed.startsWith('- ')) {
                         competitorNames.push(trimmed.substring(2));
                     }
                 }
             }
        }

        if (companyMatch || competitorNames.length > 0) {
            setAnalysisResult({
                companyName: companyMatch ? companyMatch[1].trim() : "Unknown",
                industry: industryMatch ? industryMatch[1].trim() : "General",
                targetAudience: audienceMatch ? audienceMatch[1].split(',').map(s => s.trim()) : [],
                competitors: competitorNames
            })
        }
    } else if (competitors && competitors.length > 0) {
        // If no context text but we have competitors from DB
         setAnalysisResult(prev => {
             // Only update if actually changed to avoid loop
             const newNames = competitors.map(c => c.name);
             if (prev && JSON.stringify(prev.competitors) === JSON.stringify(newNames)) {
                 return prev;
             }
             return {
                companyName: "Unknown",
                industry: "General",
                targetAudience: [],
                competitors: newNames
            };
         })
    }

    // Sync competitor analysis data from DB to local state
    if (competitors && competitors.length > 0) {
        setCompetitorData(prev => {
            const newData = { ...prev };
            let hasNewAnalysis = false;
            
            competitors.forEach(c => {
                if (c && c.name && c.analysis && (!prev[c.name] || JSON.stringify(prev[c.name]) !== JSON.stringify(c.analysis))) {
                     newData[c.name] = c.analysis;
                     hasNewAnalysis = true;
                }
            });

            if (hasNewAnalysis) {
                return newData;
            }
            return prev;
        });
    }

    // Sync gap analysis data
    if (gapAnalysis) {
        setGapAnalysisData(gapAnalysis)
    }
  }, [initialContext, competitors, gapAnalysis])

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
      return api.analyzeContext(context, token, workspaceId)
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

  // Reanalyze Competitor Mutation (Redo Deep Dive)
  const handleRedoAnalysis = async (competitorName: string) => {
    if (!token) return;
    toast.info(`Re-analyzing ${competitorName}...`, { duration: 3000 });
    try {
      await api.reanalyzeCompetitor(workspaceId, competitorName, token);
      toast.success(`Analysis complete for ${competitorName}!`);
      queryClient.invalidateQueries({ queryKey: ["context", workspaceId] });
    } catch (err: any) {
      toast.error(`Failed to analyze ${competitorName}: ${err.message || 'Unknown error'}`);
    }
  };

  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      
      const file = e.dataTransfer.files?.[0]
      if (file) {
          setIsUploading(true)
          uploadMutation.mutate(file)
      }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      uploadMutation.mutate(file)
    }
  }

  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "context"
  // const [activeTab, setActiveTab] = useState(initialTab || "context") -- Removed local state
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState<string | null>(null)
  const [competitorData, setCompetitorData] = useState<Record<string, any>>({})

  const analyzeCompetitorMutation = useMutation({
      mutationFn: async (competitorName: string) => {
          if (!token || !analysisResult) return
          return api.analyzeCompetitor(competitorName, analysisResult.industry, workspaceId, token)
      },
      onSuccess: (data, competitorName) => {
          setCompetitorData(prev => ({ ...prev, [competitorName]: data }))
          setAnalyzingCompetitor(null)
      },
      onError: () => {
          setAnalyzingCompetitor(null)
          alert("Failed to analyze competitor")
      }
  })

  // Gap Analysis Mutation
  const gapAnalysisMutation = useMutation({
      mutationFn: async () => {
          if (!token) return
          return api.generateGapAnalysis(workspaceId, token)
      },
      onSuccess: (data) => {
          setGapAnalysisData(data)
          // Update URL to switch tab
          router.push(`/dashboard/${workspaceId}/context?tab=strategy`)
          // Invalidate query to fetch updated workspace with persisted analysis
          queryClient.invalidateQueries({ queryKey: ["context", workspaceId] })
          toast.success("Gap Analysis Generated!")
      },
      onError: () => {
          toast.error("Failed to generate Gap Analysis")
      }
  })

  // Delete Competitor Mutation
  const deleteCompetitorMutation = useMutation({
      mutationFn: async (competitorName: string) => {
          if (!token) return
          return api.deleteCompetitor(workspaceId, competitorName, token)
      },
      onSuccess: (data, competitorName) => {
          setCompetitorData(prev => {
              const newData = { ...prev };
              delete newData[competitorName];
              return newData;
          });
          queryClient.invalidateQueries({ queryKey: ["context", workspaceId] });
          toast.success(`Deleted ${competitorName}`);
      },
      onError: () => {
          toast.error("Failed to delete competitor");
      }
  })

  const handleAnalyzeCompetitor = (name: string) => {
      setAnalyzingCompetitor(name)
      analyzeCompetitorMutation.mutate(name)
  }

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-lg md:text-xl font-semibold">Geniy's Brain</h2>
        <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
            <Button 
                variant="destructive"
                size="sm"
                onClick={handleClearMemory}
                disabled={clearMutation.isPending || (!context && documents.length === 0)}
                className="bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white border border-red-500/20 hover:border-red-600 transition-colors"
            >
                {clearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Clear Memory
            </Button>
            <Button 
                size="sm"
                onClick={() => analyzeMutation.mutate()} 
                disabled={analyzeMutation.isPending || !context}
                className="bg-violet-600 hover:bg-violet-700 text-white"
            >
            {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze Context"}
            </Button>
        </div>
      </div>

      <div className="flex flex-col">
        <Tabs value={activeTab} className="flex flex-col">
            {/* TabsList Removed */}

            <TabsContent value="context" className="flex flex-col gap-6 pb-4 data-[state=inactive]:hidden">
                {/* Text Context */}
                <Card className="p-6 flex flex-col h-[45vh] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm min-h-[300px]">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-zinc-500">Business Context</label>
                    {strategyMutation.isPending && <span className="text-xs text-violet-500 animate-pulse">Generating Strategy...</span>}
                </div>
                <LenisScroll className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900/50 min-h-0">
                    <div 
                        id="business-context-display"
                        className="w-full min-h-full text-zinc-800 dark:text-zinc-200 font-mono text-sm leading-relaxed p-4 whitespace-pre-wrap"
                    >
                        {context || "Context will appear here after AI analysis or document upload..."}
                    </div>
                </LenisScroll>
                </Card>

                {/* Documents */}
                <Card 
                    id="upload-documents-section"
                    className={`p-6 flex flex-col  border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-colors min-h-[400px] ${isDragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
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

                <LenisScroll className="flex-1 pr-2 min-h-0">
                    <div className="space-y-2">
                    {documents.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg min-h-[100px]">
                            <FileText className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">{isDragging ? "Drop file to upload" : "No documents uploaded yet"}</p>
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
                </LenisScroll>
                {isDragging && (
                    <div className="absolute inset-0 bg-violet-500/10 backdrop-blur-[1px] rounded-xl flex items-center justify-center border-2 border-violet-500 border-dashed z-50">
                        <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-lg text-violet-600 font-medium flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Drop to upload
                        </div>
                    </div>
                )}
                </Card>
            </TabsContent>

            <TabsContent value="competitors" className="flex flex-col gap-6 data-[state=inactive]:hidden">
                <div className="pr-2 pb-20">
                    <div className="space-y-6">
                        {displayCompetitors && displayCompetitors.length > 0 && (
                            <div className="flex justify-end mb-4">
                                {/* Action buttons can go here if needed */}
                            </div>
                        )}

                        {!displayCompetitors || !Array.isArray(displayCompetitors) || displayCompetitors.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                                <p>No competitors discovered yet.</p>
                                <p className="text-sm">Run "Analyze Context" to identify competitors.</p>
                            </div>
                        ) : (
                            displayCompetitors.map((comp: any) => {
                                // Safe check for string or object
                                const name = typeof comp === 'string' ? comp : (comp && comp.name ? comp.name : null);
                                const lastScrapedAt = typeof comp !== 'string' && comp.lastScrapedAt ? comp.lastScrapedAt : null;

                                if (!name) return null; // Skip invalid entries

                                return (
                                <div key={name} className="space-y-4">
                                    {competitorData[name] ? (
                                        <CompetitorBattlecard 
                                            name={name} 
                                            analysis={competitorData[name]} 
                                            onDelete={() => {
                                                if (confirm(`Delete competitor "${name}"?`)) deleteCompetitorMutation.mutate(name)
                                            }}
                                            onRedoAnalysis={() => handleRedoAnalysis(name)}
                                            lastScrapedAt={lastScrapedAt}
                                            radarStatus={typeof comp !== 'string' ? comp.radarStatus : undefined}
                                            radarHistory={typeof comp !== 'string' ? comp.radarHistory : undefined}
                                        />
                                    ) : (
                                        <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                            <div>
                                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                                    {name}
                                                    {lastScrapedAt && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/50" title={`Last scanned: ${new Date(lastScrapedAt).toLocaleString()}`}>
                                                            <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                                                        </div>
                                                    )}
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`Delete competitor "${name}"?`)) deleteCompetitorMutation.mutate(name);
                                                        }}
                                                        className="h-6 w-6 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </h3>
                                                <p className="text-sm text-zinc-500">Competitor detected from context</p>
                                            </div>
                                            <GatedButton 
                                                feature="realTimeScans"
                                                onClick={() => handleAnalyzeCompetitor(name)}
                                                disabled={analyzingCompetitor === name || analyzingCompetitors.includes(name) || analyzingCompetitors.includes("ALL")}
                                                className="w-full md:w-auto"
                                            >
                                                {analyzingCompetitor === name || analyzingCompetitors.includes(name) || analyzingCompetitors.includes("ALL") ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Researching...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Analyze Deep Dive
                                                    </>
                                                )}
                                            </GatedButton>
                                        </Card>
                                    )}
                                </div>
                            )}) 
                        )}
                    </div>

                </div>
            </TabsContent>
            
            <TabsContent value="strategy" className="flex flex-col gap-4 data-[state=inactive]:hidden">
                <GatedFeature feature="gapAnalysis">
                <div className="pr-2 pb-20">
                <div className="space-y-8 max-w-5xl mx-auto py-4">
                    
                    {/* Header Action */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Strategic Intelligence</h2>
                            <p className="text-zinc-500 dark:text-zinc-400">AI-generated roadmap based on your business context and competitors.</p>
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => gapAnalysisMutation.mutate()}
                            disabled={gapAnalysisMutation.isPending}
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900"
                        >
                            {gapAnalysisMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Refresh Analysis
                        </Button>
                    </div>

                    {/* Initial Strategy Section */}
                    {strategy && (
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-violet-500" />
                                    Key Objectives
                                </h3>
                                <ul className="space-y-3">
                                    {strategy.objectives.map((obj, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0 border-violet-200 text-violet-700">
                                                {i + 1}
                                            </Badge>
                                            {obj}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                            <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    Core Hypotheses
                                </h3>
                                <ul className="space-y-3">
                                    {strategy.hypotheses.map((hyp, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                                            {hyp}
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    )}

                    {/* Gap Analysis Section */}
                    {gapAnalysisData ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Market Gaps */}
                             <section>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                    <img src="/gen_states/gen_thinking.png" alt="Gaps" width={50} height={0} />
                                    Unmet Market Needs (Gaps)
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {gapAnalysisData.gaps && Array.isArray(gapAnalysisData.gaps) && gapAnalysisData.gaps.map((gap: any, i: number) => (
                                        <Card key={i} className="p-5 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-zinc-900 border-rose-100 dark:border-rose-900/50 shadow-sm hover:shadow-md transition-shadow">
                                            <h4 className="font-semibold text-rose-900 dark:text-rose-100 mb-2">{gap.title}</h4>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{gap.description}</p>
                                        </Card>
                                    ))}
                                    {(!gapAnalysisData.gaps || !Array.isArray(gapAnalysisData.gaps) || gapAnalysisData.gaps.length === 0) && (
                                        <p className="text-sm text-zinc-400 col-span-3 text-center italic">No gaps identified yet.</p>
                                    )}
                                </div>
                            </section>

                            {/* Opportunities */}
                            <section>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                    <img src="/gen_states/gen_success.png" alt="Opportunities" width={50} height={0} />
                                    Strategic Opportunities
                                </h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {gapAnalysisData.opportunities && Array.isArray(gapAnalysisData.opportunities) && gapAnalysisData.opportunities.map((opp: any, i: number) => (
                                        <Card key={i} className="p-5 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-zinc-900 border-violet-100 dark:border-violet-900/50 shadow-sm hover:shadow-md transition-shadow">
                                            <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">{opp.title}</h4>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{opp.description}</p>
                                        </Card>
                                    ))}
                                    {(!gapAnalysisData.opportunities || !Array.isArray(gapAnalysisData.opportunities) || gapAnalysisData.opportunities.length === 0) && (
                                        <p className="text-sm text-zinc-400 col-span-3 text-center italic">No opportunities identified yet.</p>
                                    )}
                                </div>
                            </section>

                            {/* Recommendations */}
                            <section>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                    <img src="/gen_states/gen_bulb.png" alt="Recommendations" width={50} height={0} />
                                    Actionable Recommendations
                                </h3>
                                <div className="space-y-4">
                                    {gapAnalysisData.recommendations && Array.isArray(gapAnalysisData.recommendations) && gapAnalysisData.recommendations.map((rec: string, i: number) => (
                                        <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/50 transition-all group">
                                            <div className="flex flex-col items-center gap-2">
                                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 h-8 w-8 flex items-center justify-center rounded-full text-sm">
                                                    {i + 1}
                                                </Badge>
                                                <div className="w-px h-full bg-emerald-100 dark:bg-emerald-900/30 group-last:hidden min-h-[20px]" />
                                            </div>
                                            <div className="flex-1 pb-2">
                                                <p className="text-base text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium mb-3">{rec}</p>
                                                <Link href={`/create-survey?workspaceId=${workspaceId}&prompt=${encodeURIComponent(rec)}`}>
                                                    <Button variant="outline" size="sm" className="text-xs border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-400 dark:hover:bg-violet-900/20">
                                                        <Sparkles className="w-3 h-3 mr-1.5" />
                                                        Create Campaign from this
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                    {(!gapAnalysisData.recommendations || !Array.isArray(gapAnalysisData.recommendations) || gapAnalysisData.recommendations.length === 0) && (
                                        <p className="text-sm text-zinc-400 text-center italic">No recommendations identified yet.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="bg-white dark:bg-zinc-800 p-4 rounded-full mb-4 shadow-sm">
                                <img src="/gen_states/gen_consultant.png" alt="Analyst" width={64} height={64} className="opacity-90" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No Strategic Analysis Yet</h3>
                            <p className="text-zinc-500 max-w-md mb-6">
                                Run a Gap Analysis to have Geniy compare your business context against competitors and find winning opportunities.
                            </p>
                            <Button 
                                onClick={() => gapAnalysisMutation.mutate()}
                                disabled={gapAnalysisMutation.isPending}
                                size="lg"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                            >
                                {gapAnalysisMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                Run Strategic Analysis
                            </Button>
                        </div>
                    )}
                    </div>
                </div>
                </GatedFeature>
            </TabsContent>
        </Tabs>


      </div>
    </div>
  )
}
