import { callOpenRouter, extractJsonFromResponse, ChatMessage } from "./openrouter";

export interface AnalyzedPersona {
  // Basic Info
  name: string;
  ageRange: string;
  knowledgeLevel: string;
  targetCountry?: string; // Target audience country/region

  // Content Consumption Patterns
  contentConsumption?: {
    attentionSpan: 'short' | 'medium' | 'long';
    engagementTriggers: Array<'data-driven' | 'story-driven' | 'emotion-driven' | 'authority-driven'>;
    learningStyle: Array<'visual-heavy' | 'step-by-step' | 'conceptual-first' | 'example-based'>;
    preferredContentLength: string;
  };

  // Psychology
  painPoints: string[] | Array<{ text: string; intensity: 'high' | 'medium' | 'low'; evidence: string }>;
  motivations?: string[] | Array<{ text: string; frequency: 'high' | 'medium' | 'low'; source: string }>;

  // Trust Profile (MỚI - trigger tin tưởng)
  // Cho phép custom trust types ngoài 4 loại cơ bản (data/story/authority/social-proof)
  trustProfile?: {
    primary: string; // VD: 'data', 'story', 'visual-proof', 'experiential', 'celebrity-endorsement'
    secondary?: string;
    reasoning: string; // Tại sao họ tin loại proof này
  };

  // Objection Timeline (MỚI - timeline phản đối theo word count)
  objectionTimeline?: Array<{
    atWordCount: number; // VD: 200, 450, 800
    objection: string; // Objection cụ thể
    counterTactic: string; // Cách phản bác
  }>;

  // Action Barriers (MỚI - rào cản hành động)
  actionBarriers?: Array<'time-constraint' | 'skepticism' | 'cost-concern' | 'information-overload' | 'trust-issues' | 'technical-difficulty'>;

  // Content Preferences & Tone
  preferredTone: string;
  vocabulary: string;
  platform: string;
  description: string;
  contentPreferences?: string[];

  // Source tracking
  contentSources?: Array<{
    id?: string;
    script?: string;
    youtubeUrl?: string;
    comments?: string;
  }>;
}

const ANALYZE_PERSONA_PROMPT = `You are an expert audience researcher and psychologist. Your task is to reverse-engineer a target audience persona from the content they consume and the feedback they provide.

<task>
Analyze the provided transcript and comments to build a comprehensive audience persona that enables precise content customization.
</task>

<data_sources>
If Manual Description provided: Use it as the foundational base
If Transcript provided: Analyze complexity, tone, subject matter to understand audience interests
If Comments provided: Extract pain points, objections, questions, and resonance patterns

Look for behavioral patterns:
- Specific complaints or frustrations (Pain Points)
- Types of questions asked (Knowledge Level)
- Language style and formality (Vocabulary Preferences)
- Engagement patterns (Content Consumption Behavior)
</data_sources>

<analysis_dimensions>

1. DEMOGRAPHIC INFERENCE (from comments and behavior):
   Extract clues about:
   - Age bracket: Slang usage, cultural references, life stage mentions
     Examples: "in college" (18-24), "my kids" (30-50), "retirement" (55+)
   - Location hints: Timezone patterns, cultural mentions, location-specific references
   - Occupation/Industry: Topic engagement patterns, professional terminology
   - Digital fluency: Emoji usage, meme references, platform-native behavior
     * low: Basic text, formal style, minimal slang
     * medium: Mixed formal/casual, some emoji use
     * high: Heavy meme culture, platform-specific language, rapid trend adoption

2. KNOWLEDGE PROFILE (3-dimensional assessment):

   A. Domain Knowledge (1-5 scale):
      1 = Complete beginner (needs basic definitions, foundational concepts)
      2 = Novice (understands basics, learning fundamentals)
      3 = Intermediate (grasps concepts, lacks deep expertise)
      4 = Advanced (strong understanding, can discuss nuances)
      5 = Expert (uses advanced terminology naturally, teaches others)

   B. Engagement Depth (1-5 scale):
      1 = Casual viewer (surface interest, passive consumption)
      2 = Light learner (some curiosity, occasional deeper dive)
      3 = Invested learner (asks follow-up questions, seeks understanding)
      4 = Active researcher (reads deeply, cross-references sources)
      5 = Deep researcher (comprehensive exploration, contributes insights)

   C. Skepticism Level (1-5 scale):
      1 = Highly trusting (accepts claims at face value)
      2 = Somewhat trusting (minimal verification needed)
      3 = Moderately skeptical (wants some evidence and reasoning)
      4 = Very skeptical (demands multiple sources, rigorous proof)
      5 = Extremely skeptical (challenges everything, requires peer-reviewed data)

   Provide reasoning for each score based on comment evidence.

3. CONTENT CONSUMPTION PATTERNS:

   A. Attention Span (infer from comment length and engagement depth):
      * short: Quick scrollers, prefer bite-sized info (<3min optimal)
      * medium: Standard attention span, comfortable with 3-8min content
      * long: Deep divers, willing to invest 8min+ for quality content

   B. Engagement Triggers (what motivates them to comment/engage):
      * data-driven: Responds to statistics, studies, hard numbers
      * story-driven: Engages with narratives, personal case studies
      * emotion-driven: Reacts to emotional appeals, relatable struggles
      * authority-driven: Values expert credentials, citations, proof

   C. Learning Style (how they prefer information delivery):
      * visual-heavy: Prefers diagrams, charts, visual demonstrations
      * step-by-step: Wants sequential, structured instructions
      * conceptual-first: Likes big-picture understanding before details
      * example-based: Learns best through concrete examples and case studies

4. PAIN POINTS PRIORITIZATION:
   Analyze comment sentiment to extract and rank pain points by:
   - Intensity: high (mentioned repeatedly with strong emotion), medium (consistent mention), low (occasional concern)
   - Evidence: "Mentioned in 15+ comments" or "Implied from frustration pattern in Y discussion"

5. MOTIVATIONS WITH CONTEXT:
   For motivations: What drives them to watch/engage?
   - Frequency: high (dominant driver), medium (common reason), low (occasional motivator)
   - Source: "Positive comments analysis" or "Success story responses"

6. TRUST PROFILE ANALYSIS (MỚI):
   Determine what type of proof they trust most. Choose from common types OR create a custom type:

   Common types:
   - data: Responds to statistics, studies, numbers (e.g., "87% success rate")
   - story: Engages with personal narratives, case studies, testimonials
   - authority: Values expert credentials, citations, institutional backing
   - social-proof: Influenced by community validation, reviews, popularity

   Custom types (if audience doesn't fit above):
   - visual-proof: Needs to see it to believe it (before/after images, demos)
   - experiential: Must try it themselves, values hands-on experience
   - celebrity-endorsement: Trusts famous figures, influencer recommendations
   - scientific-method: Needs peer-reviewed research, controlled experiments
   - community-driven: Trusts grassroots movements, collective wisdom
   - Or create your own based on comment analysis

   Evidence:
   - What comments get most positive engagement?
   - What type of content do they ask for more of?
   - Do they challenge claims that lack specific proof types?

   Return as string (e.g., "data", "visual-proof", "celebrity-endorsement")

7. OBJECTION TIMELINE (MỚI):
   Map objections to word count milestones where they likely arise:
   - Early (0-200 words): Skepticism about credibility, "Who is this person?"
   - Middle (200-500 words): Doubt about applicability, "Will this work for me?"
   - Late (500+ words): Hesitation about action, "Is this worth my time/money?"

   For each objection:
   - atWordCount: Where it emerges (based on content flow)
   - objection: Specific skeptical thought
   - counterTactic: How to pre-empt or address it

8. ACTION BARRIERS (MỚI):
   Why they don't take action after consuming content:
   - time-constraint: "I don't have time for this"
   - skepticism: "I don't believe this will work"
   - cost-concern: "Too expensive / not worth it"
   - information-overload: "Too complex, don't know where to start"
   - trust-issues: "Can I trust this source?"
   - technical-difficulty: "Sounds too hard for my skill level"

</analysis_dimensions>

<output_schema>
Return ONLY valid JSON (no markdown, no explanations):

{
  "name": "Descriptive persona name capturing essence (e.g., 'Frustrated Beginner Investor', 'Skeptical Health Optimizer', 'Time-Starved Parent Entrepreneur')",

  "ageRange": "22-35 (evidence: mentions of college life, early career stress, Gen Z slang usage)",

  "knowledgeLevel": "beginner|intermediate|advanced",

  "targetCountry": "USA | UK | Vietnam | Japan | Korea | India | Germany | France | Other (Inferred from timezone patterns, currency mentions, cultural references, language patterns, location-specific mentions)",

  "contentConsumption": {
    "attentionSpan": "medium",
    "engagementTriggers": ["data-driven", "story-driven"],
    "learningStyle": ["step-by-step", "example-based"],
    "preferredContentLength": "5-7 minute videos with clear structure and actionable takeaways"
  },

  "painPoints": [
    {
      "text": "Can't afford expensive courses or tools",
      "intensity": "high",
      "evidence": "Mentioned in 30+ comments with strong emotional language"
    },
    {
      "text": "Overwhelmed by conflicting advice online",
      "intensity": "medium",
      "evidence": "Recurring theme in 'confused' comment cluster"
    }
  ],

  "preferredTone": "casual|formal|inspirational|educational|humorous|direct|empathetic",

  "vocabulary": "Conversational with occasional technical terms. Avoid jargon overload. Explain concepts in plain language first.",

  "platform": "YouTube",

  "description": "Tech-savvy early career professional seeking actionable advice without high costs. Values clear, step-by-step guidance backed by data. Moderately skeptical of overpromises but open to learning. Prefers medium-length content that respects their time constraints.",

  "contentPreferences": [
    "Actionable tutorials over theory",
    "Real-world examples and case studies",
    "Data-backed recommendations"
  ],

  "motivations": [
    {
      "text": "Career advancement and skill development",
      "frequency": "high",
      "source": "Positive engagement on career growth topics"
    },
    {
      "text": "Financial independence",
      "frequency": "medium",
      "source": "Comments on money-saving tips and side hustles"
    }
  ],

  "trustProfile": {
    "primary": "data|story|authority|social-proof",
    "secondary": "data|story|authority|social-proof (optional)",
    "reasoning": "Why they trust this type of proof (evidence from comments/behavior)"
  },

  "objectionTimeline": [
    {
      "atWordCount": 200,
      "objection": "This sounds too good to be true",
      "counterTactic": "Show concrete data + real case study"
    },
    {
      "atWordCount": 450,
      "objection": "Will this work for someone like me?",
      "counterTactic": "Address specific persona pain point with relatable example"
    }
  ],

  "actionBarriers": ["time-constraint", "skepticism", "cost-concern", "information-overload", "trust-issues", "technical-difficulty"]
}
</output_schema>

<validation_rules>
Flag potential inconsistencies:
- If knowledgeLevel="beginner" BUT vocabulary includes "advanced technical jargon" → Add note about mismatch
- If preferredTone="formal" BUT platform="TikTok" → Flag platform-tone mismatch
- Ensure painPoints align with knowledgeLevel (beginners and experts have different pain points)
</validation_rules>

<quality_standards>
Your persona should:
1. Be actionable: Provide enough detail for content customization
2. Be evidence-based: Every claim rooted in transcript/comment analysis
3. Be coherent: All dimensions should paint a consistent picture
4. Be specific: Avoid generic descriptors like "wants value" - specify WHAT value and WHY
5. Be realistic: Represent an actual human psychology, not an idealized archetype
</quality_standards>`;

export const analyzePersona = async (
  apiKey: string,
  model: string = "google/gemini-3-flash-preview",
  description?: string,
  transcript?: string,
  comments?: string
): Promise<AnalyzedPersona> => {
  if (!apiKey) {
    throw new Error("OpenRouter API Key is required");
  }

  if (!description && !transcript && !comments) {
    throw new Error("At least one of description, transcript, or comments must be provided");
  }

  let userMessage = "";
  if (description) {
    userMessage += `<manual_description>\n${description}\n</manual_description>\n\n`;
  }
  if (transcript) {
    userMessage += `<transcript>\n${transcript}\n</transcript>\n\n`;
  }
  if (comments) {
    userMessage += `<comments>\n${comments}\n</comments>\n\n`;
  }

  userMessage += "Analyze the above and extract a comprehensive audience persona.";

  const messages: ChatMessage[] = [
    { role: "system", content: ANALYZE_PERSONA_PROMPT },
    { role: "user", content: userMessage }
  ];

  const response = await callOpenRouter(messages, apiKey, model);
  return extractJsonFromResponse(response);
};
