import { callOpenRouter, extractJsonFromResponse, ChatMessage } from "./openrouter";
import { DNA_PERSONA_CONFLICT_MATRIX, detectConflicts, generateResolutionStrategy } from "@/prompts/conflict-resolution";
import { adaptDNAToPersona, type AdaptationResult } from "./dna-persona-adapter";

export interface GenerateScriptParams {
  topic: string;
  keyPoints?: string;
  uniqueAngle?: string;
  mode?: string;
  persona?: any;
  dna?: any;
  customPrompt?: string;
  language?: string;
  country?: string;
  targetWordCount?: number;
  allowStructureInnovation?: boolean;
}

export interface OutlineSection {
  title: string;
  wordCount: number;
  content: string;
  notes?: string;
}

// Updated: Outline now has ONLY sections array, no separate hook/callToAction
// Sections follow DNA structuralSkeleton 1:1
export interface GeneratedOutline {
  sections: OutlineSection[];
  totalWordCount: number;
}

export interface ScoreResult {
  score: number;
  breakdown: {
    hook: number;
    structure: number;
    engagement: number;
    clarity: number;
    callToAction: number;
  };
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

// Updated: Generate outline sections based on DNA skeleton
import { GENERATE_OUTLINE_PROMPT, GENERATE_SCRIPT_PROMPT, SCORE_SCRIPT_PROMPT, REWRITE_SECTION_PROMPT } from "@/prompts/writer";

// Helper: Build conflict resolution context
const buildConflictResolutionContext = (dna: any, persona: any): string => {
  if (!persona || !dna) return '';

  const conflicts = detectConflicts(dna, persona);
  if (conflicts.length > 0) {
    return `\n\n${DNA_PERSONA_CONFLICT_MATRIX}\n\n${generateResolutionStrategy(dna, persona)}`;
  }
  return `\n\n⚖️ DNA-PERSONA ALIGNMENT: No major conflicts detected. Follow DNA structure with Persona voice.`;
};

// Step 2: Generate Outline from inputs
export const generateOutline = async (
  params: GenerateScriptParams,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<GeneratedOutline> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình. Vui lòng nhập key vào Settings.");
  }

  if (!params.topic) {
    throw new Error("Topic là bắt buộc");
  }

  // ============================================================================
  // ADAPTER INTEGRATION: Adapt DNA to Persona if both exist
  // ============================================================================
  let adaptation: AdaptationResult | null = null;

  if (params.dna && params.persona) {
    adaptation = adaptDNAToPersona(params.dna, params.persona);

    // Log adaptation results for debugging
    console.log('🔗 DNA-Persona Adaptation:', {
      matchScore: adaptation.matchScore,
      warnings: adaptation.warnings,
      toneAdjustments: adaptation.toneAdjustments
    });
  }

  let systemPrompt = GENERATE_OUTLINE_PROMPT;

  // Add scaling and structure instructions
  if (params.targetWordCount) {
    systemPrompt += `\n\nTARGET TOTAL WORD COUNT: ${params.targetWordCount}`;
    systemPrompt += `\nINSTRUCTION: Scale the section word counts so they sum up to approximately ${params.targetWordCount}.`;
  }

  // Add language instruction
  if (params.language && params.language !== "en") {
    const langMap: Record<string, string> = {
      'vi': 'Vietnamese',
      'es': 'Spanish',
      'fr': 'French',
      'ja': 'Japanese',
      'ko': 'Korean'
    };
    const langName = langMap[params.language] || 'English';
    systemPrompt += `\n\nIMPORTANT: Write the output in ${langName}. Keep the JSON keys in English, but the content values must be in the specified language.`;
  }

  // Add country/region context for cultural adaptation
  if (params.country) {
    const countryMap: Record<string, string> = {
      'US': 'United States',
      'GB': 'United Kingdom',
      'VN': 'Vietnam',
      'JP': 'Japan',
      'KR': 'South Korea',
      'IN': 'India',
      'DE': 'Germany',
      'FR': 'France',
      'BR': 'Brazil',
      'ID': 'Indonesia',
      'TH': 'Thailand',
      'PH': 'Philippines',
      'AU': 'Australia',
      'CA': 'Canada',
      'MX': 'Mexico',
      'ES': 'Spain',
      'IT': 'Italy',
      'RU': 'Russia',
      'PL': 'Poland',
      'NL': 'Netherlands'
    };
    const countryName = countryMap[params.country] || params.country;
    systemPrompt += `\n\nTARGET REGION: ${countryName}\nAdapt the content for ${countryName} audience - consider local culture, references, examples, and communication style.`;
  }

  // Add conflict resolution matrix if both DNA and Persona exist
  systemPrompt += buildConflictResolutionContext(params.dna, params.persona);

  // ============================================================================
  // ADAPTER INTEGRATION: Add match score context
  // ============================================================================
  if (adaptation) {
    systemPrompt += `\n\n📊 DNA-PERSONA MATCH SCORE: ${adaptation.matchScore}/100`;

    if (adaptation.matchScore >= 80) {
      systemPrompt += ` (Excellent match - DNA and Persona are highly compatible)`;
    } else if (adaptation.matchScore >= 60) {
      systemPrompt += ` (Good match - minor adjustments needed)`;
    } else {
      systemPrompt += ` (⚠️ Low compatibility - significant calibration required)`;
    }
  }

  // Add audience context with Persona priority
  if (params.persona) {
    // Persona takes priority
    systemPrompt += `\n\nTARGET AUDIENCE (PRIMARY - Your defined persona):
- Name: ${params.persona.name}
- Age Range: ${params.persona.age_range || 'Not specified'}
- Knowledge Level: ${params.persona.knowledge_level || 'intermediate'}
- Pain Points: ${params.persona.pain_points?.join(', ') || 'Not specified'}
- Preferred Tone: ${params.persona.preferred_tone || 'casual'}
- Vocabulary: ${params.persona.vocabulary || 'conversational'}`;

    // Add new enhanced persona fields
    if (params.persona.trust_profile) {
      systemPrompt += `\n- Trust Profile: Primary = ${params.persona.trust_profile.primary}${params.persona.trust_profile.secondary ? `, Secondary = ${params.persona.trust_profile.secondary}` : ''} (${params.persona.trust_profile.reasoning})`;
    }

    if (params.persona.action_barriers?.length > 0) {
      systemPrompt += `\n- Action Barriers: ${params.persona.action_barriers.join(', ')}`;
    }

    if (params.persona.content_consumption) {
      systemPrompt += `\n- Attention Span: ${params.persona.content_consumption.attentionSpan || 'medium'}`;
      if (params.persona.content_consumption.preferredFormats) {
        systemPrompt += `\n- Preferred Formats: ${params.persona.content_consumption.preferredFormats.join(', ')}`;
      }
    }
  } else if (params.dna?.analysis_data?.audiencePsychology) {
    // Fallback to DNA audience psychology
    systemPrompt += `\n\nTARGET AUDIENCE (Inferred from source DNA):
${params.dna.analysis_data.audiencePsychology}`;
  }

  // Add DNA context
  if (params.dna) {
    // Prefer detailed structuralSkeleton if available
    const detailedStructure = params.dna.analysis_data?.structuralSkeleton;
    const basicStructure = params.dna.structure;

    // --- ENHANCED DNA CONTEXT ---
    systemPrompt += `\n\nCONTENT DNA STRATEGY (The "Winning Formula"):`;

    // 1. Hook Strategy
    const hookAngle = params.dna.analysis_data?.hookAngle;
    if (hookAngle) {
      systemPrompt += `\n- Hook Angle: ${hookAngle.angleCategory || params.dna.hook_type || 'Custom'} (${hookAngle.deconstruction || 'No details'})`;
    } else {
      systemPrompt += `\n- Hook Type: ${params.dna.hook_type || 'Not specified'}`;
    }

    // 2. Audience Psychology (Deep)
    if (params.dna.analysis_data?.audiencePsychology) {
      systemPrompt += `\n- Audience Psychology: ${params.dna.analysis_data.audiencePsychology}`;
    }

    // 3. Core Patterns (Strategy)
    if (params.dna.analysis_data?.corePatterns?.length) {
      systemPrompt += `\n- Success Patterns: ${params.dna.analysis_data.corePatterns.join(' | ')}`;
    }

    // 4. Flop Avoidance (Guardrails)
    if (params.dna.analysis_data?.flopAvoidance?.length) {
      systemPrompt += `\n- ⚠️ FLOP AVOIDANCE (Do NOT do this): ${params.dna.analysis_data.flopAvoidance.join(' | ')}`;
    }

    // 5. Tone & Pacing (Structure/Rhythm)
    systemPrompt += `\n- Pacing: ${params.dna.pacing || 'medium'}`;
    systemPrompt += `\n- Tone: ${params.dna.tone || 'engaging'}`;
    systemPrompt += `\n- Retention Tactics: ${params.dna.retention_tactics?.join(', ') || 'Not specified'}`;

    // ============================================================================
    // ADAPTER INTEGRATION: Use adapted word counts if available
    // ============================================================================
    if (detailedStructure && detailedStructure.length > 0) {
      systemPrompt += `\n\nREQUIRED STRUCTURE (Follow this EXACTLY unless innovation is allowed):
${detailedStructure.map((s: any, i: number) => {
        // Use adapted word count if available, otherwise use original
        const wordCount = adaptation?.adaptedWordCounts[s.title] || s.wordCount;
        return `${i + 1}. ${s.title} (Target: ~${wordCount} words) ${s.contentFocus ? `[Focus: ${s.contentFocus}]` : ''} ${s.pacing ? `[Pacing: ${s.pacing}]` : ''}`;
      }).join('\n')}`;
    } else if (basicStructure && basicStructure.length > 0) {
      systemPrompt += `\n\nREQUIRED STRUCTURE:
${basicStructure.join(' → ')}`;
    }

    if (params.allowStructureInnovation) {
      systemPrompt += `\n\nINNOVATION ALLOWED: You may deviate from the DNA structure by 15-25% to add novelty or better fit the topic. You can merge sections or add new relevant ones, but keep the core "DNA" feeling.`;
    } else {
      systemPrompt += `\n\nSTRICT ADHERENCE REQUIRED: You MUST follow the provided DNA structure/sections EXACTLY. Do not add or remove sections. Match the outline to the DNA steps 1-to-1.`;
    }

    // ============================================================================
    // ADAPTER INTEGRATION: Add proof strategy if available
    // ============================================================================
    if (adaptation?.proofStrategy) {
      systemPrompt += `\n\n🎯 PROOF STRATEGY (Optimized for target audience trust profile):
- Primary Proof Type: ${adaptation.proofStrategy.primary}
- Proof Sequence: ${adaptation.proofStrategy.sequence.join(' → ')}
- Section-specific Proof Placements:`;

      Object.entries(adaptation.proofStrategy.placements).forEach(([section, proofType]) => {
        systemPrompt += `\n  * "${section}": Use ${proofType}`;
      });

      systemPrompt += `\n\nINSTRUCTION: Place the specified proof types in their designated sections to maximize persuasiveness for this specific audience.`;
    }

    // ============================================================================
    // ADAPTER INTEGRATION: Add objection placement instructions
    // ============================================================================
    if (adaptation?.objectionPlacements && adaptation.objectionPlacements.length > 0) {
      systemPrompt += `\n\n🛡️ OBJECTION HANDLING TIMELINE (Address these at specific word count milestones):`;

      adaptation.objectionPlacements.forEach((obj, idx) => {
        systemPrompt += `\n${idx + 1}. At ~${obj.atWordCount} words (in "${obj.inSection}"):
   Objection: "${obj.objection}"
   Counter with: ${obj.counterTactic}`;
      });

      systemPrompt += `\n\nINSTRUCTION: Proactively address these objections at the specified word count milestones to prevent drop-offs.`;
    }

    // ============================================================================
    // ADAPTER INTEGRATION: Add tone adjustments if needed
    // ============================================================================
    if (adaptation?.toneAdjustments && adaptation.toneAdjustments.length > 0) {
      systemPrompt += `\n\n🎨 TONE CALIBRATION (Persona-specific adjustments):`;
      adaptation.toneAdjustments.forEach((adjustment) => {
        systemPrompt += `\n- ${adjustment}`;
      });
    }

    // ============================================================================
    // ADAPTER INTEGRATION: Add compatibility warnings
    // ============================================================================
    if (adaptation?.warnings && adaptation.warnings.length > 0) {
      systemPrompt += `\n\n⚠️ DNA-PERSONA COMPATIBILITY WARNINGS:`;
      adaptation.warnings.forEach((warning) => {
        systemPrompt += `\n- ${warning}`;
      });
      systemPrompt += `\n\nINSTRUCTION: Be mindful of these compatibility issues and adjust your approach accordingly.`;
    }

    // Retention Hooks (NEW - if available in DNA)
    if (params.dna.analysis_data?.retentionHooks && params.dna.analysis_data.retentionHooks.length > 0) {
      systemPrompt += `\n\n🎣 RETENTION HOOKS (Re-engagement at word count milestones):`;
      params.dna.analysis_data.retentionHooks.forEach((hook: any) => {
        systemPrompt += `\n- At ~${hook.atWordCount} words: ${hook.technique} (e.g., "${hook.example}")`;
      });
      systemPrompt += `\n\nINSTRUCTION: Use these retention hooks at the specified word counts to prevent audience drop-off.`;
    }

    // Persuasion Flow (NEW - if available in DNA)
    if (params.dna.analysis_data?.persuasionFlow) {
      const flow = params.dna.analysis_data.persuasionFlow;
      systemPrompt += `\n\n🧠 PERSUASION FLOW:
- Framework: ${flow.framework}
- Logical Progression: ${flow.logicalProgression?.join(' → ') || 'Not specified'}`;

      if (flow.objectionHandling?.mainObjection) {
        systemPrompt += `\n- Main Objection: "${flow.objectionHandling.mainObjection}"
  Counter Tactic: ${flow.objectionHandling.counterTactic}
  Placement: ${flow.objectionHandling.placement}`;
      }
    }

    // Transitions (NEW - if available in DNA)
    if (params.dna.analysis_data?.transitions && params.dna.analysis_data.transitions.length > 0) {
      systemPrompt += `\n\n🔗 TRANSITION FORMULAS (Use these between sections):`;
      params.dna.analysis_data.transitions.forEach((t: any, idx: number) => {
        systemPrompt += `\n${idx + 1}. ${t.from} → ${t.to}: ${t.formula}${t.example ? ` (e.g., "${t.example}")` : ''}`;
      });
    }

    // Hook Examples with anti-copy instruction
    if (params.dna.hook_examples && params.dna.hook_examples.length > 0) {
      systemPrompt += `\n\n🚫 HOOK EXAMPLES (CRITICAL - Study the PATTERN, do NOT copy exact wording):
${params.dna.hook_examples.map((ex: string, i: number) => `${i + 1}. "${ex}"`).join('\n')}

INSTRUCTION: Analyze the psychological triggers and structural patterns in these hooks. Then create an ENTIRELY ORIGINAL hook using the same psychological strategy but DIFFERENT words and examples. Copying any phrase verbatim is STRICTLY PROHIBITED.`;
    }
  }

  // Inject Unique Angle Context
  if (params.uniqueAngle) {
    systemPrompt += `\n\n=== UNIQUE ANGLE / NEW IDEA ===\n"${params.uniqueAngle}"\n\nINSTRUCTION: You MUST weave this unique angle into the content strategy of the outline. Don't just copy the DNA patterns; adapt them to serve this specific new angle.`;
  }

  let userMessage = `Create an outline for a script about: ${params.topic}`;
  if (params.keyPoints) {
    userMessage += `\n\nKey points to cover:\n${params.keyPoints}`;
  }
  if (params.uniqueAngle) {
    userMessage += `\n\nUnique angle/hook:\n${params.uniqueAngle}`;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  return extractJsonFromResponse(response);
};

// Step 3: Generate full script from outline
export const generateScriptFromOutline = async (
  outline: GeneratedOutline,
  params: GenerateScriptParams,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key ERROR. PLEASE CONTACT ADMIN.");
  }

  let systemPrompt = GENERATE_SCRIPT_PROMPT;

  // Add language instruction
  if (params.language && params.language !== "en") {
    const langMap: Record<string, string> = {
      'vi': 'Vietnamese',
      'es': 'Spanish',
      'fr': 'French',
      'ja': 'Japanese',
      'ko': 'Korean'
    };
    const langName = langMap[params.language] || 'English';
    systemPrompt += `\n\nIMPORTANT: Write the script in ${langName}.`;
  }

  // Add country/region context for cultural adaptation
  if (params.country) {
    const countryMap: Record<string, string> = {
      'US': 'United States', 'GB': 'United Kingdom', 'VN': 'Vietnam', 'JP': 'Japan',
      'KR': 'South Korea', 'IN': 'India', 'DE': 'Germany', 'FR': 'France',
      'BR': 'Brazil', 'ID': 'Indonesia', 'TH': 'Thailand', 'PH': 'Philippines',
      'AU': 'Australia', 'CA': 'Canada', 'MX': 'Mexico', 'ES': 'Spain',
      'IT': 'Italy', 'RU': 'Russia', 'PL': 'Poland', 'NL': 'Netherlands'
    };
    const countryName = countryMap[params.country] || params.country;
    systemPrompt += `\n\nTARGET REGION: ${countryName}\nAdapt content for ${countryName} audience - use local culture, references, examples.`;
  }

  // Add conflict resolution matrix if both DNA and Persona exist
  systemPrompt += buildConflictResolutionContext(params.dna, params.persona);

  // Add audience context with Persona priority
  if (params.persona) {
    // Persona takes priority
    systemPrompt += `\n\nTARGET AUDIENCE (PRIMARY - Your defined persona):
- Name: ${params.persona.name}
- Age Range: ${params.persona.age_range || 'Not specified'}
- Knowledge Level: ${params.persona.knowledge_level || 'intermediate'}
- Pain Points: ${params.persona.pain_points?.join(', ') || 'Not specified'}
- Preferred Tone: ${params.persona.preferred_tone || 'casual'}
- Vocabulary: ${params.persona.vocabulary || 'conversational'}`;
  } else if (params.dna?.analysis_data?.audiencePsychology) {
    // Fallback to DNA audience psychology
    systemPrompt += `\n\nTARGET AUDIENCE (Inferred from source DNA):
${params.dna.analysis_data.audiencePsychology}`;
  }

  // Add DNA context
  if (params.dna) {
    // --- ENHANCED DNA CONTEXT ---
    systemPrompt += `\n\n=== CONTENT DNA STRATEGY ===`;
    systemPrompt += `\nUSE THIS FOR STRUCTURE, PACING, AND STRATEGY.`;

    // 1. Hook Strategy
    const hookAngle = params.dna.analysis_data?.hookAngle;
    if (hookAngle) {
      systemPrompt += `\n- Hook Angle: ${hookAngle.angleCategory} - ${hookAngle.deconstruction}`;
    }

    // 2. Audience Psychology (Deep)
    if (params.dna.analysis_data?.audiencePsychology) {
      systemPrompt += `\n- Audience Psychology: ${params.dna.analysis_data.audiencePsychology}`;
    }

    // 3. Strategic Patterns
    if (params.dna.analysis_data?.corePatterns?.length) {
      systemPrompt += `\n- ⚡ CORE STRATEGIES (Apply these): ${params.dna.analysis_data.corePatterns.join('\n  * ')}`;
    }

    // 4. Viral X-Factors
    if (params.dna.analysis_data?.viralXFactors?.length) {
      systemPrompt += `\n- 🔥 X-FACTORS (The 'Secret Sauce'): ${params.dna.analysis_data.viralXFactors.join('\n  * ')}`;
    }

    // 5. Flop Avoidance
    if (params.dna.analysis_data?.flopAvoidance?.length) {
      systemPrompt += `\n- 🛑 FLOP AVOIDANCE (Strictly Avoid): ${params.dna.analysis_data.flopAvoidance.join('\n  * ')}`;
    }

    // 6. Objections
    if (params.dna.analysis_data?.objections?.length) {
      systemPrompt += `\n- 🛡️ OBJECTIONS TO PRE-EMPT: ${params.dna.analysis_data.objections.join(', ')}`;
    }

    systemPrompt += `\n\n- Structure: ${params.dna.structure?.join(' → ') || 'Follow Outline'}`;
    systemPrompt += `\n- Pacing: ${params.dna.pacing || params.dna.analysis_data?.pacingAndTone?.pacing || 'medium'}`;
    systemPrompt += `\n- Retention Tactics: ${params.dna.retention_tactics?.join(', ') || 'Not specified'}`;

    // Hook Examples with anti-copy instruction
    if (params.dna.hook_examples && params.dna.hook_examples.length > 0) {
      systemPrompt += `\n\n🚫 HOOK EXAMPLES (CRITICAL - Study the PATTERN, do NOT copy exact wording):
${params.dna.hook_examples.map((ex: string, i: number) => `${i + 1}. "${ex}"`).join('\n')}

INSTRUCTION: Analyze the psychological triggers. Create an ENTIRELY ORIGINAL hook using the same strategy but DIFFERENT words. Copying any phrase verbatim is STRICTLY PROHIBITED.`;
    }
  }

  const outlineText = `
OUTLINE TO FOLLOW (${outline.sections.length} sections):

${outline.sections.map((s, i) => `${i + 1}. ${s.title} (Target: ${s.wordCount} words)
   Content: ${s.content}
   ${s.notes ? `Notes: ${s.notes}` : ''}`).join('\n\n')}

Total Target Words: ${outline.totalWordCount}
`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Write a complete script following this outline:\n${outlineText}` }
  ];

  return await callOpenRouter(messages, apiKey, model);
};

// Legacy: Generate script directly (for backward compatibility)
export const generateScript = async (
  params: GenerateScriptParams,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<string> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình. Vui lòng nhập key vào Settings.");
  }

  if (!params.topic) {
    throw new Error("Topic là bắt buộc");
  }

  let systemPrompt = `You are an expert viral content scriptwriter. Your job is to create compelling, engaging scripts that capture attention and drive engagement.

Based on the provided inputs, write a complete script that:
1. Opens with a powerful hook that grabs attention in the first 3 seconds
2. Uses proven viral patterns and retention tactics
3. Maintains engagement throughout with pattern interrupts
4. Ends with a clear call-to-action

Write the script in a natural, conversational tone. Include [VISUAL] cues where relevant.`;

  // Add language instruction
  if (params.language && params.language !== "en") {
    const langMap: Record<string, string> = {
      'vi': 'Vietnamese',
      'es': 'Spanish',
      'fr': 'French',
      'ja': 'Japanese',
      'ko': 'Korean'
    };
    const langName = langMap[params.language] || 'English';
    systemPrompt += `\n\nIMPORTANT: Write the script in ${langName}.`;
  }

  // Add country/region context for cultural adaptation
  if (params.country) {
    const countryMap: Record<string, string> = {
      'US': 'United States', 'GB': 'United Kingdom', 'VN': 'Vietnam', 'JP': 'Japan',
      'KR': 'South Korea', 'IN': 'India', 'DE': 'Germany', 'FR': 'France',
      'BR': 'Brazil', 'ID': 'Indonesia', 'TH': 'Thailand', 'PH': 'Philippines',
      'AU': 'Australia', 'CA': 'Canada', 'MX': 'Mexico', 'ES': 'Spain',
      'IT': 'Italy', 'RU': 'Russia', 'PL': 'Poland', 'NL': 'Netherlands'
    };
    const countryName = countryMap[params.country] || params.country;
    systemPrompt += `\n\nTARGET REGION: ${countryName}\nAdapt the content for ${countryName} audience - consider local culture, references, examples, and communication style.`;
  }

  // Add persona context
  if (params.persona) {
    systemPrompt += `\n\nTARGET AUDIENCE:
- Name: ${params.persona.name}
- Age Range: ${params.persona.age_range || 'Not specified'}
- Knowledge Level: ${params.persona.knowledge_level || 'intermediate'}
- Pain Points: ${params.persona.pain_points?.join(', ') || 'Not specified'}
- Preferred Tone: ${params.persona.preferred_tone || 'casual'}
- Vocabulary: ${params.persona.vocabulary || 'conversational'}`;
  }

  // Add DNA context
  if (params.dna) {
    systemPrompt += `\n\nCONTENT DNA PATTERNS:
- Hook Type: ${params.dna.hook_type || 'Not specified'}
- Structure: ${params.dna.structure?.join(' → ') || 'Not specified'}
- Pacing: ${params.dna.pacing || 'medium'}
- Retention Tactics: ${params.dna.retention_tactics?.join(', ') || 'Not specified'}
- Tone: ${params.dna.tone || 'engaging'}
- Patterns: ${params.dna.patterns?.join(', ') || 'Not specified'}`;
  }

  // Add custom prompt
  if (params.customPrompt) {
    systemPrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${params.customPrompt}`;
  }

  let userMessage = `Write a script about: ${params.topic}`;
  if (params.keyPoints) {
    userMessage += `\n\nKey points to cover:\n${params.keyPoints}`;
  }
  if (params.uniqueAngle) {
    userMessage += `\n\nUnique angle/hook:\n${params.uniqueAngle}`;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

  return await callOpenRouter(messages, apiKey, model);
};

export const scoreScript = async (
  script: string,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview",
  dna?: any,
  persona?: any
): Promise<ScoreResult> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình. Vui lòng nhập key vào Settings.");
  }

  if (!script) {
    throw new Error("Script là bắt buộc");
  }

  let systemPrompt = SCORE_SCRIPT_PROMPT;

  if (dna) {
    systemPrompt += `\n\nEvaluate against these DNA patterns:
- Hook Type: ${dna.hook_type || 'Not specified'}
- Structure: ${dna.structure?.join(' → ') || 'Not specified'}
- Tone: ${dna.tone || 'engaging'}`;
  }

  if (persona) {
    systemPrompt += `\n\nTarget audience:
- Name: ${persona.name}
- Knowledge Level: ${persona.knowledge_level || 'intermediate'}`;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Score this script:\n\n${script}` }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  return extractJsonFromResponse(response);
};

// ============================================================================
// SECTION-BY-SECTION GENERATION (with Hybrid Coherence System)
// ============================================================================

/**
 * Count words in a string
 */
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Scale DNA section word counts to match user's target with safeguards
 * Prevents sections from being too small or too large
 * @returns sections with scaled, rounded integer word counts
 */
export const scaleDnaWordCounts = (
  sections: OutlineSection[],
  targetTotalWords: number
): OutlineSection[] => {
  const currentTotal = sections.reduce((sum, s) => sum + s.wordCount, 0);
  if (currentTotal === 0 || targetTotalWords <= 0) return sections;

  // Define constraints
  const MIN_SECTION_WORDS = 80;  // Minimum words per section (enough to develop an idea)
  const MAX_SECTION_RATIO = 0.35; // Max 35% of total for any single section
  const MAX_SECTION_WORDS = Math.floor(targetTotalWords * MAX_SECTION_RATIO);

  const scaleFactor = targetTotalWords / currentTotal;

  // Scale and apply constraints
  let scaled = sections.map(s => {
    const rawScaled = Math.round(s.wordCount * scaleFactor);
    // Clamp to min/max
    const clamped = Math.max(MIN_SECTION_WORDS, Math.min(MAX_SECTION_WORDS, rawScaled));
    return {
      ...s,
      wordCount: clamped
    };
  });

  // Re-normalize to hit target total (after clamping)
  const clampedTotal = scaled.reduce((sum, s) => sum + s.wordCount, 0);
  const diff = targetTotalWords - clampedTotal;

  if (diff !== 0) {
    // Distribute the difference proportionally across sections that have room
    // Positive diff = add more words, negative = remove words
    const adjustableSections = scaled.map((s, idx) => ({
      idx,
      room: diff > 0
        ? MAX_SECTION_WORDS - s.wordCount // Room to grow
        : s.wordCount - MIN_SECTION_WORDS // Room to shrink
    })).filter(s => s.room > 0);

    if (adjustableSections.length > 0) {
      const totalRoom = adjustableSections.reduce((sum, s) => sum + s.room, 0);

      adjustableSections.forEach(({ idx, room }) => {
        const proportion = room / totalRoom;
        const adjustment = Math.round(diff * proportion);
        scaled[idx].wordCount += adjustment;
      });

      // Final rounding fix: add/subtract remainder to/from largest section
      const finalTotal = scaled.reduce((sum, s) => sum + s.wordCount, 0);
      const remainder = targetTotalWords - finalTotal;
      if (remainder !== 0) {
        const largestIdx = scaled.reduce((maxIdx, s, idx) =>
          s.wordCount > scaled[maxIdx].wordCount ? idx : maxIdx, 0);
        scaled[largestIdx].wordCount += remainder;
      }
    }
  }

  return scaled;
};

/**
 * Get last N words from text for context (default 500)
 */
export const getLastNWords = (text: string, n: number = 500): string => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= n) return text;
  return words.slice(-n).join(' ');
};

/**
 * Extract key points from a section for coherence
 */
export const extractKeyPoints = async (
  sectionContent: string,
  sectionTitle: string,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<string[]> => {
  const prompt = `You just wrote this section titled "${sectionTitle}":
"""${sectionContent}"""

Extract 3-5 KEY POINTS that MUST be remembered for continuity in following sections:
- Key concepts/terms introduced
- Promises made to the reader (open loops)
- Specific examples, numbers, or names used
- Emotional tone established

Output JSON only: { "keyPoints": ["point 1", "point 2", "point 3"] }`;

  const messages: ChatMessage[] = [
    { role: "system", content: "You are a content analyzer. Extract key points for continuity. Output JSON only." },
    { role: "user", content: prompt }
  ];

  try {
    const response = await callOpenRouter(messages, apiKey, model);
    const parsed = extractJsonFromResponse(response);
    return parsed.keyPoints || [];
  } catch {
    return [];
  }
};

/**
 * Generate a single section with coherence context
 */
export const generateSectionContent = async (
  section: OutlineSection,
  sectionIndex: number,
  accumulatedKeyPoints: string[][],
  previousSectionContent: string | null,
  params: GenerateScriptParams,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<string> => {
  let systemPrompt = `You are an expert viral content scriptwriter writing Section ${sectionIndex + 1}: "${section.title}".

RULES:
1. Write ONLY spoken voiceover content (no visual cues).
2. Maintain the SAME voice, vocabulary, and energy as previous content.
3. DO NOT repeat concepts already covered in Key Points.
4. Target: ${section.wordCount} words (±10%).
5. Be DETAILED and insightful, not generic.`;

  // Add language instruction
  if (params.language && params.language !== "en") {
    const langMap: Record<string, string> = {
      'vi': 'Vietnamese', 'es': 'Spanish', 'fr': 'French', 'ja': 'Japanese', 'ko': 'Korean'
    };
    systemPrompt += `\n\nIMPORTANT: Write in ${langMap[params.language] || 'English'}.`;
  }

  // Add country/region context for cultural adaptation
  if (params.country) {
    const countryMap: Record<string, string> = {
      'US': 'United States', 'GB': 'United Kingdom', 'VN': 'Vietnam', 'JP': 'Japan',
      'KR': 'South Korea', 'IN': 'India', 'DE': 'Germany', 'FR': 'France',
      'BR': 'Brazil', 'ID': 'Indonesia', 'TH': 'Thailand', 'PH': 'Philippines',
      'AU': 'Australia', 'CA': 'Canada', 'MX': 'Mexico', 'ES': 'Spain',
      'IT': 'Italy', 'RU': 'Russia', 'PL': 'Poland', 'NL': 'Netherlands'
    };
    const countryName = countryMap[params.country] || params.country;
    systemPrompt += `\n\nTARGET REGION: ${countryName}\nAdapt the content for ${countryName} audience - consider local culture, references, examples, and communication style.`;
  }

  // Add persona context
  if (params.persona) {
    systemPrompt += `\n\nTARGET AUDIENCE:
- Knowledge Level: ${params.persona.knowledge_level || 'intermediate'}
- Preferred Tone: ${params.persona.preferred_tone || 'casual'}`;
  }

  // Add DNA context
  if (params.dna) {
    systemPrompt += `\n\nCONTENT DNA:
- Tone: ${params.dna.analysis_data?.linguisticFingerprint?.toneAnalysis || params.dna.tone || 'engaging'}
- Pacing: ${params.dna.pacing || 'medium'}`;
  }

  // Build user message with coherence context
  let userMessage = "";

  // Add accumulated key points from ALL previous sections
  if (accumulatedKeyPoints.length > 0) {
    userMessage += `=== KEY POINTS FROM PREVIOUS SECTIONS (DO NOT REPEAT) ===\n`;
    accumulatedKeyPoints.forEach((points, i) => {
      if (points.length > 0) {
        userMessage += `Section ${i + 1}: ${points.join(' | ')}\n`;
      }
    });
    userMessage += "\n";
  }

  // Add FULL previous section for flow continuity
  if (previousSectionContent) {
    userMessage += `=== PREVIOUS SECTION (maintain flow) ===\n${previousSectionContent}\n\n`;
  }

  // Current section outline
  userMessage += `=== YOUR TASK: Write Section "${section.title}" ===
Content Focus: ${section.content}
Target Words: ${section.wordCount}
${section.notes ? `Notes: ${section.notes}` : ''}

`;

  // Transition instruction (only if not first section)
  if (previousSectionContent) {
    userMessage += `INSTRUCTION:
1. Start with a SMOOTH TRANSITION from the previous section (1-2 sentences).
2. Then write the full content for "${section.title}".
3. DO NOT start with generic phrases like "Now let's talk about...". Be creative.

Write the full section content now:`;
  } else {
    userMessage += `Write the full section content now:`;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ];

  return await callOpenRouter(messages, apiKey, model);
};

/**
 * Expand a section if word count is insufficient
 */
export const expandSection = async (
  currentContent: string,
  targetWordCount: number,
  section: OutlineSection,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<string> => {
  const currentWords = countWords(currentContent);
  const missingWords = targetWordCount - currentWords;

  const prompt = `Current section "${section.title}" has ${currentWords} words.
Target: ${targetWordCount} words.
Missing: approximately ${missingWords} words.

Current content:
"""${currentContent}"""

EXPAND this section by:
1. Adding more specific examples or scenarios
2. Deepening explanations with "why" and "how"
3. Adding rhetorical questions for engagement
4. Including brief "pause moments" for impact

DO NOT:
- Repeat what's already written
- Add filler content
- Change the core message

Return the COMPLETE expanded section (the entire section, not just additions):`;

  const messages: ChatMessage[] = [
    { role: "system", content: "You are a content expander. Add depth and value without repetition." },
    { role: "user", content: prompt }
  ];

  return await callOpenRouter(messages, apiKey, model);
};

/**
 * Progress callback for UI updates
 */
export type SectionProgressCallback = (
  currentSection: number,
  totalSections: number,
  status: string
) => void;

/**
 * Main function: Generate script using hybrid chunk approach (2 sections per API call)
 */
export const generateScriptSectionBySection = async (
  outline: GeneratedOutline,
  params: GenerateScriptParams,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview",
  onProgress?: SectionProgressCallback
): Promise<string> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key chưa được cấu hình.");
  }

  // Scale sections to match user's target word count
  let sections = outline.sections;
  if (params.targetWordCount && params.targetWordCount > 0) {
    sections = scaleDnaWordCounts(sections, params.targetWordCount);
  }

  const SECTIONS_PER_CHUNK = 2;
  const allChunkResults: string[] = [];
  let accumulatedContent = "";

  // Chunk sections into pairs
  const chunks: OutlineSection[][] = [];
  for (let i = 0; i < sections.length; i += SECTIONS_PER_CHUNK) {
    chunks.push(sections.slice(i, i + SECTIONS_PER_CHUNK));
  }

  const totalSections = sections.length;
  let processedSections = 0;

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    const chunkTargetWords = chunk.reduce((sum, s) => sum + s.wordCount, 0);

    // Progress update
    processedSections += chunk.length;
    const sectionNames = chunk.map(s => s.title).join(" & ");
    onProgress?.(processedSections, totalSections, `Writing "${sectionNames}"...`);

    // Build system prompt
    let systemPrompt = `You are an expert viral content scriptwriter. Write the following ${chunk.length} section(s) in one continuous, seamless flow.

RULES:
1. Write ONLY spoken voiceover content (no visual cues, no markdown).
2. Create natural transitions between sections without forced phrases.
3. Be DETAILED, insightful, and valuable - not generic.

⚠️ STRICT WORD COUNT (CRITICAL):
- TOTAL for this chunk: EXACTLY ${chunkTargetWords} words
- Tolerance: ±5% ONLY (${Math.floor(chunkTargetWords * 0.95)}-${Math.ceil(chunkTargetWords * 1.05)} words)
- Count your words before finalizing
- Going significantly over or under is NOT acceptable

⚠️ TTS-OPTIMIZED OUTPUT (CRITICAL):
- NO markdown symbols: no *, #, **, _, ~, \`, etc.
- NO section titles or headers in the output
- NO film/video directions: no [B-roll], [Cut to], [VISUAL], (pause), etc.
- NO parenthetical notes or brackets of any kind
- ONLY clean, speakable text that can be read aloud naturally`;

    // Add language instruction
    if (params.language && params.language !== "en") {
      const langMap: Record<string, string> = {
        'vi': 'Vietnamese', 'es': 'Spanish', 'fr': 'French', 'ja': 'Japanese', 'ko': 'Korean'
      };
      systemPrompt += `\n\nIMPORTANT: Write in ${langMap[params.language] || 'English'}.`;
    }

    // Add country/region context for cultural adaptation
    if (params.country) {
      const countryMap: Record<string, string> = {
        'US': 'United States', 'GB': 'United Kingdom', 'VN': 'Vietnam', 'JP': 'Japan',
        'KR': 'South Korea', 'IN': 'India', 'DE': 'Germany', 'FR': 'France',
        'BR': 'Brazil', 'ID': 'Indonesia', 'TH': 'Thailand', 'PH': 'Philippines',
        'AU': 'Australia', 'CA': 'Canada', 'MX': 'Mexico', 'ES': 'Spain',
        'IT': 'Italy', 'RU': 'Russia', 'PL': 'Poland', 'NL': 'Netherlands'
      };
      const countryName = countryMap[params.country] || params.country;
      systemPrompt += `\n\nTARGET REGION: ${countryName}\nAdapt the content for ${countryName} audience - consider local culture, references, examples, and communication style.`;
    }

    // Add DNA context
    if (params.dna) {
      systemPrompt += `\n\nCONTENT DNA:
- Tone: ${params.dna.analysis_data?.linguisticFingerprint?.toneAnalysis || params.dna.tone || 'engaging'}
- Pacing: ${params.dna.pacing || 'medium'}`;
    }

    // Add persona context
    if (params.persona) {
      systemPrompt += `\n\nTARGET AUDIENCE:
- Knowledge Level: ${params.persona.knowledge_level || 'intermediate'}
- Preferred Tone: ${params.persona.preferred_tone || 'casual'}`;
    }

    // Build user message
    let userMessage = "";

    // Add last 500 words as context (not full previous content)
    if (accumulatedContent.length > 0) {
      const contextWords = getLastNWords(accumulatedContent, 500);
      userMessage += `=== PREVIOUS CONTEXT (last 500 words - maintain flow) ===\n${contextWords}\n\n`;
    }

    // Section details
    userMessage += `=== SECTIONS TO WRITE ===\n`;
    chunk.forEach((section, i) => {
      userMessage += `${i + 1}. "${section.title}" (~${section.wordCount} words)\n`;
      userMessage += `   Content: ${section.content}\n`;
      if (section.notes) userMessage += `   Notes: ${section.notes}\n`;
      userMessage += `\n`;
    });

    userMessage += `TOTAL TARGET: ${chunkTargetWords} words\n\n`;

    if (chunk.length > 1) {
      userMessage += `OUTPUT FORMAT: Use |||SECTION||| delimiter between sections.\n\n`;
    }

    userMessage += `Write the content now:`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    const chunkContent = await callOpenRouter(messages, apiKey, model);
    allChunkResults.push(chunkContent);
    accumulatedContent += "\n" + chunkContent;
  }

  // Combine all chunks
  return allChunkResults.join("\n|||SECTION|||\n");
};

// ============================================
// AI ASSISTANT FUNCTIONS
// ============================================

export interface SuggestedAngle {
  angle: string;
  reasoning: string;
}

export interface SEOResult {
  title: string;
  description: string;
  tags: string[];
}

/**
 * AI suggests unique angles based on topic, DNA, and persona
 */
export const suggestUniqueAngle = async (
  topic: string,
  dna: any | null,
  persona: any | null,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<SuggestedAngle[]> => {
  const prompt = `You are a viral content strategist. Suggest 3 unique angles for creating content about this topic.

TOPIC: ${topic}

${dna ? `DNA STYLE:
- Hook Type: ${dna.hook_type || 'engaging'}
- Tone: ${dna.tone || 'conversational'}
- Niche: ${dna.niche || 'general'}` : ''}

${persona ? `TARGET AUDIENCE:
- Name: ${persona.name}
- Knowledge Level: ${persona.knowledge_level || 'intermediate'}
- Pain Points: ${persona.pain_points?.join(', ') || 'Not specified'}` : ''}

Respond in JSON format:
{
  "angles": [
    { "angle": "The unique angle/hook", "reasoning": "Why this angle works" },
    { "angle": "Another angle", "reasoning": "Why this works" },
    { "angle": "Third angle", "reasoning": "Why this works" }
  ]
}`;

  const messages: ChatMessage[] = [
    { role: "user", content: prompt }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  const parsed = extractJsonFromResponse(response);
  return parsed.angles || [];
};

/**
 * AI rewrites a section with optional user instructions
 */
export const rewriteSection = async (
  sectionTitle: string,
  currentContent: string,
  userInstructions: string,
  context: {
    previousSections?: string[];
    dna?: any;
    persona?: any;
    targetWordCount?: number;
  },
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<string> => {
  // Use centralized prompt constructor
  const prompt = REWRITE_SECTION_PROMPT(sectionTitle, currentContent, userInstructions, context);

  const messages: ChatMessage[] = [
    { role: "user", content: prompt }
  ];

  return await callOpenRouter(messages, apiKey, model);
};

/**
 * AI generates SEO-optimized title, description, and tags
 */
export const generateSEO = async (
  script: string,
  dna: any | null,
  persona: any | null,
  apiKey: string,
  model: string = "google/gemini-3-flash-preview"
): Promise<SEOResult> => {
  const prompt = `You are an SEO expert for video content. Generate optimized metadata for this script.

SCRIPT CONTENT:
"""
${script.substring(0, 2000)}${script.length > 2000 ? '...' : ''}
"""

${dna ? `CONTENT STYLE: ${dna.niche || 'general'} - ${dna.tone || 'engaging'}` : ''}
${persona ? `TARGET AUDIENCE: ${persona.name || 'General audience'}` : ''}

Generate SEO-optimized metadata. Respond in JSON:
{
  "title": "Catchy, SEO-friendly title (50-60 chars)",
  "description": "Compelling description with keywords (150-160 chars)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  const messages: ChatMessage[] = [
    { role: "user", content: prompt }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  const parsed = extractJsonFromResponse(response);

  return {
    title: parsed.title || "",
    description: parsed.description || "",
    tags: parsed.tags || []
  };
};
