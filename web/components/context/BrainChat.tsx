import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { api } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Image from "next/image"
import { GenStateIllustration } from "@/components/ui/GenStateIllustration"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

function TypingEffect({ text, onComplete }: { text: string, onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 10) // Adjust speed here (lower = faster)
      return () => clearTimeout(timeout)
    } else {
        onComplete?.()
    }
  }, [currentIndex, text, onComplete])

  return <div className="prose dark:prose-invert prose-sm max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown></div>
}

export function BrainChat({ context, workspaceId, hideHeader = false }: { context: string; workspaceId: string; hideHeader?: boolean }) {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your campaign brain. I have access to all your business context and documents. Ask me anything about your strategy, competitors, or customer personas.",
      timestamp: new Date("2024-01-01")
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)

  const [memoryUpdate, setMemoryUpdate] = useState<string | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, streamingMessageId, isTyping]) 

  useEffect(() => {
    if (memoryUpdate) {
        const timer = setTimeout(() => setMemoryUpdate(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [memoryUpdate])

  const handleSend = async () => {
    if (!input.trim() || !token) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsTyping(true) // Show thinking state immediately

    try {
        const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
        history.push({ role: "user", content: userMessage.content });

        const response = await api.chatWithContext(context, history, workspaceId, token);
        
        if (response.memory) {
            setMemoryUpdate("Geniy learned something new!")
        }

        const aiMessageId = (Date.now() + 1).toString()
        const aiMessage: Message = {
            id: aiMessageId,
            role: "assistant",
            content: response.reply || "I'm sorry, I couldn't process that.",
            timestamp: new Date()
        }
        
        setMessages(prev => [...prev, aiMessage])
        setStreamingMessageId(aiMessageId) // Start streaming this message
    } catch (error) {
        console.error("Chat failed:", error)
        const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Connection Error: ${error instanceof Error ? error.message : "Unknown error"}. Please check console for details.`,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
    } finally {
        setIsTyping(false)
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4" id="chat-with-geniy">
      {!hideHeader && (
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chat with Geniy</h2>
            {memoryUpdate && (
                <div className="text-xs text-emerald-500 font-medium animate-in fade-in slide-in-from-top-2">
                    {memoryUpdate}
                </div>
            )}
        </div>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative">
        {/* Memory Toast for Mobile/Embedded */}
        {hideHeader && memoryUpdate && (
             <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium z-10 shadow-sm">
                {memoryUpdate}
            </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4 pb-4">
            {messages.map((msg) => (
                <div
                key={msg.id}
                className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
                >
                <div className={cn(
                    "w-8 h-8 rounded-full items-center justify-center flex-shrink-0 hidden md:flex",
                    msg.role === "user" ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                )}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Image src="/gen_states/gen_thinking.png" alt="Gen Thinking" width={34} height={34} />}
                </div>
                <div className={cn(
                    "p-3 rounded-2xl text-sm overflow-hidden",
                    msg.role === "user" 
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black rounded-tr-sm" 
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm"
                )}>
                    {msg.role === "assistant" && streamingMessageId === msg.id ? (
                        <TypingEffect 
                            text={msg.content} 
                            onComplete={() => setStreamingMessageId(null)} 
                        />
                    ) : (
                        msg.role === "assistant" ? (
                            <div className="prose dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            msg.content
                        )
                    )}
                </div>
                </div>
            ))}
            {isTyping && !streamingMessageId && (
                <div className="flex gap-3 mr-auto max-w-[80%] animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                        <Image src="/gen_states/gen_thinking.png" alt="Gen Thinking" width={34} height={34} />
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Geniy is thinking...</span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>


        {/* Input Area */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your context..."
              className="flex-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isTyping || !!streamingMessageId} className="bg-violet-600 hover:bg-violet-700 text-white">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
