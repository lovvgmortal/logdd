import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useUserSettings } from "./useUserSettings";
import { analyzePersona as analyzePersonaApi } from "@/lib/persona-analyzer";

export interface Persona {
  id: string;
  user_id: string;
  name: string;
  age_range: string | null;
  knowledge_level: string | null;
  pain_points: string[] | null;
  preferred_tone: string | null;
  vocabulary: string | null;
  platform: string | null;
  description: string | null;
  motivations: string[] | null;
  objections: string[] | null;
  content_sources: any[] | null; // JSONB array of { id, script, youtubeUrl, comments }
  created_at: string;
  updated_at: string;
}

export function usePersonas() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useUserSettings();

  const fetchPersonas = useCallback(async () => {
    if (!user) {
      setPersonas([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPersonas((data as unknown as Persona[]) || []);
    } catch (error) {
      console.error("Error fetching personas:", error);
      toast({
        title: "Error",
        description: "Failed to fetch personas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const createPersona = async (persona: Partial<Persona>) => {
    if (!user) return null;

    try {
      const insertData = {
        name: persona.name || "New Persona",
        user_id: user.id,
        age_range: persona.age_range,
        knowledge_level: persona.knowledge_level,
        pain_points: persona.pain_points,
        preferred_tone: persona.preferred_tone,
        vocabulary: persona.vocabulary,
        platform: persona.platform,
        description: persona.description,
        motivations: persona.motivations,
        objections: persona.objections,
        content_sources: persona.content_sources,
      };

      const { data, error } = await supabase
        .from("personas")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      setPersonas(prev => [(data as unknown as Persona), ...prev]);
      toast({ title: "Success", description: "Persona created successfully" });
      return data;
    } catch (error) {
      console.error("Error creating persona:", error);
      toast({
        title: "Error",
        description: "Failed to create persona",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePersona = async (id: string, updates: Partial<Persona>) => {
    try {
      const { data, error } = await supabase
        .from("personas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setPersonas(prev => prev.map(p => p.id === id ? (data as unknown as Persona) : p));
      toast({ title: "Success", description: "Persona updated successfully" });
      return data;
    } catch (error) {
      console.error("Error updating persona:", error);
      toast({
        title: "Error",
        description: "Failed to update persona",
        variant: "destructive",
      });
      return null;
    }
  };

  const deletePersona = async (id: string) => {
    try {
      const { error } = await supabase
        .from("personas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setPersonas(prev => prev.filter(p => p.id !== id));
      toast({ title: "Success", description: "Persona deleted successfully" });
      return true;
    } catch (error) {
      console.error("Error deleting persona:", error);
      toast({
        title: "Error",
        description: "Failed to delete persona",
        variant: "destructive",
      });
      return false;
    }
  };

  const analyzePersona = async (description?: string, transcript?: string, comments?: string, modelOverride?: string) => {
    const apiKey = settings?.openrouter_api_key;
    if (!apiKey) {
      toast({
        title: "Error",
        description: "OpenRouter API Key chưa được cấu hình. Vui lòng nhập key vào Settings.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const model = modelOverride || "google/gemini-3-flash-preview";
      const result = await analyzePersonaApi(apiKey, model, description, transcript, comments);
      return result;
    } catch (error) {
      console.error("Error analyzing persona:", error);
      const message = error instanceof Error ? error.message : "Failed to analyze persona";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    personas,
    loading,
    createPersona,
    updatePersona,
    deletePersona,
    analyzePersona,
    refetch: fetchPersonas,
  };
}
