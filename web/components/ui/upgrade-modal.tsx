"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, 
  Lock, 
  Sparkles, 
  X, 
  Check, 
  Zap, 
  ArrowRight,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  requiredTier?: string;
  currentTier?: string;
  workspaceId?: string;
}

const TIER_INFO: Record<string, {
  name: string;
  price: string;
  period: string;
  color: string;
  icon: any;
  features: string[];
}> = {
  FREE: {
    name: "Free",
    price: "$0",
    period: "/mo",
    color: "zinc",
    icon: Lock,
    features: ["1 survey", "25 responses", "1 competitor"]
  },
  STARTER: {
    name: "Starter",
    price: "$29",
    period: "/mo",
    color: "blue",
    icon: Zap,
    features: ["Unlimited surveys", "3 competitors", "AI Insights", "CSV Export"]
  },
  PRO: {
    name: "Pro",
    price: "$79",
    period: "/mo",
    color: "violet",
    icon: Sparkles,
    features: ["10 competitors", "5 team seats", "Slack/Discord", "Strategy Reports"]
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: "Custom",
    period: "",
    color: "amber",
    icon: Building2,
    features: ["Unlimited everything", "White-label", "Custom AI", "SSO"]
  }
};

const FEATURE_NAMES: Record<string, string> = {
  integrations: "Slack & Discord Integrations",
  aiInsights: "AI-Powered Insights",
  csvExport: "CSV Export",
  gapAnalysis: "Gap Analysis",
  strategyReports: "Strategy Reports",
  realTimeScans: "Real-time Competitor Scans",
  surveys: "Unlimited Surveys",
  competitors: "More Competitors",
  teamSeats: "Team Collaboration"
};

export function UpgradeModal({
  isOpen,
  onClose,
  feature = "This feature",
  requiredTier = "STARTER",
  currentTier = "FREE",
  workspaceId
}: UpgradeModalProps) {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);
  
  const requiredInfo = TIER_INFO[requiredTier] || TIER_INFO.STARTER;
  const currentInfo = TIER_INFO[currentTier] || TIER_INFO.FREE;
  const featureName = FEATURE_NAMES[feature] || feature;

  const handleUpgrade = () => {
    onClose();
    router.push(`/#pricing`);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 shadow-2xl">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-purple-600/10 pointer-events-none" />
              
              {/* Decorative blobs */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="relative p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 mb-4"
                  >
                    <Crown className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Upgrade to Unlock
                  </h2>
                  <p className="text-zinc-400">
                    <span className="text-violet-400 font-medium">{featureName}</span> requires {requiredInfo.name} plan
                  </p>
                </div>

                {/* Tier comparison */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {/* Current tier */}
                  <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-zinc-700">
                        <currentInfo.icon className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-sm font-medium text-zinc-400">Current</span>
                    </div>
                    <p className="text-xl font-bold text-white">{currentInfo.name}</p>
                    <p className="text-sm text-zinc-500">{currentInfo.price}{currentInfo.period}</p>
                  </div>
                  
                  {/* Required tier */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-full bg-violet-500 text-[10px] font-bold text-white uppercase">
                        Upgrade
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-violet-500/30">
                        <requiredInfo.icon className="w-4 h-4 text-violet-400" />
                      </div>
                      <span className="text-sm font-medium text-violet-300">Required</span>
                    </div>
                    <p className="text-xl font-bold text-white">{requiredInfo.name}</p>
                    <p className="text-sm text-violet-300">{requiredInfo.price}{requiredInfo.period}</p>
                  </div>
                </div>

                {/* Features you'll unlock */}
                <div className="mb-8">
                  <p className="text-sm font-medium text-zinc-400 mb-3">
                    What you'll unlock:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {requiredInfo.features.map((feat, i) => (
                      <motion.div
                        key={feat}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-zinc-300">{feat}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <motion.div
                  onHoverStart={() => setIsHovering(true)}
                  onHoverEnd={() => setIsHovering(false)}
                >
                  <Button
                    onClick={handleUpgrade}
                    className={cn(
                      "w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500",
                      "text-white font-semibold text-base rounded-xl",
                      "shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40",
                      "transition-all duration-300"
                    )}
                  >
                    <Sparkles className={cn(
                      "w-5 h-5 mr-2 transition-transform duration-300",
                      isHovering && "rotate-12 scale-110"
                    )} />
                    Upgrade to {requiredInfo.name}
                    <ArrowRight className={cn(
                      "w-5 h-5 ml-2 transition-transform duration-300",
                      isHovering && "translate-x-1"
                    )} />
                  </Button>
                </motion.div>

                {/* Skip link */}
                <p className="text-center text-xs text-zinc-500 mt-4">
                  <button onClick={onClose} className="hover:text-zinc-300 transition-colors">
                    Maybe later
                  </button>
                </p>
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
