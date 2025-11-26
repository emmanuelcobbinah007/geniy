"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, Upload, Paperclip, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  attachment?: string
}

export function GeniyChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm Geniy. Upload your Business Context Document (BCD) or tell me about your goals, and I'll help you build the perfect survey."
    }
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input
    }

    setMessages([...messages, newMessage])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I've updated the survey based on your request. What else would you like to tweak?"
      }])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
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
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
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
                {msg.content}
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {/* BCD Upload Placeholder */}
        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-3 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors">
          <Upload className="w-3 h-3" />
          <span>Upload Business Context (PDF, DOCX)</span>
        </div>

        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe your survey goals..."
            className="pr-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-violet-500"
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1 h-8 w-8 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-500/20"
            onClick={handleSend}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
