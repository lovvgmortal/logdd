// Shared types for DNA Lab components
import type { DNA } from "@/hooks/useDnas";
import type { ExtractedDNA, ContentScanResult } from "@/lib/dna-extractor";

export interface VideoVariant {
    id: string;
    title: string;
    url: string;
    transcript: string;
    comments: string;
    notes: string;
    activeTab: "transcript" | "comments";
}

export const createEmptyVariant = (): VideoVariant => ({
    id: crypto.randomUUID(),
    title: "",
    url: "",
    transcript: "",
    comments: "",
    notes: "",
    activeTab: "transcript",
});

// Re-export for convenience
export type { DNA, ExtractedDNA, ContentScanResult };
