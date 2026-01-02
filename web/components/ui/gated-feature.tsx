"use client";

import { ReactNode } from "react";
import { Lock, Sparkles, TrendingUp, Users, Zap, Target, BarChart3, MessageSquare, Shield, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGatingContext } from "@/context/gating-context";
import { useUpgradeModal } from "@/components/ui/upgrade-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FeatureType = 
  | "integrations" 
  | "aiInsights" 
  | "csvExport" 
  | "gapAnalysis" 
  | "strategyReports" 
  | "realTimeScans"
  | "customDomains";

type LimitType = 
  | "surveys" 
  | "competitors" 
  | "teamSeats" 
  | "responses";

interface GatedFeatureProps {
  children: ReactNode;
  
  /** Feature name to check access */
  feature?: FeatureType;
  
  /** Resource limit to check */
  limit?: LimitType;
  
  /** Custom fallback component instead of blur */
  fallback?: ReactNode;
  
  /** Custom placeholder behind blur (overrides default) */
  placeholder?: ReactNode;
  
  /** Blur intensity (0-20) */
  blurAmount?: number;
  
  /** Show lock overlay */
  showLock?: boolean;
  
  /** Additional className */
  className?: string;
}

const REQUIRED_TIERS: Record<FeatureType, string> = {
  integrations: "PRO",
  aiInsights: "STARTER",
  csvExport: "STARTER",
  gapAnalysis: "STARTER",
  strategyReports: "PRO",
  realTimeScans: "PRO",
  customDomains: "PRO",
};

const LIMIT_TIERS: Record<LimitType, string> = {
  surveys: "STARTER",
  competitors: "STARTER",
  teamSeats: "PRO",
  responses: "STARTER",
};

// FOMO Placeholder content for each feature
function getPlaceholderContent(feature?: FeatureType, limit?: LimitType): ReactNode {
  if (feature === "aiInsights") {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI-Powered Insights</h3>
            <p className="text-sm text-zinc-400">3 actionable recommendations</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { icon: TrendingUp, title: "Pricing Optimization", desc: "45% of users prefer a lower price point. Consider introducing a $19/mo tier." },
            { icon: Users, title: "Target Audience Shift", desc: "Your product resonates most with freelancers (62%) rather than agencies." },
            { icon: Zap, title: "Feature Priority", desc: "API integration is the #1 requested feature. Ship this to reduce churn by 23%." }
          ].map((item, i) => (
            <Card key={i} className="p-4 bg-zinc-800/50 border-zinc-700/50">
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <item.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (feature === "gapAnalysis" || feature === "strategyReports") {
    return (
      <div className="space-y-6 p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: "Untapped Market", desc: "Small agencies (10-50 employees) show 3x higher conversion intent", icon: Target, color: "rose" },
            { title: "Pricing Gap", desc: "Competitors charge 40% more for similar features", icon: TrendingUp, color: "emerald" },
            { title: "Feature Gap", desc: "No competitor offers AI-powered form generation", icon: Sparkles, color: "violet" },
          ].map((gap, i) => (
            <Card key={i} className={`p-5 bg-gradient-to-br from-${gap.color}-500/10 to-zinc-900 border-${gap.color}-500/30`}>
              <gap.icon className={`w-5 h-5 text-${gap.color}-400 mb-3`} />
              <h4 className="font-semibold text-white mb-2">{gap.title}</h4>
              <p className="text-sm text-zinc-400">{gap.desc}</p>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Strategic Objectives
            </h4>
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center">1</span> Capture the SMB market segment</li>
              <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center">2</span> Launch enterprise tier by Q2</li>
              <li className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center">3</span> Reduce churn by 25% through AI features</li>
            </ul>
          </Card>
          <Card className="p-5 bg-zinc-800/50 border-zinc-700/50">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Opportunity Score
            </h4>
            <div className="flex items-end gap-4">
              <div className="text-4xl font-bold text-emerald-400">87%</div>
              <p className="text-sm text-zinc-400 pb-1">High potential for market expansion based on competitor analysis</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (feature === "integrations") {
    return (
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {[
          { name: "Slack", desc: "Get instant notifications when survey responses come in", status: "Connected", icon: MessageSquare },
          { name: "Discord", desc: "Share insights with your team in real-time", status: "Available", icon: Users },
        ].map((integration, i) => (
          <Card key={i} className="p-5 bg-zinc-800/50 border-zinc-700/50">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <integration.icon className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{integration.name}</h4>
                  <p className="text-xs text-zinc-400">{integration.desc}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">{integration.status}</span>
            </div>
            <Button size="sm" variant="outline" className="w-full">Configure</Button>
          </Card>
        ))}
      </div>
    );
  }

  if (feature === "customDomains") {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Globe className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Custom Domains</h3>
            <p className="text-sm text-zinc-400">Brand your surveys with your own domain</p>
          </div>
        </div>
        <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-mono text-sm">surveys.yourcompany.com</span>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Verified ✓</span>
          </div>
        </Card>
        <Card className="p-4 bg-zinc-800/50 border-zinc-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-white font-mono text-sm">feedback.yourcompany.com</span>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">Pending...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (feature === "realTimeScans") {
    return (
      <div className="p-6 space-y-4">
        <Card className="p-5 bg-gradient-to-br from-violet-500/10 to-zinc-900 border-violet-500/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-violet-500/20">
              <Zap className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white mb-1">Deep Competitor Analysis</h4>
              <p className="text-sm text-zinc-400 mb-3">Real-time scanning reveals competitor strategies</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-300">Pricing Changes</span>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-300">New Features</span>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-300">Marketing Tactics</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Default placeholder
  return null;
}

export function GatedFeature({
  children,
  feature,
  limit,
  fallback,
  placeholder,
  blurAmount = 8,
  showLock = true,
  className,
}: GatedFeatureProps) {
  // Use context instead of making individual API calls
  const { hasFeature, canCreate, tier, isLoading } = useGatingContext();
  const upgradeModal = useUpgradeModal();

  // Check if feature is accessible
  const isAccessible = feature 
    ? hasFeature(feature) 
    : limit 
      ? canCreate(limit) 
      : true;

  // Determine required tier for upgrade modal
  const requiredTier = feature 
    ? REQUIRED_TIERS[feature] 
    : limit 
      ? LIMIT_TIERS[limit] 
      : "STARTER";

  const handleUpgradeClick = () => {
    upgradeModal.open({
      feature: feature || limit || "This feature",
      requiredTier,
      currentTier: tier,
    });
  };

  // If loading, show children with reduced opacity
  if (isLoading) {
    return (
      <div className={cn("opacity-50 pointer-events-none", className)}>
        {children}
      </div>
    );
  }

  // If accessible, just render children
  if (isAccessible) {
    return <>{children}</>;
  }

  // If not accessible, show gated view
  if (fallback) {
    return <>{fallback}</>;
  }

  // Get placeholder content (custom or default)
  const placeholderContent = placeholder || getPlaceholderContent(feature, limit) || children;

  return (
    <div className={cn("relative group", className)}>
      {/* Blurred content - use placeholder for FOMO effect */}
      <div
        className="select-none pointer-events-none"
        style={{ filter: `blur(${blurAmount}px)` }}
      >
        {placeholderContent}
      </div>

      {/* Lock overlay */}
      {showLock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/40 dark:bg-zinc-950/60 backdrop-blur-[2px] rounded-lg"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center text-center p-6 max-w-xs"
          >
            <div className="p-3 rounded-full bg-violet-500/20 mb-4">
              <Lock className="w-6 h-6 text-violet-400" />
            </div>
            
            <h4 className="text-sm font-semibold text-white mb-1">
              {requiredTier} Plan Required
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              Upgrade to unlock this feature
            </p>
            
            <Button
              size="sm"
              onClick={handleUpgradeClick}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Inline gated button - shows lock icon and triggers upgrade modal when clicked
 */
interface GatedButtonProps {
  children: ReactNode;
  feature?: FeatureType;
  limit?: LimitType;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function GatedButton({
  children,
  feature,
  limit,
  onClick,
  className,
  disabled,
  id,
}: GatedButtonProps) {
  const { hasFeature, canCreate, tier, isLoading } = useGatingContext();
  const upgradeModal = useUpgradeModal();

  const isAccessible = feature 
    ? hasFeature(feature) 
    : limit 
      ? canCreate(limit) 
      : true;

  const requiredTier = feature 
    ? REQUIRED_TIERS[feature] 
    : limit 
      ? LIMIT_TIERS[limit] 
      : "STARTER";

  const handleClick = () => {
    if (!isAccessible) {
      upgradeModal.open({
        feature: feature || limit || "This feature",
        requiredTier,
        currentTier: tier,
      });
      return;
    }
    onClick?.();
  };

  return (
    <Button
      id={id}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        !isAccessible && "relative",
        className
      )}
    >
      {!isAccessible && (
        <Lock className="w-4 h-4 mr-2 text-amber-400" />
      )}
      {children}
    </Button>
  );
}
