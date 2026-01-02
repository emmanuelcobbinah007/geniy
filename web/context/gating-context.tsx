"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";

interface GatingInfo {
  tier: string;
  limits: {
    surveys: { current: number; limit: number | null };
    responses: { current: number; limit: number | null };
    competitors: { current: number; limit: number | null };
    teamSeats: { current: number; limit: number | null };
  };
  features: {
    aiInsights: boolean;
    csvExport: boolean;
    gapAnalysis: boolean | string;
    strategyReports: boolean;
    realTimeScans: boolean;
    integrations: boolean;
    customDomains: boolean;
  };
}

interface GatingContextValue {
  tier: string;
  isLoading: boolean;
  isPaid: boolean;
  
  // Feature access
  hasFeature: (feature: keyof GatingInfo["features"]) => boolean;
  
  // Limit checks
  canCreate: (resource: keyof GatingInfo["limits"]) => boolean;
  getRemaining: (resource: keyof GatingInfo["limits"]) => number | null;
  getLimitInfo: (resource: keyof GatingInfo["limits"]) => { current: number; limit: number | null };
  
  // Tier checks
  isAtLeastTier: (requiredTier: string) => boolean;
  
  // Raw data
  gatingData: GatingInfo | null;
}

const TIER_ORDER = ["FREE", "STARTER", "PRO", "ENTERPRISE"];

const GatingContext = createContext<GatingContextValue | null>(null);

interface GatingProviderProps {
  children: ReactNode;
  workspaceId: string;
}

export function GatingProvider({ children, workspaceId }: GatingProviderProps) {
  const { token } = useAuth();

  const { data: gatingData, isLoading } = useQuery<GatingInfo>({
    queryKey: ["gating", workspaceId],
    queryFn: async () => {
      if (!token || !workspaceId) return null;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/gating`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch gating info");
      }
      
      return response.json();
    },
    enabled: !!token && !!workspaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes - gating rarely changes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const value = useMemo<GatingContextValue>(() => {
    const tier = gatingData?.tier || "FREE";
    
    return {
      tier,
      isLoading,
      isPaid: tier !== "FREE",
      gatingData: gatingData || null,

      hasFeature: (feature) => {
        if (!gatingData) return false;
        const access = gatingData.features[feature];
        return access === true || access === "full" || access === "basic";
      },

      canCreate: (resource) => {
        if (!gatingData) return false; // Block until data loads
        const info = gatingData.limits[resource];
        if (!info) return false; // Unknown resource = blocked
        if (info.limit === null) return true; // Unlimited
        return info.current < info.limit;
      },

      getRemaining: (resource) => {
        if (!gatingData) return null;
        const info = gatingData.limits[resource];
        if (info.limit === null) return null; // Unlimited
        return Math.max(0, info.limit - info.current);
      },

      getLimitInfo: (resource) => {
        if (!gatingData) return { current: 0, limit: null };
        return gatingData.limits[resource];
      },

      isAtLeastTier: (requiredTier) => {
        const currentIndex = TIER_ORDER.indexOf(tier);
        const requiredIndex = TIER_ORDER.indexOf(requiredTier);
        return currentIndex >= requiredIndex;
      },
    };
  }, [gatingData, isLoading]);

  return (
    <GatingContext.Provider value={value}>
      {children}
    </GatingContext.Provider>
  );
}

/**
 * Hook to access gating information within a GatingProvider
 */
export function useGatingContext(): GatingContextValue {
  const context = useContext(GatingContext);
  
  if (!context) {
    // Return a default value if used outside provider (for safety)
    return {
      tier: "FREE",
      isLoading: true,
      isPaid: false,
      hasFeature: () => false,
      canCreate: () => false,
      getRemaining: () => null,
      getLimitInfo: () => ({ current: 0, limit: null }),
      isAtLeastTier: () => false,
      gatingData: null,
    };
  }
  
  return context;
}
