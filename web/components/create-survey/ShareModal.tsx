"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Copy, ArrowRight, PartyPopper, Mic, FileText } from "lucide-react"
import { useState } from "react"

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl: string
  onDashboard: () => void
}

export function ShareModal({ open, onOpenChange, shareUrl, onDashboard }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'text' | 'voice'>('text')

  // Generate voice URL by replacing /s/ with /v/
  const voiceUrl = shareUrl.replace('/s/', '/v/')
  const activeUrl = mode === 'voice' ? voiceUrl : shareUrl

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <PartyPopper className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-center text-xl">Survey Published!</DialogTitle>
          <DialogDescription className="text-center">
            Your survey is live and ready to collect responses.
          </DialogDescription>
        </DialogHeader>
        
        {/* Mode Toggle */}
        <div className="flex items-center justify-center gap-2 mt-2 mb-4">
          <Button
            size="sm"
            variant={mode === 'text' ? 'primary' : 'outline'}
            onClick={() => setMode('text')}
            className={mode === 'text' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            <FileText className="w-4 h-4 mr-2" />
            Text Mode
          </Button>
          <Button
            size="sm"
            variant={mode === 'voice' ? 'primary' : 'outline'}
            onClick={() => setMode('voice')}
            className={mode === 'voice' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            <Mic className="w-4 h-4 mr-2" />
            Voice Mode
          </Button>
        </div>

        {mode === 'voice' && (
          <p className="text-xs text-center text-violet-600 dark:text-violet-400 -mt-2 mb-2">
            Respondents can speak their answers naturally
          </p>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input
              readOnly
              value={activeUrl}
              className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
            />
          </div>
          <Button size="icon" onClick={handleCopy} className="shrink-0 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter className="sm:justify-center mt-4">
          <Button 
            type="button" 
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            onClick={onDashboard}
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

