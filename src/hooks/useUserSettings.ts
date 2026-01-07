import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface UserSettings {
  id: string;
  user_id: string;
  openrouter_api_key: string | null;
  youtube_api_key: string | null;
  preferred_model: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return null;

    try {
      if (settings) {
        // Update existing settings
        const { data, error } = await supabase
          .from("user_settings")
          .update(updates)
          .eq("id", settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
        toast({ title: "Success", description: "Settings saved successfully" });
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from("user_settings")
          .insert({ ...updates, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
        toast({ title: "Success", description: "Settings saved successfully" });
        return data;
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    settings,
    loading,
    saveSettings,
    refetch: fetchSettings,
  };
}
