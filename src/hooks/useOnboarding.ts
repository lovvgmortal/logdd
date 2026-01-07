import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useOnboarding() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        // Check localStorage for onboarding completion
        const onboardingKey = `onboarding_completed_${user.id}`;
        const hasCompleted = localStorage.getItem(onboardingKey);
        
        if (!hasCompleted) {
          // Show onboarding for new users (created in last 5 minutes)
          const createdAt = new Date(profile.created_at);
          const now = new Date();
          const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          
          if (diffMinutes < 5) {
            setShowOnboarding(true);
          }
        }
      }
      setLoading(false);
    };

    checkOnboarding();
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, "true");
    }
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const resetOnboarding = () => {
    if (user) {
      localStorage.removeItem(`onboarding_completed_${user.id}`);
      setShowOnboarding(true);
    }
  };

  return {
    showOnboarding,
    loading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}
