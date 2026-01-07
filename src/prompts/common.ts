export const getLanguageInstruction = (lang?: string) => {
    if (!lang || lang === "en") return "";

    const langMap: Record<string, string> = {
        'vi': 'Vietnamese',
        'es': 'Spanish',
        'fr': 'French',
        'ja': 'Japanese',
        'ko': 'Korean'
    };
    const langName = langMap[lang] || 'English';
    return `\n\nCRITICAL OUTPUT RULE: The final content MUST be written in ${langName}. Translate any structural logic into natural-sounding ${langName}.`;
};

// Common instructions for all prompts
export const SYSTEM_INSTRUCTION_SUFFIX = `
⚠️ TTS-OPTIMIZED OUTPUT (CRITICAL):
- NO markdown symbols: no *, #, **, _, ~, \`, etc.
- NO section titles or headers in the output
- NO film/video directions: no [B-roll], [Cut to], [VISUAL], (pause), etc.
- NO parenthetical notes or brackets of any kind
- ONLY clean, speakable text that can be read aloud naturally
- Write as if you are speaking directly to the audience
`;
