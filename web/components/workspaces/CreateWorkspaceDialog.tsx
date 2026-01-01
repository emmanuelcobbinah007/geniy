"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { 
  Zap, 
  Sparkles, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Building2,
  Crown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "plan" | "name" | "payment"

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "$29",
    period: "/mo",
    trial: true,
    trialDays: 14,
    description: "For solo founders who move fast",
    icon: Zap,
    color: "blue",
    features: [
      "Unlimited surveys",
      "Track 3 competitors",
      "AI Insights",
      "CSV Export"
    ],
    popular: false,
  },
  {
    id: "PRO",
    name: "Pro",
    price: "$79",
    period: "/mo",
    trial: false,
    description: "For teams who want the full picture",
    icon: Sparkles,
    color: "violet",
    features: [
      "Everything in Starter",
      "10 competitors",
      "5 team seats",
      "Slack & Discord",
      "Strategy Reports"
    ],
    popular: true,
  },
]

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()
  
  const [step, setStep] = useState<Step>("plan")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClose = () => {
    setStep("plan")
    setSelectedPlan(null)
    setWorkspaceName("")
    onOpenChange(false)
  }

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    setStep("name")
  }

  const handleBack = () => {
    if (step === "name") {
      setStep("plan")
    }
  }

  const handleCreateWorkspace = async () => {
    if (!token || !workspaceName.trim() || !selectedPlan) return
    
    setIsProcessing(true)
    
    try {
      const plan = PLANS.find(p => p.id === selectedPlan)
      
      // Both Starter and Pro go through Paystack
      // Starter: Collects card for future billing (trial starts)
      // Pro: Charges immediately
      
      // Store pending workspace info for after payment
      localStorage.setItem('pendingWorkspace', JSON.stringify({
        name: workspaceName,
        planTier: selectedPlan,
        email: user?.email,
        hasTrial: plan?.trial || false,
      }))
      
      // Call subscribe endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payment/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planTier: selectedPlan,
          email: user?.email,
          hasTrial: plan?.trial || false,
          // For new workspace, we'll create it after payment
          isNewWorkspace: true,
          workspaceName: workspaceName,
        }),
      })

      const data = await response.json()
      
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        throw new Error(data.error || 'Failed to initialize payment')
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to create workspace")
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 max-w-2xl p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Plan */}
          {step === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl text-zinc-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-6 h-6 text-violet-500" />
                  Choose a Plan
                </DialogTitle>
                <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                  Select a plan for your new workspace
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PLANS.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlanSelect(plan.id)}
                    className={cn(
                      "relative p-6 rounded-xl border-2 text-left transition-all",
                      "hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10",
                      plan.popular 
                        ? "border-violet-500 bg-violet-500/5" 
                        : "border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-4 px-3 py-1 rounded-full bg-violet-500 text-xs font-semibold text-white">
                        Most Popular
                      </span>
                    )}
                    
                    {plan.trial && (
                      <span className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-emerald-500 text-xs font-semibold text-white">
                        14-Day Free Trial
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        plan.color === "violet" 
                          ? "bg-violet-100 dark:bg-violet-900/30" 
                          : "bg-blue-100 dark:bg-blue-900/30"
                      )}>
                        <plan.icon className={cn(
                          "w-5 h-5",
                          plan.color === "violet" ? "text-violet-600" : "text-blue-600"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-zinc-500">{plan.description}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-zinc-500">{plan.period}</span>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Enter Name */}
          {step === "name" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl text-zinc-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-violet-500" />
                  Name Your Workspace
                </DialogTitle>
                <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                  {selectedPlan && (
                    <span className="inline-flex items-center gap-1">
                      Selected: <span className="text-violet-500 font-medium">
                        {PLANS.find(p => p.id === selectedPlan)?.name}
                      </span>
                      {PLANS.find(p => p.id === selectedPlan)?.trial && (
                        <span className="text-emerald-500">(14-day trial)</span>
                      )}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Workspace Name
                  </label>
                  <Input 
                    placeholder="e.g. Marketing Team, My Startup" 
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={handleBack}
                  className="text-zinc-600 dark:text-zinc-400"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button 
                  onClick={handleCreateWorkspace}
                  disabled={!workspaceName.trim() || isProcessing}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6"
                >
                  {isProcessing ? (
                    "Processing..."
                  ) : PLANS.find(p => p.id === selectedPlan)?.trial ? (
                    <>
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continue to Payment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
