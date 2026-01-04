import { useState } from "react";
import { useToast } from "./use-toast";
import { useUserSettings } from "./useUserSettings";
import { callOpenRouter, ChatMessage } from "@/lib/openrouter";

export type { ChatMessage };

export function useOpenRouter() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { settings } = useUserSettings();

  const chat = async (
    messages: ChatMessage[],
    model?: string
  ): Promise<string | null> => {
    const apiKey = settings?.openrouter_api_key;
    if (!apiKey) {
      toast({
        title: "Error",
        description: "OpenRouter API Key not configured. Please enter your key in Settings.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      const selectedModel = model || "google/gemini-3-flash-preview";
      const content = await callOpenRouter(messages, apiKey, selectedModel);
      return content;
    } catch (error) {
      console.error("Error calling OpenRouter:", error);
      const message = error instanceof Error ? error.message : "Could not connect to AI";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    chat,
    loading,
    apiKey: settings?.openrouter_api_key,
    preferredModel: settings?.preferred_model,
  };
}