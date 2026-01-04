// Shared types for Writer components
import type { GeneratedOutline, OutlineSection, ScoreResult } from "@/lib/script-generator";
import type { Persona } from "@/hooks/usePersonas";
import type { DNA } from "@/hooks/useDnas";
import type { VersionEntry } from "@/hooks/useScripts";

export type WriterMode = "select" | "new-idea" | "rewrite";
export type WriterStep = "input" | "outline" | "script";

export interface OutlineVersion {
    id: string;
    outline: GeneratedOutline;
    createdAt: Date;
    script?: string;
}

export interface ReferenceItem {
    id: string;
    title: string;
    url: string;
    transcript: string;
    comments: string;
    notes: string;
    activeTab: "transcript" | "comments";
}

export const createEmptyReference = (): ReferenceItem => ({
    id: crypto.randomUUID(),
    title: "",
    url: "",
    transcript: "",
    comments: "",
    notes: "",
    activeTab: "transcript",
});

// Re-export for convenience
export type { GeneratedOutline, OutlineSection, ScoreResult, Persona, DNA, VersionEntry };
