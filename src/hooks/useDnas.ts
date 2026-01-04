import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useUserSettings } from "./useUserSettings";
import { extractDnaFromContent, evolveDna as evolveDnaApi, ExtractedDNA, ExtractionInput, DnaEvolutionResult, LearningHistoryEntry } from "@/lib/dna-extractor";

export interface DNAAnalysisData {
  audiencePsychology?: string;
  linguisticFingerprint?: {
    personaRole: string;
    toneAnalysis: string;
    signatureKeywords: string[];
  };
  hookAngle?: {
    angleCategory: string;
    deconstruction: string;
  };
  pacingAndTone?: {
    pacing: string;
  };
  structuralSkeleton?: {
    title: string;
    wordCount: number;
    timing?: string; // Optional legacy or reference
    wordRange?: string; // Optional legacy
    tone?: string;
    pacing?: string;
    contentFocus?: string;
    microHook?: string;
    openLoop?: string;
    viralTriggers?: string;
    mustInclude?: string[];
    audienceInteraction?: string;
    audienceValue?: string;
    transitionOut?: string;
  }[];
  targetWordCount?: number;
  highDopamine?: string[];
  confusionPoints?: string[];
  objections?: string[];
  corePatterns?: string[];
  viralXFactors?: string[];
  flopAvoidance?: string[];
}

export interface DNA {
  id: string;
  user_id: string;
  name: string;
  niche: string | null;
  source_url: string | null;
  source_transcript: string | null;
  hook_type: string | null;
  hook_examples: string[] | null;
  structure: string[] | null;
  pacing: string | null;
  retention_tactics: string[] | null;
  x_factors: string[] | null;
  tone: string | null;
  vocabulary: string | null;
  patterns: string[] | null;
  analysis_data: DNAAnalysisData | null;
  created_at: string;
  updated_at: string;
}

export function useDnas() {
  const [dnas, setDnas] = useState<DNA[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useUserSettings();

  const fetchDnas = useCallback(async () => {
    if (!user) {
      setDnas([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("dnas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Cast analysis_data from Json to DNAAnalysisData and handle vocabulary array->string
      const typedData = (data || []).map(d => ({
        ...d,
        vocabulary: Array.isArray(d.vocabulary) ? d.vocabulary.join(", ") : d.vocabulary,
        analysis_data: d.analysis_data as DNAAnalysisData | null
      }));
      setDnas(typedData);
    } catch (error) {
      console.error("Error fetching DNAs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch DNA patterns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDnas();
  }, [fetchDnas]);

  const extractDna = async (input: ExtractionInput, model?: string): Promise<ExtractedDNA | null> => {
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
      const selectedModel = model || "google/gemini-3-flash-preview";
      const result = await extractDnaFromContent(input, apiKey, selectedModel);
      return result;
    } catch (error) {
      console.error("Error extracting DNA:", error);
      const message = error instanceof Error ? error.message : "Failed to extract DNA patterns";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const scanDnaContent = async (input: ExtractionInput): Promise<import("@/lib/dna-extractor").ContentScanResult[] | null> => {
    const apiKey = settings?.openrouter_api_key;
    if (!apiKey) {
      toast({
        title: "Error",
        description: "OpenRouter API Key required. Please configure in Settings.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Always use Flash for Scanning
      const result = await import("@/lib/dna-extractor").then(m => m.scanContent(input, apiKey));
      return result;
    } catch (error) {
      console.error("Error scanning content:", error);
      toast({
        title: "Error",
        description: "Failed to scan content: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      return null;
    }
  };

  const createDna = async (dna: Partial<DNA>) => {
    if (!user) return null;

    try {
      const insertData = {
        name: dna.name || "New DNA",
        user_id: user.id,
        niche: dna.niche,
        source_url: dna.source_url,
        source_transcript: dna.source_transcript,
        hook_type: dna.hook_type,
        hook_examples: dna.hook_examples,
        structure: dna.structure,
        pacing: dna.pacing,
        retention_tactics: dna.retention_tactics,
        x_factors: dna.x_factors,
        tone: dna.tone,
        vocabulary: dna.vocabulary ? dna.vocabulary.split(",").map(s => s.trim()).filter(Boolean) : [],
        patterns: dna.patterns,
      };

      const { data, error } = await supabase
        .from("dnas")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      const typedData = {
        ...data,
        vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary.join(", ") : data.vocabulary,
        analysis_data: data.analysis_data as DNAAnalysisData | null
      };
      setDnas(prev => [typedData, ...prev]);
      toast({ title: "Success", description: "DNA pattern saved successfully" });
      return typedData;
    } catch (error) {
      console.error("Error creating DNA:", error);
      toast({
        title: "Error",
        description: "Failed to save DNA pattern",
        variant: "destructive",
      });
      return null;
    }
  };

  const createDnaFromExtracted = async (extractedDna: ExtractedDNA, sourceTranscript?: string, sourceUrl?: string) => {
    if (!user) return null;

    try {
      // Build analysis_data with all extended fields
      const analysisData: DNAAnalysisData = {
        audiencePsychology: extractedDna.audiencePsychology,
        linguisticFingerprint: extractedDna.linguisticFingerprint,
        hookAngle: extractedDna.hookAngle,
        pacingAndTone: extractedDna.pacingAndTone,
        structuralSkeleton: extractedDna.structuralSkeleton,
        targetWordCount: extractedDna.targetWordCount,
        highDopamine: extractedDna.highDopamine,
        confusionPoints: extractedDna.confusionPoints,
        objections: extractedDna.objections,
        corePatterns: extractedDna.corePatterns,
        viralXFactors: extractedDna.viralXFactors,
        flopAvoidance: extractedDna.flopAvoidance,
      };

      const insertData = {
        name: extractedDna.name,
        user_id: user.id,
        niche: extractedDna.niche,
        source_url: sourceUrl || null,
        source_transcript: sourceTranscript || null,
        hook_type: extractedDna.hook_type || extractedDna.hookAngle?.angleCategory,
        hook_examples: extractedDna.hook_examples || [],
        structure: extractedDna.structure || extractedDna.structuralSkeleton?.map(s => s.title),
        pacing: extractedDna.pacing || extractedDna.pacingAndTone?.pacing,
        retention_tactics: extractedDna.retention_tactics || extractedDna.highDopamine,
        x_factors: extractedDna.x_factors || extractedDna.viralXFactors,
        tone: extractedDna.tone || extractedDna.linguisticFingerprint?.toneAnalysis,
        vocabulary: extractedDna.vocabulary
          ? extractedDna.vocabulary.split(",").map(s => s.trim()).filter(Boolean)
          : extractedDna.linguisticFingerprint?.signatureKeywords || [],
        patterns: extractedDna.patterns || extractedDna.corePatterns,
        analysis_data: analysisData as unknown as import("@/integrations/supabase/types").Json,
      };

      const { data, error } = await supabase
        .from("dnas")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      const typedData = {
        ...data,
        vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary.join(", ") : data.vocabulary,
        analysis_data: data.analysis_data as DNAAnalysisData | null
      };
      setDnas(prev => [typedData, ...prev]);
      toast({ title: "Success", description: "DNA pattern saved successfully" });
      return typedData;
    } catch (error) {
      console.error("Error creating DNA:", error);
      toast({
        title: "Error",
        description: "Failed to save DNA pattern: " + error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateDna = async (id: string, updates: Partial<DNA>) => {
    try {
      // Convert analysis_data to Json type for Supabase
      const supabaseUpdates = {
        ...updates,
        vocabulary: updates.vocabulary ? updates.vocabulary.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        analysis_data: updates.analysis_data as unknown as import("@/integrations/supabase/types").Json | undefined,
      };

      const { data, error } = await supabase
        .from("dnas")
        .update(supabaseUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      const typedData = {
        ...data,
        vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary.join(", ") : data.vocabulary,
        analysis_data: data.analysis_data as DNAAnalysisData | null
      };
      setDnas(prev => prev.map(d => d.id === id ? typedData : d));
      toast({ title: "Success", description: "DNA pattern updated successfully" });
      return typedData;
    } catch (error) {
      console.error("Error updating DNA:", error);
      toast({
        title: "Error",
        description: "Failed to update DNA pattern",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteDna = async (id: string) => {
    try {
      const { error } = await supabase
        .from("dnas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setDnas(prev => prev.filter(d => d.id !== id));
      toast({ title: "Success", description: "DNA pattern deleted successfully" });
      return true;
    } catch (error) {
      console.error("Error deleting DNA:", error);
      toast({
        title: "Error",
        description: "Failed to delete DNA pattern: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      return false;
    }
  };

  // DNA Evolution - Learn from new content and refine DNA
  const evolveDna = async (
    dnaId: string,
    newContent: {
      viralVideos?: Array<{ transcript: string; url?: string }>;
      flopVideos?: Array<{ transcript: string; url?: string }>;
    }
  ): Promise<{ success: boolean; changesSummary?: string[] }> => {
    const apiKey = settings?.openrouter_api_key;
    if (!apiKey) {
      toast({
        title: "Error",
        description: "OpenRouter API Key chưa được cấu hình.",
        variant: "destructive",
      });
      return { success: false };
    }

    // Find the DNA to evolve
    const dna = dnas.find(d => d.id === dnaId);
    if (!dna || !dna.analysis_data) {
      toast({
        title: "Error",
        description: "DNA not found or has no analysis data.",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      const model = "google/gemini-3-flash-preview"; // TODO: Pass model from UI

      // Convert DNA to ExtractedDNA format for evolution
      const existingDna: ExtractedDNA = {
        name: dna.name,
        niche: dna.niche || "",
        targetWordCount: dna.analysis_data?.targetWordCount,
        audiencePsychology: dna.analysis_data?.audiencePsychology || "",
        linguisticFingerprint: dna.analysis_data?.linguisticFingerprint || { personaRole: "", toneAnalysis: "", signatureKeywords: [] },
        hookAngle: dna.analysis_data?.hookAngle || { angleCategory: "", deconstruction: "" },
        pacingAndTone: dna.analysis_data?.pacingAndTone || { pacing: "" },
        structuralSkeleton: dna.analysis_data?.structuralSkeleton || [],
        highDopamine: dna.analysis_data?.highDopamine || [],
        confusionPoints: dna.analysis_data?.confusionPoints || [],
        objections: dna.analysis_data?.objections || [],
        corePatterns: dna.analysis_data?.corePatterns || [],
        viralXFactors: dna.analysis_data?.viralXFactors || [],
        flopAvoidance: dna.analysis_data?.flopAvoidance || [],
        hook_examples: dna.hook_examples || [],
      };

      // Call the evolution API
      const result = await evolveDnaApi(existingDna, newContent, apiKey, model);

      // Create learning history entry
      const historyEntry: LearningHistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        input_type: newContent.viralVideos && newContent.flopVideos ? 'mixed'
          : newContent.viralVideos ? 'viral' : 'flop',
        source_urls: [
          ...(newContent.viralVideos?.map(v => v.url).filter(Boolean) as string[] || []),
          ...(newContent.flopVideos?.map(v => v.url).filter(Boolean) as string[] || [])
        ],
        transcript_preview: (
          newContent.viralVideos?.[0]?.transcript ||
          newContent.flopVideos?.[0]?.transcript ||
          ""
        ).substring(0, 200) + "...",
        changes_made: result.changesSummary
      };

      // Get existing learning history or create new
      const existingHistory = (dna as any).learning_history || [];
      const updatedHistory = [...existingHistory, historyEntry];

      // Update the DNA with evolved data
      const updateData = {
        analysis_data: {
          ...dna.analysis_data,
          targetWordCount: result.evolvedDna.targetWordCount,
          audiencePsychology: result.evolvedDna.audiencePsychology,
          linguisticFingerprint: result.evolvedDna.linguisticFingerprint,
          hookAngle: result.evolvedDna.hookAngle,
          pacingAndTone: result.evolvedDna.pacingAndTone,
          structuralSkeleton: result.evolvedDna.structuralSkeleton,
          highDopamine: result.evolvedDna.highDopamine,
          confusionPoints: result.evolvedDna.confusionPoints,
          objections: result.evolvedDna.objections,
          corePatterns: result.evolvedDna.corePatterns,
          viralXFactors: result.evolvedDna.viralXFactors,
          flopAvoidance: result.evolvedDna.flopAvoidance,
        },
        hook_examples: result.evolvedDna.hook_examples,
        learning_history: updatedHistory,
      };

      const { error } = await supabase
        .from("dnas")
        .update(updateData as any)
        .eq("id", dnaId);

      if (error) throw error;

      // Update local state
      setDnas(prev => prev.map(d => d.id === dnaId ? { ...d, ...updateData } : d));

      toast({
        title: "DNA Evolved!",
        description: `${result.changesSummary.length} changes made to your DNA.`
      });

      return { success: true, changesSummary: result.changesSummary };
    } catch (error) {
      console.error("Error evolving DNA:", error);
      toast({
        title: "Error",
        description: "Failed to evolve DNA: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
      return { success: false };
    }
  };

  return {
    dnas,
    loading,
    scanDnaContent,
    extractDna,
    createDna,
    createDnaFromExtracted,
    updateDna,
    deleteDna,
    evolveDna,
    refetch: fetchDnas,
  };
}
