"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, FileText, Save, Loader2, Trash2, Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompetitorBattlecard } from "@/components/competitor/CompetitorBattlecard"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Target, TrendingUp } from "lucide-react"

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

interface GapAnalysisResult {
  gaps: { title: string; description: string }[]
  opportunities: { title: string; description: string }[]
  recommendations: string[]
}

interface ContextKnowledgeProps {
  initialContext: string
  documents: ContextDocument[]
  workspaceId: string
  competitors?: any[]
  lastAnalysisSummary?: string | null
}

export function ContextKnowledge({ initialContext, documents, workspaceId, competitors = [], lastAnalysisSummary }: ContextKnowledgeProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [context, setContext] = useState(initialContext)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [strategy, setStrategy] = useState<Strategy | null>(null)

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
        if (competitors && competitors.length > 0) {
            competitorNames = competitors.map(c => c.name);
        } else {
            // Fallback: Extract competitors from text
            const competitorsSection = initialContext.split("Competitors:")[1];
            if (competitorsSection) {
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
                if (c.analysis && !prev[c.name]) {
                    newData[c.name] = c.analysis;
                    hasNewAnalysis = true;
                } else if (c.analysis && JSON.stringify(prev[c.name]) !== JSON.stringify(c.analysis)) {
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
  }, [initialContext, JSON.stringify(competitors)])

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

  const [activeTab, setActiveTab] = useState("context")
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState<string | null>(null)
  const [competitorData, setCompetitorData] = useState<Record<string, any>>({})

  const analyzeCompetitorMutation = useMutation({
      mutationFn: async (competitorName: string) => {
          if (!token || !analysisResult) return
          return api.analyzeCompetitor(competitorName, analysisResult.industry, token)
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

  const handleAnalyzeCompetitor = (name: string) => {
      setAnalyzingCompetitor(name)
      analyzeCompetitorMutation.mutate(name)
  }

  const [isGapAnalysisOpen, setIsGapAnalysisOpen] = useState(false)
  const [gapAnalysisData, setGapAnalysisData] = useState<GapAnalysisResult | null>(null)

  const gapAnalysisMutation = useMutation({
      mutationFn: async () => {
          if (!token) return
          return api.generateGapAnalysis(workspaceId, token)
      },
      onSuccess: (data) => {
          setGapAnalysisData(data)
          setIsGapAnalysisOpen(true)
          toast.success("Gap Analysis Generated!")
      },
      onError: () => {
          toast.error("Failed to generate Gap Analysis")
      }
  })

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Geniy's Brain</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button 
                variant="destructive"
                size="sm"
                onClick={handleClearMemory}
                disabled={clearMutation.isPending || (!context && documents.length === 0)}
                className="flex-1 md:flex-none bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20"
            >
                {clearMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Clear Memory
            </Button>
            <Button 
                onClick={() => analyzeMutation.mutate()} 
                disabled={analyzeMutation.isPending || !context}
                className="flex-1 md:flex-none bg-violet-600 hover:bg-violet-700 text-white"
            >
            {analyzeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze Context"}
            </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start border-b border-zinc-200 dark:border-zinc-800 bg-transparent p-0 h-auto rounded-none mb-4">
                <TabsTrigger value="context" className="rounded-none border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 data-[state=active]:border-violet-600 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:bg-transparent px-4 py-2 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                    Context & Documents
                </TabsTrigger>
                <TabsTrigger value="competitors" className="rounded-none border-b-2 border-transparent text-zinc-500 dark:text-zinc-400 data-[state=active]:border-violet-600 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 data-[state=active]:bg-transparent px-4 py-2 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                    Competitor Intel
                </TabsTrigger>
            </TabsList>

            <TabsContent value="context" className="flex-1 flex flex-col gap-6 min-h-0 data-[state=inactive]:hidden">
                {/* Text Context */}
                <Card className="p-6 flex flex-col flex-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-zinc-500">Business Context</label>
                    {strategyMutation.isPending && <span className="text-xs text-violet-500 animate-pulse">Generating Strategy...</span>}
                </div>
                <Textarea 
                    id="business-context-input"
                    value={context}
                    readOnly
                    className="flex-1 resize-none border-zinc-200 dark:border-zinc-800 focus:ring-0 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-200 font-mono text-sm leading-relaxed"
                    placeholder="Context will appear here after AI analysis or document upload..."
                />
                </Card>

                {/* Documents */}
                <Card 
                    id="upload-documents-section"
                    className={`p-6 flex flex-col h-1/3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-colors ${isDragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/10' : ''}`}
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

                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {documents.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
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

            <TabsContent value="competitors" className="flex-1 min-h-0 relative data-[state=inactive]:hidden">
                <div 
                    ref={(node) => {
                        if (node) {
                            // Initialize Lenis on this container
                            import('lenis').then(({ default: Lenis }) => {
                                const lenis = new Lenis({
                                    wrapper: node,
                                    content: node.firstElementChild as HTMLElement,
                                    duration: 1.2,
                                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                                    orientation: 'vertical',
                                    gestureOrientation: 'vertical',
                                    smoothWheel: true,
                                    touchMultiplier: 2,
                                })

                                function raf(time: number) {
                                    lenis.raf(time)
                                    requestAnimationFrame(raf)
                                }

                                requestAnimationFrame(raf)
                            })
                        }
                    }}
                    className="absolute inset-0 overflow-y-auto pr-2 pb-20 scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <div className="space-y-6">
                        {/* Gap Analysis Header */}
                        {analysisResult?.competitors && analysisResult.competitors.length > 0 && (
                            <div className="flex justify-end mb-4">
                                <Button 
                                    onClick={() => gapAnalysisMutation.mutate()}
                                    disabled={gapAnalysisMutation.isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {gapAnalysisMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
                                    Run Gap Analysis
                                </Button>
                            </div>
                        )}

                        {!analysisResult?.competitors || analysisResult.competitors.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500">
                                <p>No competitors discovered yet.</p>
                                <p className="text-sm">Run "Analyze Context" to identify competitors.</p>
                            </div>
                        ) : (
                            analysisResult.competitors.map((comp) => (
                                <div key={comp} className="space-y-4">
                                    {competitorData[comp] ? (
                                        <CompetitorBattlecard name={comp} analysis={competitorData[comp]} />
                                    ) : (
                                        <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold">{comp}</h3>
                                                <p className="text-sm text-zinc-500">Competitor detected from context</p>
                                            </div>
                                            <Button 
                                                onClick={() => handleAnalyzeCompetitor(comp)}
                                                disabled={analyzingCompetitor === comp}
                                            >
                                                {analyzingCompetitor === comp ? (
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
                                            </Button>
                                        </Card>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </TabsContent>
        </Tabs>

        <Dialog open={isGapAnalysisOpen} onOpenChange={setIsGapAnalysisOpen}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Target className="w-6 h-6 text-emerald-600" />
                        Strategic Gap Analysis
                    </DialogTitle>
                    <DialogDescription>
                        AI-powered comparison of your business context against discovered competitors.
                    </DialogDescription>
                </DialogHeader>

                {gapAnalysisData && (
                    <div className="space-y-8 mt-4">
                        {/* Market Gaps */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <TrendingUp className="w-5 h-5 text-amber-500" />
                                Unmet Market Needs
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {gapAnalysisData.gaps.map((gap, i) => (
                                    <Card key={i} className="p-4 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30">
                                        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">{gap.title}</h4>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{gap.description}</p>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Opportunities */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <Sparkles className="w-5 h-5 text-violet-500" />
                                Your Strategic Opportunities
                            </h3>
                            <div className="grid md:grid-cols-3 gap-4">
                                {gapAnalysisData.opportunities.map((opp, i) => (
                                    <Card key={i} className="p-4 bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800/30">
                                        <h4 className="font-medium text-violet-900 dark:text-violet-100 mb-2">{opp.title}</h4>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{opp.description}</p>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* Recommendations */}
                        <section>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <Lightbulb className="w-5 h-5 text-emerald-500" />
                                Actionable Recommendations
                            </h3>
                            <div className="space-y-3">
                                {gapAnalysisData.recommendations.map((rec, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 border-emerald-200">
                                            Step {i + 1}
                                        </Badge>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 pt-0.5">{rec}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
