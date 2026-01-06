import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// ============================================================================
// SUBSCRIPTION TIERS - Types and Constants
// ============================================================================

export type SubscriptionTier = "starter" | "pro" | "ultra";

export type FeatureName =
    | "dna_evolution"
    | "ai_suggest_angle"
    | "batch_dna"
    | "structure_innovation"
    | "flop_analysis"
    | "tubeclone";

// Feature access matrix - defines which tiers can access which features
const FEATURE_ACCESS: Record<FeatureName, SubscriptionTier[]> = {
    dna_evolution: ["pro", "ultra"],
    ai_suggest_angle: ["pro", "ultra"],
    batch_dna: ["pro", "ultra"],
    structure_innovation: ["pro", "ultra"],
    flop_analysis: ["pro", "ultra"],
    tubeclone: ["ultra"],
};

// Tier hierarchy for comparison
const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
    starter: 0,
    pro: 1,
    ultra: 2,
};

export interface SubscriptionState {
    tier: SubscriptionTier;
    startedAt: Date | null;
    expiresAt: Date | null;
    isExpired: boolean;
    loading: boolean;
}

// ============================================================================
// HOOK: useSubscription
// ============================================================================

export function useSubscription() {
    const { user } = useAuth();
    const [state, setState] = useState<SubscriptionState>({
        tier: "starter",
        startedAt: null,
        expiresAt: null,
        isExpired: false,
        loading: true,
    });

    // Fetch subscription data from profiles table
    const fetchSubscription = useCallback(async () => {
        if (!user) {
            setState(prev => ({ ...prev, tier: "starter", loading: false }));
            return;
        }

        try {
            // Note: subscription_tier columns need to be added via SQL migration
            // Using type assertion until Supabase types are regenerated
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Error fetching subscription:", error);
                setState(prev => ({ ...prev, tier: "starter", loading: false }));
                return;
            }

            // Cast to access subscription fields (may not exist until migration is run)
            const profileData = data as any;
            const subscriptionTier = profileData?.subscription_tier as SubscriptionTier | undefined;
            const subscriptionStartedAt = profileData?.subscription_started_at as string | null;
            const subscriptionExpiresAt = profileData?.subscription_expires_at as string | null;

            const expiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
            const isExpired = expiresAt ? expiresAt < new Date() : false;

            setState({
                tier: isExpired ? "starter" : subscriptionTier || "starter",
                startedAt: subscriptionStartedAt ? new Date(subscriptionStartedAt) : null,
                expiresAt,
                isExpired,
                loading: false,
            });
        } catch (err) {
            console.error("Error in fetchSubscription:", err);
            setState(prev => ({ ...prev, tier: "starter", loading: false }));
        }
    }, [user]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    // Check if user can access a specific feature
    const canAccessFeature = useCallback(
        (feature: FeatureName): boolean => {
            const allowedTiers = FEATURE_ACCESS[feature];
            return allowedTiers.includes(state.tier);
        },
        [state.tier]
    );

    // Check if user's tier is at least the specified tier
    const hasMinimumTier = useCallback(
        (minimumTier: SubscriptionTier): boolean => {
            return TIER_HIERARCHY[state.tier] >= TIER_HIERARCHY[minimumTier];
        },
        [state.tier]
    );

    // Check if user is on Pro or above
    const isPro = useMemo(() => hasMinimumTier("pro"), [hasMinimumTier]);

    // Check if user is on Ultra
    const isUltra = useMemo(() => state.tier === "ultra", [state.tier]);

    // Get required tier for a feature
    const getRequiredTier = useCallback((feature: FeatureName): SubscriptionTier => {
        const allowedTiers = FEATURE_ACCESS[feature];
        // Return the minimum tier that can access this feature
        return allowedTiers.reduce((min, tier) =>
            TIER_HIERARCHY[tier] < TIER_HIERARCHY[min] ? tier : min
        );
    }, []);

    return {
        ...state,
        canAccessFeature,
        hasMinimumTier,
        isPro,
        isUltra,
        getRequiredTier,
        refetch: fetchSubscription,
    };
}
