import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, Upload, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { userFriendlyError, GATED_ERROR_PREFIX, isGatedError } from "@/lib/error-utils"
import { useAuth } from "@/context/auth-context"
import { CompetitorCard } from "./CompetitorCard"
import { ResearchStrategyCard } from "./ResearchStrategyCard"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Image from "next/image"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  attachment?: string
  competitorAnalysis?: any
  strategy?: any // Added for strategy card
}

interface GeniyChatProps {
    setQuestions: (questions: any[]) => void
    setTitle: (title: string) => void
    setDescription: (desc: string) => void
    setContextData: (data: any) => void
    initialContext?: string
    workspaceId?: string
    hideHeader?: boolean
    initialPrompt?: string
}

export function GeniyChat({ setQuestions, setTitle, setDescription, setContextData, initialContext, workspaceId, hideHeader = false, initialPrompt }: GeniyChatProps) {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Initialize messages based on context
  useEffect(() => {
    if (initialContext) {
        // Simple parsing of the context string
        const companyMatch = initialContext.match(/Company:\s*(.+?)(\n|$)/);
        const industryMatch = initialContext.match(/Industry:\s*(.+?)(\n|$)/);
        
        const company = companyMatch ? companyMatch[1].trim() : "your company";
        const industry = industryMatch ? industryMatch[1].trim() : "your industry";

        setMessages([{
            id: "1",
            role: "assistant",
            content: `Hi! I see you're working on **${company}** in the **${industry}** space. I've loaded your context and I'm ready to help you build a survey. What's your goal for this campaign?`
        }])

        if (initialPrompt) {
            setTimeout(() => {
                addMessage("user", initialPrompt)
                // We don't auto-send to avoid accidental triggers, or we could?
                // Let's auto-send for better UX
                handleSend(initialPrompt)
            }, 1000)
        }
    } else {
        setMessages([{
            id: "1",
            role: "assistant",
            content: "Hi! I'm Geniy. Upload your Business Context Document (BCD) or describe your goals, and I'll build the perfect survey for you."
        }])
    }
  }, [initialContext])

  const addMessage = (role: "user" | "assistant", content: string, extras?: Partial<Message>) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      role,
      content,
      ...extras
    }])
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
          processFile(file)
      }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
        processFile(file)
    }
  }

  const processFile = async (file: File) => {
    if (!token || !workspaceId) {
        if (!workspaceId) alert("No workspace selected")
        return
    }

    setIsProcessing(true)
    addMessage("user", `Uploaded: ${file.name}`)
    addMessage("assistant", "Uploading and analyzing your document... 🧠")

    try {
        // 1. Upload Document
        await api.uploadDocument(workspaceId, file, token)

        // 2. Fetch Updated Context
        const contextData = await api.getContext(workspaceId, token)
        const fullContext = contextData.businessContext || ""

        // 3. Analyze Context
        const analysis = await api.analyzeContext(fullContext, token, workspaceId)
        
        // STOP HERE: Present findings and ask for confirmation
        const analysisSummary = `
**I've analyzed your document! Here's what I learned:** 🧠

*   **Company:** ${analysis.companyName}
*   **Industry:** ${analysis.industry}
*   **Target Audience:** ${analysis.targetAudience?.join(", ") || "General Public"}
*   **Key Value:** ${analysis.valueProposition || "Not explicitly stated"}

**Does this look correct?** 
If yes, just say "Yes" or "Go ahead", and I'll build the research strategy and survey! 🚀
        `.trim();

        addMessage("assistant", analysisSummary)
        
        // Update updated context in state so the next chat message has it
        setChatContext(fullContext)

    } catch (error: any) {
        console.error(error)
        const errorMessage = userFriendlyError(error)
        if (errorMessage.startsWith(GATED_ERROR_PREFIX)) {
            addMessage("assistant", `🔒 **Upgrade Required**\n\n${errorMessage.replace(GATED_ERROR_PREFIX, '')}\n\n[Upgrade your plan](/pricing) to unlock this feature.`)
        } else {
            addMessage("assistant", errorMessage)
        }
    } finally {
        setIsProcessing(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const [chatContext, setChatContext] = useState(initialContext || "")

  useEffect(() => {
    if (initialContext) setChatContext(initialContext)
  }, [initialContext])

  const generateSurveyFromContext = async (contextText: string, userInstruction: string = "") => {
    try {
        addMessage("assistant", "Drafting questions... ✍️")
        
        const analysis = await api.analyzeContext(contextText, token!, workspaceId)
        const strategy = await api.generateStrategy(analysis, token!, workspaceId)
        const surveySchema = await api.generateSurvey(analysis, strategy, userInstruction, token!)
        
        setTitle(surveySchema.title)
        setDescription(surveySchema.description || "")
        setContextData({ analysis, strategy })
        
        // Handle questions whether they are an array or object
        const questionsData = surveySchema.questions;
        const questionsArray = Array.isArray(questionsData) 
            ? questionsData 
            : Object.values(questionsData);
        
        // Transform schema questions to our editor format
        const editorQuestions = questionsArray.map((q: any, i: number) => {
            const branches = q.branches ? q.branches.map((b: any) => ({
                if: b.if,
                then: b.next.replace(/^Q/, '')
            })) : []

            const nextId = q.next ? q.next.replace(/^Q/, '') : null;
            const currentId = i + 1;
            
            if (nextId && parseInt(nextId) !== currentId + 1 && q.type !== "multiple_choice") {
                 branches.push({ if: true, then: nextId });
            }

            return {
                id: currentId,
                type: q.type,
                title: q.question,
                required: q.required !== false,
                options: q.options || [],
                logic: branches
            }
        })
        setQuestions(editorQuestions)

        addMessage("assistant", "I've updated the survey! Let me know if you want to change anything.")

    } catch (error) {
        console.error(error)
        const errorMessage = userFriendlyError(error)
        if (errorMessage.startsWith(GATED_ERROR_PREFIX)) {
            addMessage("assistant", `🔒 **Upgrade Required**\n\n${errorMessage.replace(GATED_ERROR_PREFIX, '')}\n\n[Upgrade your plan](/#pricing) to unlock this feature.`)
        } else {
            addMessage("assistant", errorMessage)
        }
    }
  }

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || !token) return

    const userText = textToSend
    if (!overrideInput) setInput("")
    if (!overrideInput) addMessage("user", userText) // If override, we likely added it manually before calling
    setIsProcessing(true)

    try {
        // Prepare conversation history
        const conversationHistory = messages.map(m => ({
            role: m.role,
            content: m.content
        }));
        
        // Add current user message
        conversationHistory.push({ role: "user", content: userText });

        // Call Chat API with history
        const response = await api.chat(conversationHistory, chatContext, token)
        
        // Update context
        if (response.updatedContext) {
            setChatContext(response.updatedContext)
        }

        // Display AI Message
        if (response.message) {
            addMessage("assistant", response.message)
        }

        // Handle Action
        if (response.action === "GENERATE") {
            // Trigger the full generation cycle (Analyze -> Strategy -> Survey)
            // This mirrors the file upload workflow for better quality and UX
            
            // BUILD FULL CONTEXT: Include conversation history + updated context
            const conversationSummary = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            const fullChatContext = `
=== CONVERSATION HISTORY ===
${conversationSummary}
USER: ${userText}
===========================

=== AI-GENERATED CONTEXT SUMMARY ===
${response.updatedContext || chatContext}
=====================================
`;
            
            // 1. Analyze
            addMessage("assistant", "That's enough context! Analyzing your request... 🧠")
            const analysis = await api.analyzeContext(fullChatContext, token, workspaceId)
            
            // 2. Strategy
            addMessage("assistant", "Generating research strategy... 📝")
            const strategy = await api.generateStrategy(analysis, token, workspaceId)
            
            // 3. Survey
            addMessage("assistant", `Strategy created! I've outlined the core objectives and hypotheses below. Generating survey questions... ✍️`, { strategy })
            const surveySchema = await api.generateSurvey(analysis, strategy, response.message, token) // Use AI message as instruction
            
            setTitle(surveySchema.title)
            setDescription(surveySchema.description || "")
            setContextData({ analysis, strategy })
            setChatContext(response.updatedContext || chatContext)

            // Transform schema questions to our editor format
            const questionsData = surveySchema.questions;
            const questionsArray = Array.isArray(questionsData) 
                ? questionsData 
                : Object.values(questionsData);
            
            const editorQuestions = questionsArray.map((q: any, i: number) => {
                const branches = q.branches ? q.branches.map((b: any) => ({
                    if: b.if,
                    then: b.next.replace(/^Q/, '')
                })) : []

                const nextId = q.next ? q.next.replace(/^Q/, '') : null;
                const currentId = i + 1;
                
                if (nextId && parseInt(nextId) !== currentId + 1 && q.type !== "multiple_choice") {
                        branches.push({ if: true, then: nextId });
                }

                return {
                    id: currentId,
                    type: q.type,
                    title: q.question,
                    required: q.required !== false,
                    options: q.options || [],
                    logic: branches
                }
            })
            setQuestions(editorQuestions)
            
            addMessage("assistant", "Done! I've generated the survey based on your context. Check it out on the right! 👉")

        } else if (response.action === "ANALYZE_COMPETITOR" && response.competitorAnalysis) {
            // Add a special message with the analysis
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: `Here is my analysis of **${response.competitorName}**:`,
                competitorAnalysis: response.competitorAnalysis
            }])
        }

    } catch (error) {
        console.error(error)
        const errorMessage = userFriendlyError(error)
        if (errorMessage.startsWith(GATED_ERROR_PREFIX)) {
            addMessage("assistant", `🔒 **Upgrade Required**\n\n${errorMessage.replace(GATED_ERROR_PREFIX, '')}\n\n[Upgrade your plan](/#pricing) to unlock this feature.`)
        } else {
            addMessage("assistant", errorMessage)
        }
    } finally {
        setIsProcessing(false)
    }
  }

  return (
    <div 
        className={`flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors ${isDragging ? 'bg-violet-50 dark:bg-violet-900/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {/* Header */}
      {!hideHeader && (
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <Image src="/gen_states/gen_thinking.png" alt="Gen Thinking" width={50} height={50}/>
         <div>
            <h2 className="font-semibold text-sm">Geniy Assistant</h2>
            <p className="text-xs text-zinc-500">AI Research Partner</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-none"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none"
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                    </ReactMarkdown>
                </div>
                {msg.strategy && (
                    <div className="mt-4">
                        <ResearchStrategyCard strategy={msg.strategy} />
                    </div>
                )}
                {msg.competitorAnalysis && (
                    <div className="mt-3">
                        <CompetitorCard name={msg.content.split('**')[1] || "Competitor"} analysis={msg.competitorAnalysis} />
                    </div>
                )}
              </div>
            </motion.div>
          ))}
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-none px-4 py-3">
                    <GenStateIllustration state="thinking" width={80} height={80} label={null} />
                </div>
            </motion.div>
          )}
          <div ref={bottomRef} className="h-1" />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {/* BCD Upload Placeholder */}
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-3 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
        >
          <Upload className="w-3 h-3" />
          <span>Upload Business Context (PDF, DOCX)</span>
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
          />
        </div>

        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe your survey goals..."
            className="pr-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-violet-500"
            disabled={isProcessing}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1 h-8 w-8 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-500/20"
            onClick={() => handleSend()}
            disabled={isProcessing}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {isDragging && (
        <div className="absolute inset-0 bg-violet-500/10 backdrop-blur-[1px] z-50 flex items-center justify-center border-2 border-violet-500 border-dashed m-4 rounded-xl pointer-events-none">
            <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-full shadow-lg text-violet-600 font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Drop to upload & analyze
            </div>
        </div>
      )}
    </div>
  )
}
