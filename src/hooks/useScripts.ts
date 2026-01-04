import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useUserSettings } from "./useUserSettings";
import {
  generateScript as generateScriptApi,
  generateOutline as generateOutlineApi,
  generateScriptFromOutline as generateScriptFromOutlineApi,
  generateScriptSectionBySection as generateScriptSectionBySectionApi,
  scoreScript as scoreScriptApi,
  suggestUniqueAngle as suggestUniqueAngleApi,
  rewriteSection as rewriteSectionApi,
  generateSEO as generateSEOApi,
  ScoreResult,
  GeneratedOutline,
  GenerateScriptParams as ScriptParams,
  SectionProgressCallback,
  SuggestedAngle,
  SEOResult
} from "@/lib/script-generator";
import type { Persona } from "./usePersonas";
import type { DNA } from "./useDnas";
import type { Json } from "@/integrations/supabase/types";

export interface VersionEntry {
  id?: string;
  name?: string;
  content: string;
  timestamp: string;
  wordCount?: number;
  script?: string;
  outlineVersionId?: string;
  score?: ScoreResult;
}

export interface Script {
  id: string;
  user_id: string;
  title: string;
  topic: string | null;
  key_points: string | null;
  unique_angle: string | null;
  generation_mode: string | null;
  persona_id: string | null;
  dna_id: string | null;
  blueprint_id: string | null;
  blueprint_content: Json | null;
  full_script: string | null;
  score: number | null;
  score_breakdown: Json | null;
  status: string | null;
  outline_history: VersionEntry[] | null;
  script_history: VersionEntry[] | null;
  created_at: string;
  updated_at: string;
}

interface GenerateScriptParams {
  topic: string;
  keyPoints?: string;
  uniqueAngle?: string;
  mode: "dna" | "persona" | "hybrid";
  persona?: Persona | null;
  dna?: DNA | null;
  blueprint?: { title: string; sections: Json; estimated_length?: string } | null;
  customPrompt?: string;
  model?: string; // Optional override for AI model
  language?: string;
  targetWordCount?: number;
  allowStructureInnovation?: boolean;
}

export function useScripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useUserSettings();

  const fetchScripts = useCallback(async () => {
    if (!user) {
      setScripts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("scripts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Cast JSON fields to proper types
      const typedData = (data || []).map(script => ({
        ...script,
        outline_history: (script.outline_history as unknown as VersionEntry[]) || [],
        script_history: (script.script_history as unknown as VersionEntry[]) || [],
      })) as Script[];
      setScripts(typedData);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch scripts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  // Step 2: Generate outline from inputs
  const generateOutline = async (params: GenerateScriptParams): Promise<GeneratedOutline | null> => {
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
      // Use provided model or fallback
      const model = params.model || "google/gemini-3-flash-preview";
      const outline = await generateOutlineApi(params, apiKey, model);
      return outline;
    } catch (error) {
      console.error("Error generating outline:", error);
      const message = error instanceof Error ? error.message : "Failed to generate outline";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Step 3: Generate full script from outline
  const generateScriptFromOutline = async (outline: GeneratedOutline, params: GenerateScriptParams): Promise<string | null> => {
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
      // Use provided model or fallback
      const model = params.model || "google/gemini-3-flash-preview";
      const script = await generateScriptFromOutlineApi(outline, params, apiKey, model);
      return script;
    } catch (error) {
      console.error("Error generating script from outline:", error);
      const message = error instanceof Error ? error.message : "Failed to generate script";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  // NEW: Section-by-Section script generation with coherence
  const generateScriptSectionBySection = async (
    outline: GeneratedOutline,
    params: GenerateScriptParams,
    onProgress?: SectionProgressCallback
  ): Promise<string | null> => {
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
      const model = params.model || "google/gemini-3-flash-preview";
      const script = await generateScriptSectionBySectionApi(outline, params, apiKey, model, onProgress);
      return script;
    } catch (error) {
      console.error("Error generating script section by section:", error);
      const message = error instanceof Error ? error.message : "Failed to generate script";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Legacy: Direct script generation
  const generateScript = async (params: GenerateScriptParams) => {
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
      const model = "google/gemini-3-flash-preview"; // TODO: Pass model from UI
      const script = await generateScriptApi(params, apiKey, model);
      return script;
    } catch (error) {
      console.error("Error generating script:", error);
      const message = error instanceof Error ? error.message : "Failed to generate script";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const scoreScript = async (script: string, dna?: DNA | null, persona?: Persona | null): Promise<ScoreResult | null> => {
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
      const model = "google/gemini-3-flash-preview"; // TODO: Pass model from UI
      const result = await scoreScriptApi(script, apiKey, model, dna, persona);
      return result;
    } catch (error) {
      console.error("Error scoring script:", error);
      const message = error instanceof Error ? error.message : "Failed to score script";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const createScript = async (script: Partial<Script>) => {
    if (!user) return null;

    try {
      const insertData = {
        title: script.title || "New Script",
        user_id: user.id,
        topic: script.topic,
        key_points: script.key_points,
        unique_angle: script.unique_angle,
        generation_mode: script.generation_mode,
        persona_id: script.persona_id,
        dna_id: script.dna_id,
        blueprint_id: script.blueprint_id,
        blueprint_content: script.blueprint_content,
        full_script: script.full_script,
        score: script.score,
        score_breakdown: script.score_breakdown,
        status: script.status,
      };

      const { data, error } = await supabase
        .from("scripts")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      const typedData = {
        ...data,
        outline_history: (data.outline_history as unknown as VersionEntry[]) || [],
        script_history: (data.script_history as unknown as VersionEntry[]) || [],
      } as Script;
      setScripts(prev => [typedData, ...prev]);
      toast({ title: "Success", description: "Script saved successfully" });
      return typedData;
    } catch (error) {
      console.error("Error creating script:", error);
      toast({
        title: "Error",
        description: "Failed to save script",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateScript = async (id: string, updates: Partial<Script>) => {
    try {
      // Convert VersionEntry arrays to JSON for Supabase
      const dbUpdates = {
        ...updates,
        outline_history: updates.outline_history ? updates.outline_history as unknown as Json : undefined,
        script_history: updates.script_history ? updates.script_history as unknown as Json : undefined,
      };

      const { data, error } = await supabase
        .from("scripts")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      const typedData = {
        ...data,
        outline_history: (data.outline_history as unknown as VersionEntry[]) || [],
        script_history: (data.script_history as unknown as VersionEntry[]) || [],
      } as Script;
      setScripts(prev => prev.map(s => s.id === id ? typedData : s));
      toast({ title: "Success", description: "Script updated successfully" });
      return typedData;
    } catch (error) {
      console.error("Error updating script:", error);
      toast({
        title: "Error",
        description: "Failed to update script",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteScript = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scripts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setScripts(prev => prev.filter(s => s.id !== id));
      toast({ title: "Success", description: "Script deleted successfully" });
      return true;
    } catch (error) {
      console.error("Error deleting script:", error);
      toast({
        title: "Error",
        description: "Failed to delete script",
        variant: "destructive",
      });
      return false;
    }
  };
  // AI Assistant: Suggest unique angles
  const suggestUniqueAngle = async (
    topic: string,
    dna: DNA | null,
    persona: Persona | null,
    model: string
  ): Promise<SuggestedAngle[]> => {
    const apiKey = settings?.openrouter_api_key;
    if (!apiKey) {
      toast({
        title: "Error",
        description: "API Key not configured.",
        variant: "destructive",
      });
      return [];
    }

    try {
      return await suggestUniqueAngleApi(topic, dna, persona, apiKey, model);
    } catch (error) {
      console.error("Error suggesting angles:", error);
      toast({
        title: "Error",
        description: "Failed to suggest angles",
        variant: "destructive",
      });
      return [];
    }
  };

  // AI Assistant: Rewrite section
  const rewriteSection = async (
    sectionTitle: string,
    currentContent: string,
    userInstructions: string,
    context: {
      previousSections?: string[];
      dna?: DNA | null;
      persona?: Persona | null;
      targetWordCount?: number;
    },
    model: string
  ): Promise<string | null> => {
    const apiKey = settings?.openrouter_api_key;
    if (!apiKey) {
      toast({
        title: "Error",
        description: "API Key not configured.",
        variant: "destructive",
      });
      return null;
    }

    try {
      return await rewriteSectionApi(
        sectionTitle,
        currentContent,
        userInstructions,
        context,
        apiKey,
        model
      );
    } catch (error) {
      console.error("Error rewriting section:", error);
      toast({
        title: "Error",
        description: "Failed to rewrite section",
        variant: "destructive",
      });
      return null;
    }
  };

  // AI Assistant: Generate SEO
  const generateSEO = async (
    script: string,
    dna: DNA | null,
    persona: Persona | null,
    model: string
  ): Promise<SEOResult | null> => {
    const apiKey = settings?.openrouter_api_key;
    if (!apiKey) {
      toast({
        title: "Error",
        description: "API Key not configured.",
        variant: "destructive",
      });
      return null;
    }

    try {
      return await generateSEOApi(script, dna, persona, apiKey, model);
    } catch (error) {
      console.error("Error generating SEO:", error);
      toast({
        title: "Error",
        description: "Failed to generate SEO",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    scripts,
    loading,
    generateOutline,
    generateScriptFromOutline,
    generateScriptSectionBySection,
    generateScript,
    scoreScript,
    createScript,
    updateScript,
    deleteScript,
    refetch: fetchScripts,
    // AI Assistant functions
    suggestUniqueAngle,
    rewriteSection,
    generateSEO,
  };
}
