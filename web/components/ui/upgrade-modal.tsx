"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, ArrowRight, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useParams } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  requiredTier?: string;
  currentTier?: string;
}

const TIER_INFO: Record<string, {
  name: string;
  price: string;
  period: string;
  features: string[];
}> = {
  FREE: {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: ["1 survey", "25 responses", "1 competitor"]
  },
  STARTER: {
    name: "Starter",
    price: "$29",
    period: "/mo",
    features: ["Unlimited surveys", "3 competitors", "AI Insights", "CSV Export"]
  },
  PRO: {
    name: "Pro",
    price: "$79",
    period: "/mo",
    features: ["10 competitors", "5 team seats", "Slack/Discord", "Strategy Reports", "Real-time Scans"]
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: ["Unlimited everything", "White-label", "Custom AI", "SSO"]
  }
};

const FEATURE_NAMES: Record<string, string> = {
  integrations: "Slack & Discord",
  aiInsights: "AI Insights",
  csvExport: "CSV Export",
  gapAnalysis: "Gap Analysis",
  strategyReports: "Strategy Reports",
  realTimeScans: "Real-time Scans",
  surveys: "Unlimited Surveys",
  competitors: "More Competitors",
  teamSeats: "Team Seats",
  customDomains: "Custom Domains"
};

export function UpgradeModal({
  isOpen,
  onClose,
  feature = "This feature",
  requiredTier = "STARTER",
  currentTier = "FREE",
}: UpgradeModalProps) {
  const { token, user } = useAuth();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;
  const [isProcessing, setIsProcessing] = useState(false);
  
  const requiredInfo = TIER_INFO[requiredTier] || TIER_INFO.STARTER;
  const featureName = FEATURE_NAMES[feature] || feature;

  const handleUpgrade = async () => {
    if (!token || !user?.email) {
      toast.error("Please log in to upgrade");
      return;
    }

    setIsProcessing(true);

    try {
      // Store upgrade context for payment callback
      localStorage.setItem('pendingUpgrade', JSON.stringify({
        workspaceId,
        targetPlan: requiredTier,
        email: user.email,
      }));

      // Call subscribe endpoint for upgrade
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          planTier: requiredTier,
          email: user.email,
          hasTrial: false, // No trial for upgrades
          isUpgrade: true,
          workspaceId: workspaceId,
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Subscribe error response:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || "Failed to start upgrade process");
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
              {/* Violet glow effect at top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-30 bg-gradient-to-r from-violet-500 to-purple-500" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors z-10 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="relative p-6 pt-8">
                {/* Header with Gen illustration */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative mb-4">
                    <Image 
                      src="/gen_states/gen_thinking.png" 
                      alt="Gen" 
                      width={64} 
                      height={64}
                      className="drop-shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-zinc-950 border border-zinc-800">
                      <Lock className="w-3 h-3 text-zinc-400" />
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white text-center">
                    Unlock {featureName}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Available on <span className="font-medium text-violet-400">{requiredInfo.name}</span> plan
                  </p>
                </div>

                {/* Plan card */}
                <div className="relative p-4 rounded-xl border overflow-hidden mb-6 border-violet-500/30 bg-violet-500/10">
                  <div className="relative flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-bold text-white">{requiredInfo.name}</p>
                      <p className="text-2xl font-bold text-white">
                        {requiredInfo.price}
                        <span className="text-sm font-normal text-zinc-500">{requiredInfo.period}</span>
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Features list */}
                  <div className="relative grid grid-cols-2 gap-2">
                    {requiredInfo.features.slice(0, 4).map((feat, i) => (
                      <motion.div
                        key={feat}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="text-zinc-300">{feat}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className={cn(
                    "w-full h-11 font-medium text-base rounded-xl",
                    "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white",
                    "shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300",
                    "disabled:opacity-70 disabled:cursor-not-allowed"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>Upgrade to {requiredInfo.name}</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Skip */}
                <button 
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors mt-4 py-2 disabled:opacity-50"
                >
                  Not now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to easily trigger upgrade modal from anywhere
import { create } from 'zustand';

interface UpgradeModalStore {
  isOpen: boolean;
  feature: string;
  requiredTier: string;
  currentTier: string;
  open: (props: { feature?: string; requiredTier?: string; currentTier?: string }) => void;
  close: () => void;
}

export const useUpgradeModal = create<UpgradeModalStore>((set) => ({
  isOpen: false,
  feature: "",
  requiredTier: "STARTER",
  currentTier: "FREE",
  open: ({ feature = "", requiredTier = "STARTER", currentTier = "FREE" }) => 
    set({ isOpen: true, feature, requiredTier, currentTier }),
  close: () => set({ isOpen: false }),
}));
