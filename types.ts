
export interface ContentPiece {
  id: string;
  title: string;
  description: string;
  script: string; // Used for Transcript
  comments?: string; // NEW: Audience feedback
  url?: string; // NEW: YouTube Link
  uniquePoints?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  color?: string; 
}

// NEW: User Settings from Supabase
export interface UserSettings {
  openrouter_key?: string;
  youtube_key?: string;
}

// NEW: DNA Structure Analysis
export interface ScriptDNA {
  id: string;
  name: string;
  source_urls?: string[]; // Updated to array
  analysis: {
    pacing: string; // e.g. "Fast-paced, cut every 3s"
    tone: string; // e.g. "Sarcastic, Educational"
    structure_skeleton: string[]; // e.g. ["Hook", "Intro", "Value", "CTA"]
    hook_technique: string;
    retention_tactics: string[];
    audience_psychology: string; // Derived from comments
    
    // --- NEW: UPGRADED INTELLIGENCE ---
    audience_sentiment: {
      high_dopamine_triggers: string[]; // "Goosebumps", "Best part"
      confusion_points: string[]; // "I don't get it", "Too fast"
      objections: string[]; // "I disagree", "This is wrong"
    };
    contrastive_insight: string; // The "Gap" between Viral vs Flop
    // ----------------------------------

    linguistic_style: string;
    successful_patterns: string[]; // Recurring elements
    content_gaps: string[]; // What was missing (from comments)
    viral_triggers: string[]; // What specific elements caused high engagement
    flop_reasons: string[]; // What to avoid based on flops
  };
  raw_transcript_summary: string;
}

export interface StyleAnalysis {
  core_formula: string;
  narrative_phases: { phase: string; purpose: string; duration_weight: string }[];
  pacing_map: { climax_points: string[]; speed_strategy: string; pattern: string };
  hook_hierarchy: { main_hook: string; micro_hooks: string[]; psychological_anchor: string };
  emotional_arc: { triggers: string[]; energy_flow: string; payoff_moment: string };
  linguistic_fingerprint: { pov: string; dominant_tones: string[]; vocabulary_style: string };
}

export interface BlueprintSection {
  id: string;
  title: string; 
  type: string; 
  purpose: string; 
  hook_tactic: string;
  micro_hook?: string; 
  emotional_goal: string;
  pacing_instruction: string; 
  pov_instruction: string; 
  tone_instruction: string; 
  retention_loop: string;
  content_plan: string;
  word_count_target: number;
  generated_content?: string; 
  custom_script_prompt?: string;
}

export interface ScriptBlueprint {
  analysis: StyleAnalysis;
  pitfalls: string[]; 
  sections: BlueprintSection[];
  
  // --- NEW: AUDIENCE SIMULATOR ---
  audience_simulation: {
    newbie_perspective: string;
    expert_perspective: string;
    hater_critique: string; // The "Anti-thesis" check
    final_verdict: string;
  };
  // -------------------------------
  
  critique: string;
}

export interface ScriptSection {
  id: string;
  title: string;
  content: string;
  type: string;
}

export interface OptimizedResult {
  blueprint: ScriptBlueprint; 
  rewritten: {
    title: string;
    description: string;
    tags: string;
    script_sections: ScriptSection[];
    explanation_of_changes: string;
  };
}

// --- NEW: SCORING TYPES ---
export interface ScoringCriterion {
  id: string;
  name: string;
  description: string;
}

export interface ScoringTemplate {
  id: string;
  name: string;
  criteria: ScoringCriterion[];
}

export interface ScoreItem {
  criteria: string;
  score: number; // 0-100
  reasoning: string;
  improvement_tip: string;
}

export interface ScoringResult {
  total_score: number;
  breakdown: ScoreItem[];
  overall_feedback: string;
  timestamp: number;
}
// --------------------------

// --- NEW: VERSION HISTORY ---
export interface VersionedItem<T> {
  id: string;
  timestamp: number;
  name: string; // e.g. "Draft 1", "Draft 2"
  data: T;
}
// ----------------------------

export type Step = 'input' | 'dna_selection' | 'blueprint' | 'result'; 
export type CreationMode = 'rewrite' | 'idea' | 'extract_dna'; 
export type OutputLanguage = 'Vietnamese' | 'English' | 'Spanish' | 'Japanese' | 'Korean';

export interface Folder {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  folderId?: string;
  name: string;
  updatedAt: number;
  data: {
    mode: CreationMode | null; 
    language: OutputLanguage; 
    userDraft: ContentPiece; 
    virals: ContentPiece[]; 
    flops: ContentPiece[];  
    targetWordCount: string;
    customStructurePrompt?: string; 
    customBlueprintPrompt?: string; 
    
    selectedDNA?: ScriptDNA; 
    availableDNAs: ScriptDNA[]; 
    
    selectedModel?: string;

    scoringTemplates: ScoringTemplate[]; 
    lastScore?: ScoringResult; 
    
    blueprint: ScriptBlueprint | null;
    blueprintVersions?: VersionedItem<ScriptBlueprint>[]; // NEW: History

    result: OptimizedResult | null;
    resultVersions?: VersionedItem<OptimizedResult>[]; // NEW: History
    
    step: Step;
  }
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
}

export interface ChannelProfile {
  name: string;
  niche: string;
  audience: string;
  voice: string;
}

export interface ScriptNode {
  id: string;
  type: string;
  description: string;
  wordCountTarget: number;
  content: string;
}

export interface CreditUsage {
  usage: number;
  limit: number | null;
  is_free_tier: boolean;
}

export type RoutePath = '/home' | '/home/dashboard' | '/home/creating' | '/home/notes' | '/home/pricing' | '/home/dna';
