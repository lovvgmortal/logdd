import { useState, useEffect } from "react";
import {
    ArrowLeft, Download, Brain, Target, MessageSquare, Zap, AlertTriangle,
    Shield, Sparkles, XCircle, FileText, Music, Mic, ChevronDown, ChevronRight,
    Plus, Trash2, Save, Loader2, RefreshCw, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DNA, DNAAnalysisData } from "@/hooks/useDnas";
import { ExtractedDNA } from "@/lib/dna-extractor";
import { FeatureGate } from "@/components/subscription";
import { useLanguage } from "@/hooks/useLanguage";

// =============================================================================
// UNIFIED DNA VIEW COMPONENT
// Merges functionality from DNAPreview (preview mode) + DNADetailView (detail mode)
// =============================================================================

interface DNAViewProps {
    // Mode: "preview" = just extracted, not saved yet | "detail" = saved DNA from library
    mode: "preview" | "detail";

    // Data sources - one of these will be provided based on mode
    extractedDna?: ExtractedDNA;  // For preview mode
    savedDna?: DNA;               // For detail mode

    // Common navigation
    onBack: () => void;

    // Preview mode actions
    onSave?: (dna: ExtractedDNA) => void;
    saving?: boolean;

    // Detail mode actions  
    onUpdate?: (updates: Partial<DNA>) => Promise<DNA | null>;
    onExport?: (dna: DNA) => void;
    onEvolve?: (newContent: {
        viralVideos?: Array<{ transcript: string; url?: string }>;
        flopVideos?: Array<{ transcript: string; url?: string }>;
    }) => Promise<{ success: boolean; changesSummary?: string[] }>;
}

// Internal normalized format for editing
interface NormalizedDNA {
    name: string;
    niche: string;
    targetWordCount: number;
    audiencePsychology: string;

    // NEW: Consolidated voiceProfile (replaces linguisticFingerprint + pacingAndTone)
    voiceProfile?: {
        personaRole: string;
        toneAnalysis: string;
        syntaxPatterns?: string;
        signatureKeywords: string[];
        globalPacing: string;
    };

    // Legacy fields for backward compatibility
    linguisticFingerprint?: {
        personaRole: string;
        toneAnalysis: string;
        signatureKeywords: string[];
    };
    hookAngle: {
        angleCategory: string;
        deconstruction: string;
    };
    pacingAndTone?: {
        pacing: string;
    };

    emotionalArc: Array<{ section: string; emotion: string }>;
    structuralSkeleton: Array<{
        title: string;
        wordCount: number;
        tone?: string;
        pacing?: string;
        contentFocus?: string;
        microHook?: string;
        openLoop?: string;
        closesLoop?: string;
        viralTriggers?: string;
        mustInclude?: string[];
        audienceInteraction?: string;
        audienceValue?: string;
        antiPattern?: string;
    }>;
    highDopamine: string[];
    confusionPoints: string[];
    objections: string[];

    // NEW: Consolidated patterns with tags
    patterns?: Array<{ pattern: string; tag: 'safe' | 'experimental' }>;

    // Legacy pattern fields
    corePatterns?: string[];
    viralXFactors?: string[];
    flopAvoidance: string[];
    hook_examples: string[];

    // NEW: Persuasion Flow
    persuasionFlow?: {
        framework: 'PAS' | 'BAB' | 'Story-Based' | 'Custom';
        proofSequence: Array<'personal-story' | 'data' | 'case-study' | 'expert-quote' | 'social-proof'>;
        objectionHandling: {
            placement: string;
            mainObjection: string;
            counterTactic: string;
        };
        logicalProgression: string[];
    };

    // NEW: Retention Hooks (word count based)
    retentionHooks?: Array<{
        atWordCount: number;
        technique: string;
        example: string;
    }>;

    // NEW: Transitions
    transitions?: Array<{
        from: string;
        to: string;
        formula: string;
        example?: string;
    }>;

    // Legacy fields for detail mode
    retention_tactics?: string[];
    x_factors?: string[];
    source_url?: string;
    source_transcript?: string;
}

// Normalize ExtractedDNA to internal format
function normalizeExtractedDna(dna: ExtractedDNA): NormalizedDNA {
    return {
        name: dna.name || "",
        niche: dna.niche || "",
        targetWordCount: dna.targetWordCount || 0,
        audiencePsychology: dna.audiencePsychology || "",

        // NEW: voiceProfile (if available)
        voiceProfile: dna.voiceProfile,

        // Legacy fields for backward compatibility
        linguisticFingerprint: dna.linguisticFingerprint || { personaRole: "", toneAnalysis: "", signatureKeywords: [] },
        hookAngle: dna.hookAngle || { angleCategory: "", deconstruction: "" },
        pacingAndTone: dna.pacingAndTone || { pacing: "" },

        emotionalArc: [],
        structuralSkeleton: dna.structuralSkeleton || [],
        highDopamine: dna.highDopamine || [],
        confusionPoints: dna.confusionPoints || [],
        objections: dna.objections || [],

        // NEW: Consolidated patterns (if available)
        patterns: dna.patterns,

        // Legacy pattern fields
        corePatterns: dna.corePatterns || [],
        viralXFactors: dna.viralXFactors || [],
        flopAvoidance: [],
        hook_examples: dna.hook_examples || [],

        // NEW fields - initialize with defaults if not present
        persuasionFlow: dna.persuasionFlow || {
            framework: 'Custom',
            proofSequence: [],
            objectionHandling: { placement: '', mainObjection: '', counterTactic: '' },
            logicalProgression: []
        },
        retentionHooks: dna.retentionHooks || [],
        transitions: dna.transitions || [],
    };
}

// Normalize saved DNA to internal format
function normalizeSavedDna(dna: DNA): NormalizedDNA {
    const analysis = dna.analysis_data || {};
    return {
        name: dna.name || "",
        niche: dna.niche || "",
        targetWordCount: analysis.targetWordCount || 0,
        audiencePsychology: analysis.audiencePsychology || "",

        // NEW: voiceProfile (if available)
        //voiceProfile: analysis.voiceProfile,

        // Legacy fields for backward compatibility
        linguisticFingerprint: analysis.linguisticFingerprint || { personaRole: "", toneAnalysis: "", signatureKeywords: [] },
        hookAngle: analysis.hookAngle || { angleCategory: dna.hook_type || "", deconstruction: "" },
        pacingAndTone: analysis.pacingAndTone || { pacing: dna.pacing || "" },

        emotionalArc: analysis.emotionalArc || [],
        structuralSkeleton: analysis.structuralSkeleton || [],
        highDopamine: analysis.highDopamine || [],
        confusionPoints: analysis.confusionPoints || [],
        objections: analysis.objections || [],

        // NEW: Consolidated patterns (if available)
        //patterns: analysis.patterns,

        // Legacy pattern fields
        corePatterns: analysis.corePatterns || dna.patterns || [],
        viralXFactors: analysis.viralXFactors || dna.x_factors || [],
        flopAvoidance: analysis.flopAvoidance || [],
        hook_examples: dna.hook_examples || [],

        // NEW fields - initialize with defaults if not present
        // persuasionFlow: analysis.persuasionFlow || {
        //     framework: 'Custom',
        //     proofSequence: [],
        //     objectionHandling: { placement: '', mainObjection: '', counterTactic: '' },
        //     logicalProgression: []
        // },
        // retentionHooks: analysis.retentionHooks || [],
        // transitions: analysis.transitions || [],

        // Keep legacy fields for detail mode
        retention_tactics: dna.retention_tactics || [],
        x_factors: dna.x_factors || [],
        source_url: dna.source_url || undefined,
        source_transcript: dna.source_transcript || undefined,
    };
}

// Convert back to ExtractedDNA for save action (preview mode)
function denormalizeToExtractedDna(normalized: NormalizedDNA): ExtractedDNA {
    return {
        name: normalized.name,
        niche: normalized.niche,
        targetWordCount: normalized.targetWordCount,
        audiencePsychology: normalized.audiencePsychology,

        // Use voiceProfile if available, otherwise fallback to legacy fields
        voiceProfile: normalized.voiceProfile || {
            personaRole: normalized.linguisticFingerprint?.personaRole || "",
            toneAnalysis: normalized.linguisticFingerprint?.toneAnalysis || "",
            signatureKeywords: normalized.linguisticFingerprint?.signatureKeywords || [],
            globalPacing: normalized.pacingAndTone?.pacing || "medium",
            syntaxPatterns: ""
        },

        // Legacy fields for backward compatibility
        linguisticFingerprint: normalized.linguisticFingerprint,
        hookAngle: normalized.hookAngle,
        pacingAndTone: normalized.pacingAndTone,

        structuralSkeleton: normalized.structuralSkeleton,
        highDopamine: normalized.highDopamine,
        confusionPoints: normalized.confusionPoints,
        objections: normalized.objections,

        // Use consolidated patterns if available, otherwise use legacy
        patterns: normalized.patterns || [
            ...(normalized.corePatterns || []).map(p => ({ pattern: p, tag: 'safe' as const })),
            ...(normalized.viralXFactors || []).map(p => ({ pattern: p, tag: 'experimental' as const }))
        ],

        // Legacy pattern fields
        corePatterns: normalized.corePatterns,
        viralXFactors: normalized.viralXFactors,
        //flopAvoidance: normalized.flopAvoidance,
        hook_examples: normalized.hook_examples,

        // NEW fields
        persuasionFlow: normalized.persuasionFlow,
        retentionHooks: normalized.retentionHooks,
        transitions: normalized.transitions,

        // Friction points (consolidated from confusionPoints + objections)
        frictionPoints: [
            ...(normalized.confusionPoints || []).map(point => ({
                type: 'confusion' as const,
                point: point,
                solution: undefined
            })),
            ...(normalized.objections || []).map(obj => ({
                type: 'objection' as const,
                point: obj,
                solution: undefined
            }))
        ]
    };
}

export function DNAView({
    mode,
    extractedDna,
    savedDna,
    onBack,
    onSave,
    saving,
    onUpdate,
    onExport,
    onEvolve
}: DNAViewProps) {
    const { t } = useLanguage();

    // Initialize from appropriate source
    const initialData = mode === "preview" && extractedDna
        ? normalizeExtractedDna(extractedDna)
        : mode === "detail" && savedDna
            ? normalizeSavedDna(savedDna)
            : null;

    const [editedDna, setEditedDna] = useState<NormalizedDNA>(initialData!);
    const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Evolution state (detail mode only)
    const [showEvolution, setShowEvolution] = useState(false);
    const [evolving, setEvolving] = useState(false);
    const [evolutionChanges, setEvolutionChanges] = useState<string[]>([]);
    const [viralTranscript, setViralTranscript] = useState("");
    const [viralUrl, setViralUrl] = useState("");
    const [flopTranscript, setFlopTranscript] = useState("");
    const [flopUrl, setFlopUrl] = useState("");

    // Sync when source data changes
    useEffect(() => {
        if (mode === "preview" && extractedDna) {
            setEditedDna(normalizeExtractedDna(extractedDna));
        } else if (mode === "detail" && savedDna) {
            setEditedDna(normalizeSavedDna(savedDna));
        }
    }, [mode, extractedDna, savedDna]);

    // Generic field update
    const updateField = <K extends keyof NormalizedDNA>(field: K, value: NormalizedDNA[K]) => {
        setEditedDna(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    // Nested field update
    const updateNestedField = <K extends keyof NormalizedDNA>(
        field: K,
        nestedField: string,
        value: unknown
    ) => {
        setEditedDna(prev => ({
            ...prev,
            [field]: { ...(prev[field] as Record<string, unknown>), [nestedField]: value }
        }));
        setHasChanges(true);
    };

    // Array helpers
    const addArrayItem = (field: keyof NormalizedDNA, defaultValue: string = "") => {
        const currentArray = editedDna[field] as string[];
        updateField(field, [...currentArray, defaultValue] as NormalizedDNA[keyof NormalizedDNA]);
    };

    const updateArrayItem = (field: keyof NormalizedDNA, index: number, value: string) => {
        const currentArray = [...(editedDna[field] as string[])];
        currentArray[index] = value;
        updateField(field, currentArray as NormalizedDNA[keyof NormalizedDNA]);
    };

    const removeArrayItem = (field: keyof NormalizedDNA, index: number) => {
        const currentArray = (editedDna[field] as string[]).filter((_, i) => i !== index);
        updateField(field, currentArray as NormalizedDNA[keyof NormalizedDNA]);
    };

    const toggleSection = (index: number) => {
        setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // Calculate total words from skeleton
    const totalWords = editedDna.structuralSkeleton.reduce((acc, section) => {
        return acc + (section.wordCount || 0);
    }, 0);

    // Handle save based on mode
    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (mode === "preview" && onSave) {
                onSave(denormalizeToExtractedDna(editedDna));
            } else if (mode === "detail" && onUpdate && savedDna) {
                const analysisData: DNAAnalysisData = {
                    targetWordCount: editedDna.targetWordCount,
                    audiencePsychology: editedDna.audiencePsychology,
                    linguisticFingerprint: editedDna.linguisticFingerprint,
                    hookAngle: editedDna.hookAngle,
                    pacingAndTone: editedDna.pacingAndTone,
                    emotionalArc: editedDna.emotionalArc,
                    structuralSkeleton: editedDna.structuralSkeleton,
                    highDopamine: editedDna.highDopamine,
                    confusionPoints: editedDna.confusionPoints,
                    objections: editedDna.objections,
                    corePatterns: editedDna.corePatterns,
                    viralXFactors: editedDna.viralXFactors,
                    flopAvoidance: editedDna.flopAvoidance,
                };

                await onUpdate({
                    name: editedDna.name,
                    niche: editedDna.niche,
                    hook_examples: editedDna.hook_examples,
                    //patterns: editedDna.patterns,
                    retention_tactics: editedDna.retention_tactics,
                    x_factors: editedDna.x_factors,
                    analysis_data: analysisData,
                });
                setHasChanges(false);
            }
        } finally {
            setIsSaving(false);
        }
    };

    // Handle evolution (detail mode only)
    const handleEvolve = async () => {
        if (!onEvolve || (!viralTranscript && !flopTranscript)) return;

        setEvolving(true);
        setEvolutionChanges([]);

        const result = await onEvolve({
            viralVideos: viralTranscript ? [{ transcript: viralTranscript, url: viralUrl }] : undefined,
            flopVideos: flopTranscript ? [{ transcript: flopTranscript, url: flopUrl }] : undefined,
        });

        setEvolving(false);
        if (result.success && result.changesSummary) {
            setEvolutionChanges(result.changesSummary);
            setViralTranscript("");
            setViralUrl("");
            setFlopTranscript("");
            setFlopUrl("");
            // Refresh data from parent
            if (savedDna) {
                setEditedDna(normalizeSavedDna(savedDna));
            }
        }
    };

    const isPreview = mode === "preview";
    const effectiveSaving = isPreview ? saving : isSaving;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
                <div className="flex items-center justify-between p-4 max-w-[1600px] mx-auto">
                    <Button variant="ghost" onClick={onBack} className="gap-2">
                        {isPreview ? <X className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        {isPreview ? t('common.cancel') : t('common.back')}
                    </Button>

                    <Input
                        value={editedDna.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="max-w-md text-center text-lg font-semibold bg-transparent border-none focus-visible:ring-1"
                        placeholder={t('dnaLab.manual.namePlaceholder')}
                    />

                    <div className="flex gap-2">
                        {/* Evolution button - detail mode only */}
                        {!isPreview && onEvolve && (
                            <FeatureGate feature="dna_evolution" hideCompletely>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEvolution(!showEvolution)}
                                    className="gap-2 border-green-500/50 text-green-500 hover:bg-green-500/10"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    {t('dnaLab.view.evolution')}
                                </Button>

                            </FeatureGate>
                        )}
                        {/* Export button - detail mode only */}
                        {!isPreview && onExport && savedDna && (
                            <Button variant="outline" onClick={() => onExport(savedDna)} className="gap-2">
                                <Download className="h-4 w-4" />
                                {t('common.export')}
                            </Button>

                        )}
                        {/* Save button */}
                        {(isPreview || hasChanges) && (
                            <Button onClick={handleSave} disabled={effectiveSaving} className="gap-2">
                                <Save className="h-4 w-4" />
                                {isPreview ? t('dnaLab.view.saveChanges') : t('common.save')}
                            </Button>

                        )}
                    </div>
                </div>
            </div>

            {/* Evolution Panel - detail mode only */}
            {!isPreview && showEvolution && onEvolve && (
                <div className="max-w-[1600px] mx-auto p-4 border-b bg-green-500/5">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold flex items-center gap-2 text-green-500">
                                <RefreshCw className="h-4 w-4" />
                                {t('dnaLab.view.evolution')}
                            </Label>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowEvolution(false);
                                    setEvolutionChanges([]);
                                }}
                            >
                                ✕ {t('common.close')}
                            </Button>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Viral Video Input */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-green-500">
                                        📈 {t('dnaLab.view.viralVideo')}
                                    </Label>

                                    <Input
                                        value={viralUrl}
                                        onChange={(e) => setViralUrl(e.target.value)}
                                        placeholder={t('dnaLab.view.videoUrl')}
                                        className="bg-muted/50"
                                    />
                                    <Textarea
                                        value={viralTranscript}
                                        onChange={(e) => setViralTranscript(e.target.value)}
                                        placeholder={t('dnaLab.view.pasteTranscript')}
                                        className="min-h-[120px] bg-muted/50 resize-none"
                                    />

                                </GlassCardContent>
                            </GlassCard>

                            {/* Flop Video Input */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-red-400">
                                        📉 {t('dnaLab.view.flopVideo')}
                                    </Label>

                                    <Input
                                        value={flopUrl}
                                        onChange={(e) => setFlopUrl(e.target.value)}
                                        placeholder={t('dnaLab.view.videoUrl')}
                                        className="bg-muted/50"
                                    />
                                    <Textarea
                                        value={flopTranscript}
                                        onChange={(e) => setFlopTranscript(e.target.value)}
                                        placeholder={t('dnaLab.view.pasteTranscript')}
                                        className="min-h-[120px] bg-muted/50 resize-none"
                                    />

                                </GlassCardContent>
                            </GlassCard>
                        </div>

                        {/* Evolution Button */}
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={handleEvolve}
                                disabled={evolving || (!viralTranscript && !flopTranscript)}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                {evolving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t('dnaLab.view.evolving')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        {t('dnaLab.view.evolveBtn')}
                                    </>
                                )}

                            </Button>
                            <p className="text-xs text-muted-foreground">
                                {t('dnaLab.view.aiLearnHint')}
                            </p>
                        </div>

                        {/* Evolution Results */}
                        {evolutionChanges.length > 0 && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <Label className="text-sm font-semibold text-green-500 mb-2 block">
                                    ✅ {t('dnaLab.view.evolutionComplete')} - {evolutionChanges.length} {t('dnaLab.view.changesMade')}:
                                </Label>

                                <ul className="space-y-1">
                                    {evolutionChanges.map((change, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="text-green-500">•</span>
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        {/* My Notes / Constraints */}
                        <GlassCard>
                            <GlassCardContent className="p-4 space-y-3">
                                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                                    <FileText className="h-3 w-3 text-primary" /> {t('dnaLab.view.myNotes')}
                                </Label>

                                <Textarea
                                    placeholder={t('dnaLab.view.myNotesPlaceholder')}
                                    className="min-h-[80px] bg-muted/50 resize-none"
                                />

                            </GlassCardContent>
                        </GlassCard>

                        {/* Niche / Category */}
                        <GlassCard>
                            <GlassCardContent className="p-4 space-y-3">
                                <Label className="text-xs uppercase text-green-500 flex items-center gap-1.5">
                                    <Target className="h-3 w-3" /> {t('dnaLab.view.niche')}
                                </Label>

                                <Input
                                    value={editedDna.niche}
                                    onChange={(e) => updateField("niche", e.target.value)}
                                    placeholder={t('dnaLab.view.nichePlaceholder')}
                                    className="bg-muted/50"
                                />

                            </GlassCardContent>
                        </GlassCard>

                        {/* Target Word Count */}
                        <GlassCard>
                            <GlassCardContent className="p-4 space-y-3">
                                <Label className="text-xs uppercase text-red-500 flex items-center gap-1.5">
                                    <FileText className="h-3 w-3" /> {t('dnaLab.view.targetWordCount')}
                                </Label>

                                <Input
                                    type="number"
                                    value={editedDna.targetWordCount || ""}
                                    onChange={(e) => updateField("targetWordCount", parseInt(e.target.value) || 0)}
                                    placeholder={t('dnaLab.view.wordCountPlaceholder')}
                                    className="bg-muted/50"
                                />

                                <p className="text-xs text-muted-foreground">
                                    {t('dnaLab.view.calcFromViral')}
                                </p>

                            </GlassCardContent>
                        </GlassCard>

                        {/* Linguistic Fingerprint */}
                        <GlassCard>
                            <GlassCardContent className="p-4 space-y-4">
                                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                                    <Mic className="h-3 w-3" /> {t('dnaLab.view.linguisticFingerprint')}
                                </Label>


                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">{t('dnaLab.view.personaRole')}</Label>
                                    <Input
                                        value={editedDna.linguisticFingerprint.personaRole}
                                        onChange={(e) => updateNestedField("linguisticFingerprint", "personaRole", e.target.value)}
                                        placeholder={t('dnaLab.view.personaRolePlaceholder')}
                                        className="bg-muted/50"
                                    />
                                </div>


                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">{t('dnaLab.view.toneAnalysis')}</Label>
                                    <Textarea
                                        value={editedDna.linguisticFingerprint.toneAnalysis}
                                        onChange={(e) => updateNestedField("linguisticFingerprint", "toneAnalysis", e.target.value)}
                                        placeholder={t('dnaLab.view.toneAnalysisPlaceholder')}
                                        className="min-h-[80px] bg-muted/50 resize-none"
                                    />
                                </div>


                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">{t('dnaLab.view.signatureKeywords')}</Label>
                                    <Input
                                        value={editedDna.linguisticFingerprint.signatureKeywords.join(", ")}
                                        onChange={(e) => updateNestedField("linguisticFingerprint", "signatureKeywords", e.target.value.split(",").map(s => s.trim()))}
                                        placeholder={t('dnaLab.view.signatureKeywordsPlaceholder')}
                                        className="bg-muted/50"
                                    />
                                </div>

                            </GlassCardContent>
                        </GlassCard>

                        {/* Hook Angle */}
                        <GlassCard>
                            <GlassCardContent className="p-4 space-y-4">
                                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                                    <Zap className="h-3 w-3 text-green-500" /> {t('dnaLab.view.hookAngle')}
                                </Label>


                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">{t('dnaLab.view.angleCategory')}</Label>
                                    <Input
                                        value={editedDna.hookAngle.angleCategory}
                                        onChange={(e) => updateNestedField("hookAngle", "angleCategory", e.target.value)}
                                        placeholder={t('dnaLab.view.angleCategoryPlaceholder')}
                                        className="bg-muted/50"
                                    />
                                </div>


                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">{t('dnaLab.view.deconstruction')}</Label>
                                    <Textarea
                                        value={editedDna.hookAngle.deconstruction}
                                        onChange={(e) => updateNestedField("hookAngle", "deconstruction", e.target.value)}
                                        placeholder={t('dnaLab.view.deconstructionPlaceholder')}
                                        className="min-h-[80px] bg-muted/50 resize-none"
                                    />
                                </div>

                            </GlassCardContent>
                        </GlassCard>

                        {/* Pacing */}
                        <GlassCard>
                            <GlassCardContent className="p-4 space-y-4">
                                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                                    <Music className="h-3 w-3" /> {t('dnaLab.view.pacing')}
                                </Label>


                                <Textarea
                                    value={editedDna.pacingAndTone.pacing}
                                    onChange={(e) => updateNestedField("pacingAndTone", "pacing", e.target.value)}
                                    placeholder={t('dnaLab.view.pacingPlaceholder')}
                                    className="min-h-[100px] bg-muted/50 resize-none"
                                />

                            </GlassCardContent>
                        </GlassCard>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        {/* Emotional Arc - detail mode has this */}
                        {!isPreview && editedDna.emotionalArc.length > 0 && (
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-4">
                                    <Label className="text-xs uppercase text-pink-500 flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3" /> {t('dnaLab.view.emotionalArc')}
                                    </Label>


                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        {editedDna.emotionalArc.map((arc, index) => (
                                            <div key={index} className="flex-shrink-0 flex items-center">
                                                <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 min-w-[120px] text-center space-y-1">
                                                    <div className="text-[10px] uppercase text-muted-foreground">{arc.section}</div>
                                                    <div className="text-sm font-medium text-pink-500">{arc.emotion}</div>
                                                </div>
                                                {index < editedDna.emotionalArc.length - 1 && (
                                                    <div className="w-8 h-[2px] bg-muted mx-2"></div>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-full ml-2 border border-dashed"
                                            onClick={() => {
                                                const newArc = [...editedDna.emotionalArc, { section: "New Phase", emotion: "Emotion" }];
                                                updateField("emotionalArc", newArc);
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </GlassCardContent>
                            </GlassCard>
                        )}

                        {/* Structural Skeleton */}
                        <GlassCard>
                            <GlassCardContent className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs uppercase text-blue-500 flex items-center gap-1.5">
                                        <FileText className="h-3 w-3" /> {t('dnaLab.view.structuralSkeleton')}
                                    </Label>
                                    <span className="text-xs text-muted-foreground">
                                        {t('dnaLab.view.estTotal')}{': '} <span className="text-foreground font-medium">{totalWords} words</span>
                                    </span>

                                </div>

                                <div className="space-y-2">
                                    {editedDna.structuralSkeleton.map((section, index) => (
                                        <Collapsible
                                            key={index}
                                            open={!!expandedSections[index]}
                                            onOpenChange={() => toggleSection(index)}
                                        >
                                            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                                                        {expandedSections[index] ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <Input
                                                    value={section.title}
                                                    onChange={(e) => {
                                                        const newSkeleton = [...editedDna.structuralSkeleton];
                                                        newSkeleton[index] = { ...section, title: e.target.value };
                                                        updateField("structuralSkeleton", newSkeleton);
                                                    }}
                                                    className="flex-1 h-8 bg-transparent border-none"
                                                    placeholder="Section title..."
                                                />
                                                <Input
                                                    type="number"
                                                    value={section.wordCount || 0}
                                                    onChange={(e) => {
                                                        const newSkeleton = [...editedDna.structuralSkeleton];
                                                        newSkeleton[index] = { ...section, wordCount: parseInt(e.target.value) || 0 };
                                                        updateField("structuralSkeleton", newSkeleton);
                                                    }}
                                                    className="w-24 h-8 text-xs text-center bg-muted"
                                                    placeholder={t('dnaLab.manual.words')}
                                                />

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => {
                                                        const newSkeleton = editedDna.structuralSkeleton.filter((_, i) => i !== index);
                                                        updateField("structuralSkeleton", newSkeleton);
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                            <CollapsibleContent className="pt-4 pl-4 space-y-4 border-l-2 border-muted ml-3 mb-2">
                                                {/* Section Tone */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">{t('dnaLab.view.sectionTone')}</Label>
                                                    <Input
                                                        value={section.tone || ""}
                                                        onChange={(e) => {
                                                            const newSkeleton = [...editedDna.structuralSkeleton];
                                                            newSkeleton[index] = { ...section, tone: e.target.value };
                                                            updateField("structuralSkeleton", newSkeleton);
                                                        }}
                                                        className="h-8 bg-muted/30 text-xs"
                                                        placeholder={t('dnaLab.view.sectionTonePlaceholder')}
                                                    />
                                                </div>


                                                {/* Pacing */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">{t('dnaLab.view.sectionPacing')}</Label>
                                                    <Textarea
                                                        value={section.pacing || ""}
                                                        onChange={(e) => {
                                                            const newSkeleton = [...editedDna.structuralSkeleton];
                                                            newSkeleton[index] = { ...section, pacing: e.target.value };
                                                            updateField("structuralSkeleton", newSkeleton);
                                                        }}
                                                        className="min-h-[60px] bg-muted/30 text-xs resize-none"
                                                        placeholder={t('dnaLab.view.sectionPacingPlaceholder')}
                                                    />
                                                </div>


                                                {/* Content Focus */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">{t('dnaLab.view.contentFocus')}</Label>
                                                    <Textarea
                                                        value={section.contentFocus || ""}
                                                        onChange={(e) => {
                                                            const newSkeleton = [...editedDna.structuralSkeleton];
                                                            newSkeleton[index] = { ...section, contentFocus: e.target.value };
                                                            updateField("structuralSkeleton", newSkeleton);
                                                        }}
                                                        className="min-h-[80px] bg-muted/30 text-xs resize-none"
                                                        placeholder={t('dnaLab.view.contentFocusPlaceholder')}
                                                    />
                                                </div>


                                                {/* Open/Close Loops */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase text-muted-foreground">{t('dnaLab.view.openLoop')}</Label>
                                                        <Input
                                                            value={section.openLoop || ""}
                                                            onChange={(e) => {
                                                                const newSkeleton = [...editedDna.structuralSkeleton];
                                                                newSkeleton[index] = { ...section, openLoop: e.target.value };
                                                                updateField("structuralSkeleton", newSkeleton);
                                                            }}
                                                            className="h-8 bg-muted/30 text-xs"
                                                            placeholder={t('dnaLab.view.openLoopPlaceholder')}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] uppercase text-muted-foreground">{t('dnaLab.view.closesLoop')}</Label>
                                                        <Input
                                                            value={section.closesLoop || ""}
                                                            onChange={(e) => {
                                                                const newSkeleton = [...editedDna.structuralSkeleton];
                                                                newSkeleton[index] = { ...section, closesLoop: e.target.value };
                                                                updateField("structuralSkeleton", newSkeleton);
                                                            }}
                                                            className="h-8 bg-muted/30 text-xs"
                                                            placeholder={t('dnaLab.view.closesLoopPlaceholder')}
                                                        />
                                                    </div>

                                                </div>

                                                {/* Audience Interaction */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase text-muted-foreground">{t('dnaLab.view.audienceInteraction')}</Label>

                                                    <Input
                                                        value={section.audienceInteraction || ""}
                                                        onChange={(e) => {
                                                            const newSkeleton = [...editedDna.structuralSkeleton];
                                                            newSkeleton[index] = { ...section, audienceInteraction: e.target.value };
                                                            updateField("structuralSkeleton", newSkeleton);
                                                        }}
                                                        className="h-8 bg-muted/30 text-xs border-green-500/30"
                                                        placeholder={t('dnaLab.view.ctaPlaceholder')}
                                                    />

                                                </div>

                                                {/* Audience Value */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase text-orange-500">{t('dnaLab.view.audienceValue')}</Label>
                                                    <Textarea
                                                        value={section.audienceValue || ""}
                                                        onChange={(e) => {
                                                            const newSkeleton = [...editedDna.structuralSkeleton];
                                                            newSkeleton[index] = { ...section, audienceValue: e.target.value };
                                                            updateField("structuralSkeleton", newSkeleton);
                                                        }}
                                                        className="min-h-[60px] bg-muted/30 text-xs resize-none border-orange-500/30 focus:border-orange-500/50"
                                                        placeholder={t('dnaLab.view.audienceValuePlaceholder')}
                                                    />
                                                </div>


                                                {/* Anti-Pattern */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] uppercase text-red-400">{t('dnaLab.view.antiPattern')}</Label>
                                                    <Input
                                                        value={section.antiPattern || ""}
                                                        onChange={(e) => {
                                                            const newSkeleton = [...editedDna.structuralSkeleton];
                                                            newSkeleton[index] = { ...section, antiPattern: e.target.value };
                                                            updateField("structuralSkeleton", newSkeleton);
                                                        }}
                                                        className="h-8 bg-red-500/10 border-red-500/30 text-xs"
                                                        placeholder={t('dnaLab.view.antiPatternPlaceholder')}
                                                    />
                                                </div>

                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        updateField("structuralSkeleton", [
                                            ...editedDna.structuralSkeleton,
                                            { title: "", wordCount: 100 }
                                        ]);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('dnaLab.view.addDetailedSection')}
                                </Button>

                            </GlassCardContent>
                        </GlassCard>

                        {/* Pattern Cards Grid - Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* High Dopamine */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-yellow-500 flex items-center gap-1.5">
                                        <Zap className="h-3 w-3" /> {t('dnaLab.view.highDopamine')}
                                    </Label>

                                    <div className="space-y-2">
                                        {(editedDna.highDopamine || []).map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateArrayItem("highDopamine", index, e.target.value)}
                                                    className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => removeArrayItem("highDopamine", index)}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addArrayItem("highDopamine")}
                                        className="w-full text-muted-foreground"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('dnaLab.view.addHigh')}
                                    </Button>

                                </GlassCardContent>
                            </GlassCard>

                            {/* Confusion Points */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-orange-500 flex items-center gap-1.5">
                                        <AlertTriangle className="h-3 w-3" /> {t('dnaLab.view.confusionPoints')}
                                    </Label>

                                    <div className="space-y-2">
                                        {(editedDna.confusionPoints || []).map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateArrayItem("confusionPoints", index, e.target.value)}
                                                    className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => removeArrayItem("confusionPoints", index)}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addArrayItem("confusionPoints")}
                                        className="w-full text-muted-foreground"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('dnaLab.view.addConfusion')}
                                    </Button>

                                </GlassCardContent>
                            </GlassCard>

                            {/* Objections */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-red-500 flex items-center gap-1.5">
                                        <MessageSquare className="h-3 w-3" /> {t('dnaLab.view.objections')}
                                    </Label>

                                    <div className="space-y-2">
                                        {(editedDna.objections || []).map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateArrayItem("objections", index, e.target.value)}
                                                    className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => removeArrayItem("objections", index)}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addArrayItem("objections")}
                                        className="w-full text-muted-foreground"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('dnaLab.view.addObjection')}
                                    </Button>

                                </GlassCardContent>
                            </GlassCard>
                        </div>

                        {/* Pattern Cards Grid - Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Core Patterns */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-green-500 flex items-center gap-1.5">
                                        <Shield className="h-3 w-3" /> {t('dnaLab.view.corePatterns')}
                                    </Label>

                                    <div className="space-y-2">
                                        {(editedDna.corePatterns || []).map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateArrayItem("corePatterns", index, e.target.value)}
                                                    className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => removeArrayItem("corePatterns", index)}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addArrayItem("corePatterns")}
                                        className="w-full text-muted-foreground"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('dnaLab.view.addCore')}
                                    </Button>

                                </GlassCardContent>
                            </GlassCard>

                            {/* Viral X-Factors */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-purple-500 flex items-center gap-1.5">
                                        <Sparkles className="h-3 w-3" /> {t('dnaLab.view.viralXFactors')}
                                    </Label>

                                    <div className="space-y-2">
                                        {(editedDna.viralXFactors || []).map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateArrayItem("viralXFactors", index, e.target.value)}
                                                    className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => removeArrayItem("viralXFactors", index)}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addArrayItem("viralXFactors")}
                                        className="w-full text-muted-foreground"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('dnaLab.view.addViral')}
                                    </Button>

                                </GlassCardContent>
                            </GlassCard>

                            {/* Flop Avoidance */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-red-400 flex items-center gap-1.5">
                                        <XCircle className="h-3 w-3" /> {t('dnaLab.view.flopAvoidance')}
                                    </Label>

                                    <div className="space-y-2">
                                        {(editedDna.flopAvoidance || []).map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateArrayItem("flopAvoidance", index, e.target.value)}
                                                    className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => removeArrayItem("flopAvoidance", index)}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addArrayItem("flopAvoidance")}
                                        className="w-full text-muted-foreground"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('dnaLab.view.addFlop')}
                                    </Button>

                                </GlassCardContent>
                            </GlassCard>
                        </div>

                        {/* Hook Examples Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Hook Examples */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-green-500 flex items-center gap-1.5">
                                        <Zap className="h-3 w-3" /> {t('dnaLab.view.hookExamplesTitle')}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {t('dnaLab.view.aiLearnsWarning')}
                                    </p>

                                    <div className="space-y-2">
                                        {editedDna.hook_examples.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <Textarea
                                                    value={item}
                                                    onChange={(e) => updateArrayItem("hook_examples", index, e.target.value)}
                                                    className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => removeArrayItem("hook_examples", index)}
                                                >
                                                    <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addArrayItem("hook_examples")}
                                        className="w-full text-muted-foreground"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t('dnaLab.view.addExample')}
                                    </Button>

                                </GlassCardContent>
                            </GlassCard>

                            {/* Audience Psychology */}
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-3">
                                    <Label className="text-xs uppercase text-purple-500 flex items-center gap-1.5">
                                        <Brain className="h-3 w-3" /> {t('dnaLab.view.audiencePsychology')}
                                    </Label>
                                    <Textarea
                                        value={editedDna.audiencePsychology}
                                        onChange={(e) => updateField("audiencePsychology", e.target.value)}
                                        placeholder={t('dnaLab.view.audiencePsychologyPlaceholder')}
                                        className="min-h-[120px] bg-muted/50 resize-none"
                                    />

                                </GlassCardContent>
                            </GlassCard>
                        </div>

                        {/* ============================================ */}
                        {/* NEW FIELDS: Persuasion Flow */}
                        {/* ============================================ */}
                        <GlassCard>
                            <Collapsible>
                                <GlassCardContent className="p-4 space-y-3">
                                    <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs uppercase text-blue-400 flex items-center gap-1.5 cursor-pointer">
                                                <Brain className="h-3 w-3" /> {t('dnaLab.view.persuasionFlow')}
                                            </Label>
                                            <ChevronDown className="h-4 w-4 transition-transform" />
                                        </div>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent className="space-y-3 pt-2">
                                        {/* Framework */}
                                        {/* Framework */}
                                        {/*
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">{t('dnaLab.view.framework')}</Label>
                                            <Input
                                                value={editedDna.persuasionFlow?.framework || ''}
                                                onChange={(e) => updateField("persuasionFlow.framework", e.target.value)}
                                                placeholder={t('dnaLab.view.frameworkPlaceholder')}
                                                className="bg-muted/50 text-sm"
                                            />
                                        </div>

                                        {/* Logical Progression */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">{t('dnaLab.view.logicalProgression')}</Label>
                                            <Textarea
                                                value={editedDna.persuasionFlow?.logicalProgression?.join(' → ') || ''}
                                                onChange={(e) => {
                                                    const steps = e.target.value.split('→').map(s => s.trim());
                                                    //updateField("persuasionFlow.logicalProgression", steps);
                                                }}
                                                placeholder={t('dnaLab.view.logicalProgressionPlaceholder')}
                                                className="min-h-[60px] bg-muted/50 resize-none text-sm"
                                            />
                                        </div>

                                        {/* Proof Sequence */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">{t('dnaLab.view.proofSequence')}</Label>
                                            <Textarea
                                                value={editedDna.persuasionFlow?.proofSequence?.join(', ') || ''}
                                                onChange={(e) => {
                                                    const proofs = e.target.value.split(',').map(s => s.trim()) as any[];
                                                    //updateField("persuasionFlow.proofSequence", proofs);
                                                }}
                                                placeholder={t('dnaLab.view.proofSequencePlaceholder')}
                                                className="min-h-[60px] bg-muted/50 resize-none text-sm"
                                            />
                                        </div>

                                        {/* Objection Handling */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">{t('dnaLab.view.mainObjection')}</Label>
                                            <Input
                                                value={editedDna.persuasionFlow?.objectionHandling?.mainObjection || ''}
                                                // onChange={(e) => updateField("persuasionFlow.objectionHandling.mainObjection", e.target.value)}
                                                placeholder={t('dnaLab.view.mainObjectionPlaceholder')}
                                                className="bg-muted/50 text-sm"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">{t('dnaLab.view.counterTactic')}</Label>
                                            <Textarea
                                                value={editedDna.persuasionFlow?.objectionHandling?.counterTactic || ''}
                                                //onChange={(e) => updateField("persuasionFlow.objectionHandling.counterTactic", e.target.value)}
                                                placeholder={t('dnaLab.view.counterTacticPlaceholder')}
                                                className="min-h-[60px] bg-muted/50 resize-none text-sm"
                                            />
                                        </div>
                                    </CollapsibleContent>
                                </GlassCardContent>
                            </Collapsible>
                        </GlassCard>

                        {/* ============================================ */}
                        {/* NEW FIELDS: Retention Hooks (Word Count Based) */}
                        {/* ============================================ */}
                        <GlassCard>
                            <Collapsible>
                                <GlassCardContent className="p-4 space-y-3">
                                    <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs uppercase text-orange-400 flex items-center gap-1.5 cursor-pointer">
                                                <Zap className="h-3 w-3" /> {t('dnaLab.view.retentionHooks')}
                                            </Label>
                                            <ChevronDown className="h-4 w-4 transition-transform" />
                                        </div>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent className="space-y-2 pt-2">
                                        {(editedDna.retentionHooks || []).map((hook, index) => (
                                            <div key={index} className="p-3 bg-muted/30 rounded-lg space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">{t('dnaLab.view.atWordCount')}</Label>
                                                        <Input
                                                            type="number"
                                                            value={hook.atWordCount}
                                                            onChange={(e) => {
                                                                const updated = [...editedDna.retentionHooks!];
                                                                updated[index] = { ...hook, atWordCount: parseInt(e.target.value) || 0 };
                                                                updateField("retentionHooks", updated);
                                                            }}
                                                            className="bg-background/50 text-sm h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">{t('dnaLab.view.technique')}</Label>
                                                        <Input
                                                            value={hook.technique}
                                                            onChange={(e) => {
                                                                const updated = [...editedDna.retentionHooks!];
                                                                updated[index] = { ...hook, technique: e.target.value };
                                                                updateField("retentionHooks", updated);
                                                            }}
                                                            placeholder={t('dnaLab.view.techniquePlaceholder')}
                                                            className="bg-background/50 text-sm h-8"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">{t('dnaLab.view.example')}</Label>
                                                    <Textarea
                                                        value={hook.example}
                                                        onChange={(e) => {
                                                            const updated = [...editedDna.retentionHooks!];
                                                            updated[index] = { ...hook, example: e.target.value };
                                                            updateField("retentionHooks", updated);
                                                        }}
                                                        className="min-h-[50px] bg-background/50 resize-none text-sm"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const updated = [...(editedDna.retentionHooks || [])];
                                                updated.push({ atWordCount: 200, technique: '', example: '' });
                                                updateField("retentionHooks", updated);
                                            }}
                                            className="w-full text-muted-foreground"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t('dnaLab.view.addRetentionHook')}
                                        </Button>
                                    </CollapsibleContent>
                                </GlassCardContent>
                            </Collapsible>
                        </GlassCard>

                        {/* ============================================ */}
                        {/* NEW FIELDS: Transitions */}
                        {/* ============================================ */}
                        <GlassCard>
                            <Collapsible>
                                <GlassCardContent className="p-4 space-y-3">
                                    <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs uppercase text-cyan-400 flex items-center gap-1.5 cursor-pointer">
                                                <ChevronRight className="h-3 w-3" /> {t('dnaLab.view.transitionFormulas')}
                                            </Label>
                                            <ChevronDown className="h-4 w-4 transition-transform" />
                                        </div>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent className="space-y-2 pt-2">
                                        {(editedDna.transitions || []).map((transition, index) => (
                                            <div key={index} className="p-3 bg-muted/30 rounded-lg space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">{t('dnaLab.view.from')}</Label>
                                                        <Input
                                                            value={transition.from}
                                                            onChange={(e) => {
                                                                const updated = [...editedDna.transitions!];
                                                                updated[index] = { ...transition, from: e.target.value };
                                                                updateField("transitions", updated);
                                                            }}
                                                            className="bg-background/50 text-sm h-8"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">{t('dnaLab.view.to')}</Label>
                                                        <Input
                                                            value={transition.to}
                                                            onChange={(e) => {
                                                                const updated = [...editedDna.transitions!];
                                                                updated[index] = { ...transition, to: e.target.value };
                                                                updateField("transitions", updated);
                                                            }}
                                                            className="bg-background/50 text-sm h-8"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">{t('dnaLab.view.formula')}</Label>
                                                    <Textarea
                                                        value={transition.formula}
                                                        onChange={(e) => {
                                                            const updated = [...editedDna.transitions!];
                                                            updated[index] = { ...transition, formula: e.target.value };
                                                            updateField("transitions", updated);
                                                        }}
                                                        placeholder={t('dnaLab.view.formulaPlaceholder')}
                                                        className="min-h-[50px] bg-background/50 resize-none text-sm"
                                                    />
                                                </div>
                                                {transition.example !== undefined && (
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">{t('dnaLab.view.exampleOptional')}</Label>
                                                        <Textarea
                                                            value={transition.example || ''}
                                                            onChange={(e) => {
                                                                const updated = [...editedDna.transitions!];
                                                                updated[index] = { ...transition, example: e.target.value };
                                                                updateField("transitions", updated);
                                                            }}
                                                            placeholder={t('dnaLab.view.examplePlaceholder')}
                                                            className="min-h-[50px] bg-background/50 resize-none text-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const updated = [...(editedDna.transitions || [])];
                                                updated.push({ from: '', to: '', formula: '', example: '' });
                                                updateField("transitions", updated);
                                            }}
                                            className="w-full text-muted-foreground"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            {t('dnaLab.view.addTransitionFormula')}
                                        </Button>
                                    </CollapsibleContent>
                                </GlassCardContent>
                            </Collapsible>
                        </GlassCard>

                        {/* Source Info - detail mode only */}
                        {!isPreview && editedDna.source_url && (
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground">{t('dnaLab.view.sourceUrl')}</Label>

                                    <p className="text-sm text-muted-foreground break-all">{editedDna.source_url}</p>
                                </GlassCardContent>
                            </GlassCard>
                        )}

                        {!isPreview && editedDna.source_transcript && (
                            <GlassCard>
                                <GlassCardContent className="p-4 space-y-2">
                                    <Label className="text-xs uppercase text-muted-foreground">{t('dnaLab.view.sourceTranscript')}</Label>

                                    <Textarea
                                        value={editedDna.source_transcript}
                                        readOnly
                                        className="min-h-[200px] bg-muted/50 resize-none text-sm"
                                    />
                                </GlassCardContent>
                            </GlassCard>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
