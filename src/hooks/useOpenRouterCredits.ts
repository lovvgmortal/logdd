import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Scale factor for credit usage display (e.g. 1 real $ = 5 display $)
const USAGE_SCALE = 5;

export interface OpenRouterCredits {
  total_credits: number;
  total_usage: number;
}

export function useOpenRouterCredits() {
  const [credits, setCredits] = useState<OpenRouterCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Lấy API key từ user_settings
      const { data: settings, error: settingsError } = await supabase
        .from("user_settings")
        .select("openrouter_api_key")
        .eq("user_id", user.id)
        .single();

      if (settingsError || !settings?.openrouter_api_key) {
        setError("No API key configured");
        setCredits(null);
        setLoading(false);
        return;
      }

      // Gọi API /auth/key để lấy usage của chính key này
      const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${settings.openrouter_api_key}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch key info from OpenRouter");
      }

      const data = await response.json();
      setCredits({
        total_credits: (data.data?.limit || 0) * USAGE_SCALE, // Limit của key (often null/0 if no limit)
        total_usage: (data.data?.usage || 0) * USAGE_SCALE,   // Usage của riêng key này
      });
    } catch (err) {
      console.error("Error fetching OpenRouter credits:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch credits");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const remaining = credits ? credits.total_credits - credits.total_usage : null;

  return {
    credits,
    remaining,
    loading,
    error,
    refetch: fetchCredits,
  };
}
