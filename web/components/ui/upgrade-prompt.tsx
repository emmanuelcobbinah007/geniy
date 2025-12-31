"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Crown, Lock, Sparkles, ArrowRight } from "lucide-react";

interface UpgradePromptProps {
  /**
   * Type of limit that was reached
   */
  limitType: 'surveys' | 'responses' | 'competitors' | 'teamSeats' | 'feature';
  
  /**
   * Current count (for limit types)
   */
  current?: number;
  
  /**
   * Limit that was reached
   */
  limit?: number;
  
  /**
   * Current tier
   */
  currentTier?: string;
  
  /**
   * Feature name (for feature gates)
   */
  featureName?: string;
  
  /**
   * Custom title
   */
  title?: string;
  
  /**
   * Custom description
   */
  description?: string;
  
  /**
   * Variant for styling
   */
  variant?: 'inline' | 'card' | 'modal';
  
  /**
   * Callback after upgrade button click
   */
  onUpgradeClick?: () => void;
}

const LIMIT_MESSAGES: Record<string, { title: string; description: string }> = {
  surveys: {
    title: "Survey Limit Reached",
    description: "Upgrade to create unlimited surveys and unlock more features."
  },
  responses: {
    title: "Response Limit Reached", 
    description: "You've collected the maximum responses on your plan. Upgrade to continue gathering insights."
  },
  competitors: {
    title: "Competitor Limit Reached",
    description: "Track more competitors and get deeper competitive intelligence with an upgrade."
  },
  teamSeats: {
    title: "Team Seat Limit Reached",
    description: "Invite more team members to collaborate. Upgrade to add more seats."
  },
  feature: {
    title: "Premium Feature",
    description: "This feature is available on higher plans. Upgrade to unlock it."
  }
};

const FEATURE_NAMES: Record<string, string> = {
  integrations: "Slack & Discord Integrations",
  aiInsights: "AI-Powered Insights",
  csvExport: "CSV Export",
  gapAnalysis: "Gap Analysis",
  strategyReports: "Strategy Reports",
  realTimeScans: "Real-time Competitor Scans"
};

export function UpgradePrompt({
  limitType,
  current,
  limit,
  currentTier = 'FREE',
  featureName,
  title,
  description,
  variant = 'card',
  onUpgradeClick
}: UpgradePromptProps) {
  const router = useRouter();
  
  const defaultMessage = LIMIT_MESSAGES[limitType] || LIMIT_MESSAGES.feature;
  const displayTitle = title || (featureName ? `Unlock ${FEATURE_NAMES[featureName] || featureName}` : defaultMessage.title);
  const displayDescription = description || defaultMessage.description;
  
  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    }
    router.push('/#pricing');
  };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
        <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {displayTitle}
            {limit !== undefined && current !== undefined && (
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                ({current}/{limit})
              </span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
        >
          Upgrade
        </Button>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className="relative overflow-hidden rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 p-6">
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-200 dark:bg-violet-800/30 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-purple-200 dark:bg-purple-800/30 rounded-full blur-2xl opacity-50" />
      
      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/50">
            <Crown className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {displayTitle}
            </h3>
            
            {limit !== undefined && current !== undefined && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-2 bg-violet-200 dark:bg-violet-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-600 dark:bg-violet-400 rounded-full transition-all"
                    style={{ width: `${Math.min((current / limit) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  {current}/{limit}
                </span>
              </div>
            )}
            
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {displayDescription}
            </p>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={handleUpgrade}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Plan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              {currentTier && (
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  Current: {currentTier}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to handle gated API responses
 * Returns true if the response was a gating error (handled)
 */
export function handleGatedResponse(response: any): boolean {
  if (response?.gated) {
    // The response indicates a gating error
    // The component should show an upgrade prompt
    return true;
  }
  return false;
}
