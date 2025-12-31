"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AuthForm } from "./auth-form"
import { Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: 'default' | 'trial'; // 'trial' = signup flow with trial messaging
  defaultTier?: string; // Override tier to assign (e.g., 'STARTER', 'PRO')
}

export function AuthModal({ open, onOpenChange, onSuccess, mode = 'default', defaultTier }: AuthModalProps) {
  const isTrial = mode === 'trial';
  // Use provided defaultTier, or fall back to STARTER for trial mode
  const tierToAssign = defaultTier || (isTrial ? 'STARTER' : undefined);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden gap-0">
        <div className="p-6 pb-0">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 mb-2">
               
               {isTrial ? (
                 <Badge className="bg-emerald-600 text-white border-none">14-Day Free Trial</Badge>
               ) : (
                 <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Save your progress</span>
               )}
            </div>
            <DialogTitle className="text-2xl font-display">
              {isTrial ? "Start your free trial" : "Create your account"}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              {isTrial 
                ? "Get full access to Starter features for 14 days. No credit card required."
                : "To ensure you don't lose your survey setup, please sign in or create an account."
              }
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-2 pb-2">
          <AuthForm 
            isModal={true} 
            onSuccess={onSuccess} 
            defaultTier={tierToAssign}
            defaultToSignup={isTrial || !!defaultTier}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
