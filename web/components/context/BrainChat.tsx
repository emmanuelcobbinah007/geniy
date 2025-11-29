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

export function BrainChat({ context }: { context: string }) {
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

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, streamingMessageId]) // Trigger on messages change or streaming status

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
    setIsTyping(true)

    try {
        const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
        history.push({ role: "user", content: userMessage.content });

        const response = await api.chatWithContext(context, history, token);
        
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
            content: "Sorry, I encountered an error connecting to the brain. Please try again.",
            timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
    } finally {
        setIsTyping(false)
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chat with Geniy</h2>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-4">
            {messages.map((msg) => (
                <div
                key={msg.id}
                className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
                >
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.role === "user" ? "bg-zinc-900 text-white dark:bg-white dark:text-black" : "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                )}>
                    {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
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
                <div className="flex gap-3 mr-auto max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
