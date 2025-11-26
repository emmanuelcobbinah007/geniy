"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AuthForm } from "./auth-form"
import { Sparkles } from "lucide-react"

export function AuthModal({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess?: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden gap-0">
        <div className="p-6 pb-0">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 mb-2">
               <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                 <Sparkles className="w-4 h-4" />
               </div>
               <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Save your progress</span>
            </div>
            <DialogTitle className="text-2xl font-display">Create your account</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              To ensure you don't lose your survey setup, please sign in or create an account.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-2 pb-2">
          <AuthForm isModal={true} onSuccess={onSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
