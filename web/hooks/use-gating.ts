"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";

interface GatingInfo {
  tier: string;
  limits: {
    surveys: { limit: number; current: number };
    responses: { limit: number; current: number };
    competitors: { limit: number; current: number };
    teamSeats: { limit: number; current: number };
  };
  features: {
    integrations: boolean;
    aiInsights: boolean;
    csvExport: boolean;
    gapAnalysis: boolean | 'basic' | 'full';
    strategyReports: boolean;
    geniyChat: boolean;
    realTimeScans: boolean;
  };
}

/**
 * Hook to fetch and manage gating info for a workspace
 */
export function useGating(workspaceId: string | undefined) {
  const { token } = useAuth();

  const { data: gating, isLoading, error, refetch } = useQuery<GatingInfo>({
    queryKey: ['gating', workspaceId],
    queryFn: async () => {
      if (!workspaceId || !token) return null;
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/workspaces/${workspaceId}/gating`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!res.ok) {
        throw new Error('Failed to fetch gating info');
      }
      
      return res.json();
    },
    enabled: !!workspaceId && !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  /**
   * Check if user can create a new resource (hasn't hit limit)
   */
  const canCreate = (resource: 'surveys' | 'responses' | 'competitors' | 'teamSeats'): boolean => {
    if (!gating?.limits[resource]) return true;
    const { limit, current } = gating.limits[resource];
    if (limit === Infinity || limit === null) return true;
    return current < limit;
  };

  /**
   * Check if a feature is available
   */
  const hasFeature = (feature: keyof GatingInfo['features']): boolean | string => {
    if (!gating?.features) return false;
    return gating.features[feature] || false;
  };

  /**
   * Get remaining count for a resource
   */
  const getRemaining = (resource: 'surveys' | 'responses' | 'competitors' | 'teamSeats'): number => {
    if (!gating?.limits[resource]) return Infinity;
    const { limit, current } = gating.limits[resource];
    if (limit === Infinity || limit === null) return Infinity;
    return Math.max(0, limit - current);
  };

  /**
   * Get limit info for a resource (for UI display)
   */
  const getLimitInfo = (resource: 'surveys' | 'responses' | 'competitors' | 'teamSeats') => {
    if (!gating?.limits[resource]) return null;
    return gating.limits[resource];
  };

  /**
   * Check if user is on a paid plan
   */
  const isPaid = (): boolean => {
    return gating?.tier !== 'FREE';
  };

  /**
   * Check if user is at least on a specific tier
   */
  const isAtLeastTier = (requiredTier: string): boolean => {
    const tierOrder = ['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'];
    const currentIndex = tierOrder.indexOf(gating?.tier || 'FREE');
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return currentIndex >= requiredIndex;
  };

  return {
    gating,
    isLoading,
    error,
    refetch,
    tier: gating?.tier || 'FREE',
    canCreate,
    hasFeature,
    getRemaining,
    getLimitInfo,
    isPaid,
    isAtLeastTier,
  };
}
