// ============================================================================
// DNA vs PERSONA CONFLICT RESOLUTION MATRIX
// ============================================================================
// Provides clear, actionable guidelines for resolving conflicts between
// DNA patterns (viral structure) and Persona preferences (audience voice)

export const DNA_PERSONA_CONFLICT_MATRIX = `
<conflict_resolution_framework>
When DNA and Persona provide conflicting guidance, use this priority matrix to make consistent, quality-driven decisions.

<priority_matrix>
┌──────────────────────┬─────────┬──────────┬──────────────────────────────────────────────────┐
│ Content Element      │ DNA %   │ Persona %│ Resolution Rule                                  │
├──────────────────────┼─────────┼──────────┼──────────────────────────────────────────────────┤
│ Structure/Flow       │ 100%    │ 0%       │ DNA defines architecture - follow exactly        │
│ Pacing/Rhythm        │ 100%    │ 0%       │ DNA controls tempo and sentence structure        │
│ Vocabulary           │ 30%     │ 70%      │ Persona's words, DNA's complexity level          │
│ Tone/Voice           │ 40%     │ 60%      │ Persona's tone, DNA's energy level               │
│ Hook Strategy        │ 80%     │ 20%      │ DNA's psychological trigger in Persona's voice   │
│ Objection Handling   │ 20%     │ 80%      │ Persona's objections, DNA's rhetorical method    │
│ Examples/Stories     │ 50%     │ 50%      │ DNA's format, Persona-relevant content           │
│ Complexity/Depth     │ 40%     │ 60%      │ Adapt to Persona level, keep DNA progression     │
└──────────────────────┴─────────┴──────────┴──────────────────────────────────────────────────┘
</priority_matrix>

<resolution_examples>

EXAMPLE 1: Tone Conflict
<scenario>
DNA: "Authoritative, expert-driven"
Persona: "Casual, friendly"
Conflict Type: Direct contradiction in voice
</scenario>

<resolution>
Priority: 60% Persona, 40% DNA

❌ WRONG (100% DNA): "The utilization of this methodology facilitates optimal outcomes..."
❌ WRONG (100% Persona): "So like, here's a thing you might want to try maybe..."
✅ RIGHT (Balanced): "Here's how this works – and trust me, the results speak for themselves."

Explanation: Uses casual words ("here's how") and friendly framing ("trust me"), but maintains authoritative confidence ("results speak for themselves"). Persona's tone dominates, DNA's authority energy preserved.
</resolution>

EXAMPLE 2: Vocabulary vs Knowledge Level
<scenario>
DNA: Uses advanced technical terms (ROI, CAC, LTV, conversion rate)
Persona: Beginner knowledge level, needs plain language
Conflict Type: Vocabulary complexity mismatch
</scenario>

<resolution>
Priority: 70% Persona (simplify vocabulary)

❌ WRONG (100% DNA): "Your CAC should be 3x lower than LTV for optimal ROI."
✅ RIGHT (Simplified): "You want to spend way less to get a customer than what they're worth to you over time – ideally about 3 times less. That's how you make money."

Explanation: Same DNA concept (3x ratio formula), translated to beginner-accessible language. Structure preserved, vocabulary adapted.
</resolution>

EXAMPLE 3: Hook Strategy Adaptation
<scenario>
DNA: Contrarian hook (challenge common belief aggressively)
Persona: Empathetic, non-confrontational audience
Conflict Type: Hook aggressiveness vs audience sensitivity
</scenario>

<resolution>
Priority: 80% DNA strategy, 20% Persona voice

❌ WRONG (100% DNA): "Everything you know about X is DEAD WRONG."
❌ WRONG (100% Persona): "Hey, let me gently share some thoughts about X..."
✅ RIGHT (Blended): "I used to believe the same thing about X... until I discovered this one detail that changed everything."

Explanation: Keeps contrarian psychology (DNA) – challenges belief, creates curiosity gap. Delivers in empathetic voice (Persona) – "I used to believe" creates connection, not confrontation.
</resolution>

</resolution_examples>

<decision_tree>
Follow this systematic process when conflicts arise:

STEP 1: IDENTIFY Conflict Type
├─ Structural (sections, flow, architecture) → DNA wins 100%
├─ Linguistic (word choice, grammar, vocabulary) → Persona wins 70%
├─ Strategic (hooks, retention tactics, viral psychology) → DNA wins 80%
└─ Audience Fit (objections, examples, knowledge level) → Persona wins 80%

STEP 2: CHECK for Deal-Breakers
├─ Is DNA strategy proven viral? If YES → Bias toward DNA
├─ Is Persona mismatch severe (expert terms for beginners)? If YES → Bias toward Persona
├─ Is platform critical (formal tone on TikTok)? If YES → Bias toward Persona/Platform
└─ If multiple deal-breakers → Flag for user decision, don't force-blend

STEP 3: APPLY Priority %
Use the percentage split from the matrix:
- 100/0: One side completely overrides
- 80/20: Strong preference, minor adaptation
- 60/40: Lean toward one, significant influence from other
- 50/50: True balance, blend both equally

STEP 4: VALIDATE Output Quality
Ask these questions before finalizing:
├─ Does it sound natural? (Not forced or "Franken-content")
├─ Does it respect Persona's intelligence level?
├─ Does it preserve DNA's viral psychology mechanisms?
└─ Would a real human speak/write this way?
</decision_tree>

<edge_cases>

CASE 1: DNA Without Persona Context
If DNA extracted from generic viral content (no specific audience):
→ Persona takes 80% priority across all elements EXCEPT Structure
→ Keep DNA skeleton, adapt everything else to Persona

CASE 2: Generic/Vague Persona
If Persona has minimal detail or is too generic ("wants value"):
→ DNA takes 80% priority - use proven patterns as primary guide
→ Make conservative assumptions for Persona elements

CASE 3: Both Highly Specific and Conflicting
When both DNA and Persona are detailed but contradictory:
→ Follow matrix strictly
→ Document adaptation: "Adapted DNA [element X] to fit Persona [constraint Y]"
→ If irreconcilable → Flag to user

CASE 4: Platform-Specific Overrides
Platform conventions override both DNA and Persona:
├─ TikTok/Instagram Reels → Always casual, always fast-paced
├─ LinkedIn/Medium → DNA structure sacred, adapt tone only
├─ YouTube → Balance 50/50 unless strong Persona specification
└─ Email/Newsletter → Persona 70%, DNA structure 30%

CASE 5: Knowledge Level Safety Net
Automatic simplification rule:
IF (DNA complexity > Persona knowledgeLevel + 1):
   → Simplify vocabulary automatically (override DNA %)
   → Maintain DNA structure and logic
   → Add "explain like I'm [knowledge level]" constraint

</edge_cases>

<anti_patterns>
Common mistakes to AVOID:

1. ❌ Franken-Content: Randomly mixing DNA and Persona without strategy
   ✅ Instead: Apply matrix consistently across entire script

2. ❌ Ignoring Platform: Using formal tone on TikTok because DNA says so
   ✅ Instead: Platform > DNA tone (use edge case rules)

3. ❌ Over-Simplification: Beginner persona = treat audience like children
   ✅ Instead: Simplify vocabulary, not intelligence or insight quality

4. ❌ Forcing Conflicts: Trying to blend when fundamental incompatibility exists
   ✅ Instead: Choose the stronger strategy or flag to user

5. ❌ Inconsistent Application: Using different rules for different sections
   ✅ Instead: Apply same conflict resolution logic throughout entire script
</anti_patterns>

</conflict_resolution_framework>`;

// ============================================================================
// Helper Functions for Conflict Detection & Resolution
// ============================================================================

// Detect conflicts between DNA and Persona
export const detectConflicts = (dna: any, persona: any): string[] => {
  const conflicts: string[] = [];

  // Tone conflict
  if (dna?.tone && persona?.preferred_tone) {
    const dnaTone = dna.tone.toLowerCase();
    const personaTone = persona.preferred_tone.toLowerCase();

    const toneConflicts = [
      { dna: 'authoritative', persona: 'casual', conflict: 'DNA is authoritative but Persona prefers casual tone' },
      { dna: 'formal', persona: 'casual', conflict: 'DNA is formal but Persona prefers casual tone' },
      { dna: 'aggressive', persona: 'empathetic', conflict: 'DNA is aggressive but Persona prefers empathetic tone' },
      { dna: 'serious', persona: 'humorous', conflict: 'DNA is serious but Persona prefers humorous tone' },
    ];

    for (const tc of toneConflicts) {
      if (dnaTone.includes(tc.dna) && personaTone.includes(tc.persona)) {
        conflicts.push(tc.conflict);
      }
    }
  }

  // Vocabulary/Knowledge conflict
  if (dna?.vocabulary && persona?.knowledge_level) {
    const hasAdvancedTerms = dna.vocabulary.toLowerCase().includes('technical') ||
                             dna.vocabulary.toLowerCase().includes('jargon') ||
                             dna.vocabulary.toLowerCase().includes('advanced') ||
                             dna.vocabulary.toLowerCase().includes('expert');
    const isBeginner = persona.knowledge_level === 'beginner';

    if (hasAdvancedTerms && isBeginner) {
      conflicts.push('DNA uses advanced vocabulary but Persona is beginner level - will auto-simplify');
    }
  }

  // Knowledge level mismatch
  if (dna?.analysis_data?.audiencePsychology && persona?.knowledge_level) {
    const dnaAudienceSuggests = dna.analysis_data.audiencePsychology.toLowerCase();
    const personaLevel = persona.knowledge_level.toLowerCase();

    if (dnaAudienceSuggests.includes('expert') && (personaLevel === 'beginner' || personaLevel === 'intermediate')) {
      conflicts.push('DNA targets expert audience but Persona has intermediate/beginner knowledge');
    }
  }

  // Platform mismatch
  if (dna?.tone && persona?.platform) {
    const isFormal = dna.tone.toLowerCase().includes('formal') ||
                     dna.tone.toLowerCase().includes('professional');
    const isShortForm = ['tiktok', 'instagram', 'shorts', 'reels'].includes(persona.platform.toLowerCase());

    if (isFormal && isShortForm) {
      conflicts.push(`DNA has formal tone but Persona platform is ${persona.platform} (requires casual, fast-paced style)`);
    }
  }

  return conflicts;
};

// Generate resolution strategy text for injection into prompts
export const generateResolutionStrategy = (dna: any, persona: any): string => {
  const conflicts = detectConflicts(dna, persona);

  if (conflicts.length === 0) {
    return `<alignment_status>
✅ No major conflicts detected between DNA and Persona.
Strategy: Follow DNA structure with Persona voice.
</alignment_status>`;
  }

  let strategy = `<conflict_resolution_strategy>

<detected_conflicts>
${conflicts.map((c, i) => `${i + 1}. ${c}`).join('\n')}
</detected_conflicts>

<resolution_actions>
`;

  conflicts.forEach((conflict, i) => {
    if (conflict.includes('vocabulary') || conflict.includes('beginner')) {
      strategy += `${i + 1}. SIMPLIFY VOCABULARY (70% Persona priority)
   - Use plain language for technical concepts
   - Maintain DNA's logical progression and structure
   - Explain jargon when first introduced\n\n`;
    } else if (conflict.includes('tone') && !conflict.includes('platform')) {
      strategy += `${i + 1}. ADAPT TONE (60% Persona, 40% DNA)
   - Use Persona's preferred tone (${persona.preferred_tone || 'not specified'})
   - Keep DNA's energy and confidence level
   - Blend: Casual words with authoritative insights\n\n`;
    } else if (conflict.includes('platform')) {
      strategy += `${i + 1}. PLATFORM OVERRIDE
   - Platform requirements take precedence: ${persona.platform} conventions
   - Adjust pacing and tone to platform norms
   - Keep DNA structure if compatible with platform\n\n`;
    } else if (conflict.includes('expert') && conflict.includes('knowledge')) {
      strategy += `${i + 1}. KNOWLEDGE LEVEL ADJUSTMENT (60% Persona)
   - Simplify content to match Persona's knowledge level
   - Use examples and analogies for complex concepts
   - Maintain DNA's structural progression\n\n`;
    }
  });

  strategy += `</resolution_actions>

<application_instruction>
Apply these resolutions consistently throughout the entire script. Do not switch strategies mid-content.
</application_instruction>

</conflict_resolution_strategy>`;

  return strategy;
};

// Build complete conflict resolution context for prompts
export const buildConflictResolutionContext = (dna: any, persona: any): string => {
  if (!dna || !persona) {
    return '';
  }

  return `\n\n${DNA_PERSONA_CONFLICT_MATRIX}\n\n${generateResolutionStrategy(dna, persona)}`;
};
