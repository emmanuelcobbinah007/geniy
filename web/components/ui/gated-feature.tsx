"use client";

import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGatingContext } from "@/context/gating-context";
import { useUpgradeModal } from "@/components/ui/upgrade-modal";
import { Button } from "@/components/ui/button";

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

export function GatedFeature({
  children,
  feature,
  limit,
  fallback,
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

  return (
    <div className={cn("relative group", className)}>
      {/* Blurred content */}
      <div
        className="select-none pointer-events-none"
        style={{ filter: `blur(${blurAmount}px)` }}
      >
        {children}
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
}

export function GatedButton({
  children,
  feature,
  limit,
  onClick,
  className,
  disabled,
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
