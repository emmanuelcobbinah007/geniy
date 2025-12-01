import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, Upload, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  attachment?: string
}

interface GeniyChatProps {
    setQuestions: (questions: any[]) => void
    setTitle: (title: string) => void
    setDescription: (desc: string) => void
    setContextData: (data: any) => void
    initialContext?: string
    workspaceId?: string
}

export function GeniyChat({ setQuestions, setTitle, setDescription, setContextData, initialContext, workspaceId }: GeniyChatProps) {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    } else {
        setMessages([{
            id: "1",
            role: "assistant",
            content: "Hi! I'm Geniy. Upload your Business Context Document (BCD) or describe your goals, and I'll build the perfect survey for you."
        }])
    }
  }, [initialContext])

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      role,
      content
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
        const analysis = await api.analyzeContext(fullContext, token)
        addMessage("assistant", `I've analyzed ${analysis.companyName}. Generating a research strategy... 📝`)

        const strategy = await api.generateStrategy(analysis, token)
        addMessage("assistant", `Strategy created! Objectives: ${strategy.objectives.length}. Generating survey questions... ✍️`)

        const surveySchema = await api.generateSurvey(analysis, strategy, "", token)
        
        // Update Parent State
        setTitle(surveySchema.title)
        setDescription(surveySchema.description || "")
        setContextData({ analysis, strategy })
        
        // Handle questions whether they are an array or object
        const questionsData = surveySchema.questions;
        const questionsArray = Array.isArray(questionsData) 
            ? questionsData 
            : Object.values(questionsData);

        // Transform schema questions to our editor format
        // Transform schema questions to our editor format
        const editorQuestions = questionsArray.map((q: any, i: number) => {
            const branches = q.branches ? q.branches.map((b: any) => ({
                if: b.if,
                then: b.next.replace(/^Q/, '')
            })) : []

            // Handle "next" (Default Jump / Merge)
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

        addMessage("assistant", "Done! I've generated the survey based on your new context. Check it out on the right! 👉")

    } catch (error) {
        console.error(error)
        addMessage("assistant", "Sorry, I encountered an error while processing your document.")
    } finally {
        setIsProcessing(false)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !token) return

    const userText = input
    setInput("")
    addMessage("user", userText)
    setIsProcessing(true)

    try {
        // Treat text input as context
        addMessage("assistant", "Analyzing your request... 🧠")
        
        // Combine existing context with user input
        let contextText = userText;
        if (initialContext) {
            contextText = `Existing Business Context: ${initialContext}\n\nUser Request: ${userText}`;
        }

        const analysis = await api.analyzeContext(contextText, token)
        
        const strategy = await api.generateStrategy(analysis, token)
        addMessage("assistant", "Drafting questions... ✍️")

        const surveySchema = await api.generateSurvey(analysis, strategy, userText, token)
        
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

            // Handle "next" (Default Jump / Merge)
            // If explicit "next" is set and it's a jump (not just the next sequential question), add it as logic
            const nextId = q.next ? q.next.replace(/^Q/, '') : null;
            const currentId = i + 1;
            
            // Only add default jump if it's not the standard flow (i.e. not currentId + 1)
            // And only for non-MC questions (since MC uses branches for flow)
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
        addMessage("assistant", "Sorry, something went wrong.")
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
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg">
          <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Geniy Assistant</h2>
          <p className="text-xs text-zinc-500">AI Research Partner</p>
        </div>
      </div>

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
                {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => 
                    part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={i}>{part.slice(2, -2)}</strong>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
              </div>
            </motion.div>
          ))}
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-none px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                </div>
            </motion.div>
          )}
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
            onClick={handleSend}
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
