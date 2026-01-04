import { useState } from "react";
import {
  ArrowLeft, Download, Brain, Target, MessageSquare, Zap, AlertTriangle,
  Shield, Sparkles, XCircle, FileText, Music, Mic, ChevronDown, ChevronRight,
  Plus, Trash2, Save, Loader2, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DNA, DNAAnalysisData } from "@/hooks/useDnas";

interface DNADetailViewProps {
  dna: DNA;
  onBack: () => void;
  onUpdate: (updates: Partial<DNA>) => Promise<DNA | null>;
  onExport: (dna: DNA) => void;
  onEvolve?: (newContent: {
    viralVideos?: Array<{ transcript: string; url?: string }>;
    flopVideos?: Array<{ transcript: string; url?: string }>;
  }) => Promise<{ success: boolean; changesSummary?: string[] }>;
}

export function DNADetailView({ dna, onBack, onUpdate, onExport, onEvolve }: DNADetailViewProps) {
  const [editedDna, setEditedDna] = useState<DNA>(dna);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // DNA Evolution state
  const [showEvolution, setShowEvolution] = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [evolutionChanges, setEvolutionChanges] = useState<string[]>([]);
  const [viralTranscript, setViralTranscript] = useState("");
  const [viralUrl, setViralUrl] = useState("");
  const [flopTranscript, setFlopTranscript] = useState("");
  const [flopUrl, setFlopUrl] = useState("");

  const updateField = <K extends keyof DNA>(field: K, value: DNA[K]) => {
    setEditedDna(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        name: editedDna.name,
        niche: editedDna.niche,
        tone: editedDna.tone,
        pacing: editedDna.pacing,
        vocabulary: editedDna.vocabulary,
        hook_type: editedDna.hook_type,
        hook_examples: editedDna.hook_examples,
        structure: editedDna.structure,
        patterns: editedDna.patterns,
        retention_tactics: editedDna.retention_tactics,
        x_factors: editedDna.x_factors,
        analysis_data: editedDna.analysis_data,
      });
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const updateAnalysisField = <K extends keyof DNAAnalysisData>(field: K, value: DNAAnalysisData[K]) => {
    setEditedDna(prev => ({
      ...prev,
      analysis_data: { ...(prev.analysis_data || {}), [field]: value }
    }));
    setHasChanges(true);
  };

  const addArrayItem = (field: keyof DNA) => {
    const currentArray = (editedDna[field] as string[] | null) || [];
    updateField(field, [...currentArray, ""] as DNA[keyof DNA]);
  };

  const updateArrayItem = (field: keyof DNA, index: number, value: string) => {
    const currentArray = [...((editedDna[field] as string[] | null) || [])];
    currentArray[index] = value;
    updateField(field, currentArray as DNA[keyof DNA]);
  };

  const removeArrayItem = (field: keyof DNA, index: number) => {
    const currentArray = ((editedDna[field] as string[] | null) || []).filter((_, i) => i !== index);
    updateField(field, currentArray as DNA[keyof DNA]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4 max-w-[1600px] mx-auto">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Input
            value={editedDna.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="max-w-md text-center text-lg font-semibold bg-transparent border-none focus-visible:ring-1"
            placeholder="DNA Name"
          />
          <div className="flex gap-2">
            {onEvolve && (
              <Button
                variant="outline"
                onClick={() => setShowEvolution(!showEvolution)}
                className="gap-2 border-green-500/50 text-green-500 hover:bg-green-500/10"
              >
                <RefreshCw className="h-4 w-4" />
                Evolve DNA
              </Button>
            )}
            <Button variant="outline" onClick={() => onExport(editedDna)} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* DNA Evolution Panel */}
      {showEvolution && onEvolve && (
        <div className="max-w-[1600px] mx-auto p-4 border-b bg-green-500/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2 text-green-500">
                <RefreshCw className="h-4 w-4" />
                DNA Evolution - Learn from New Content
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEvolution(false);
                  setEvolutionChanges([]);
                }}
              >
                ✕ Close
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Viral Video Input */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-green-500">
                    📈 Viral Video (to learn from)
                  </Label>
                  <Input
                    value={viralUrl}
                    onChange={(e) => setViralUrl(e.target.value)}
                    placeholder="Video URL (optional)"
                    className="bg-muted/50"
                  />
                  <Textarea
                    value={viralTranscript}
                    onChange={(e) => setViralTranscript(e.target.value)}
                    placeholder="Paste viral video transcript here..."
                    className="min-h-[120px] bg-muted/50 resize-none"
                  />
                </GlassCardContent>
              </GlassCard>

              {/* Flop Video Input */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-red-400">
                    📉 Flop Video (to learn mistakes)
                  </Label>
                  <Input
                    value={flopUrl}
                    onChange={(e) => setFlopUrl(e.target.value)}
                    placeholder="Video URL (optional)"
                    className="bg-muted/50"
                  />
                  <Textarea
                    value={flopTranscript}
                    onChange={(e) => setFlopTranscript(e.target.value)}
                    placeholder="Paste flop video transcript here..."
                    className="min-h-[120px] bg-muted/50 resize-none"
                  />
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Evolution Button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={async () => {
                  if (!viralTranscript && !flopTranscript) return;
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
                    // Reload DNA data
                    setEditedDna({ ...dna });
                  }
                }}
                disabled={evolving || (!viralTranscript && !flopTranscript)}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {evolving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evolving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Evolve Now
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                AI will learn from new content and refine your DNA patterns.
              </p>
            </div>

            {/* Evolution Results */}
            {evolutionChanges.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <Label className="text-sm font-semibold text-green-500 mb-2 block">
                  ✅ Evolution Complete - {evolutionChanges.length} Changes Made:
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

      {/* Content */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Column - matches DNAPreview layout */}
          <div className="space-y-4">
            {/* My Notes / Constraints */}
            <GlassCard>
              <GlassCardContent className="p-4 space-y-3">
                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-primary" /> My Notes / Constraints
                </Label>
                <Textarea
                  placeholder="Add your own mandatory elements or notes here (optional)..."
                  className="min-h-[80px] bg-muted/50 resize-none"
                />
              </GlassCardContent>
            </GlassCard>

            {/* Niche / Category */}
            <GlassCard>
              <GlassCardContent className="p-4 space-y-3">
                <Label className="text-xs uppercase text-green-500 flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Niche / Category
                </Label>
                <Input
                  value={editedDna.niche || ""}
                  onChange={(e) => updateField("niche", e.target.value)}
                  placeholder="e.g., Health & Fitness, Crypto, Gaming..."
                  className="bg-muted/50"
                />
              </GlassCardContent>
            </GlassCard>

            {/* Target Word Count */}
            <GlassCard>
              <GlassCardContent className="p-4 space-y-3">
                <Label className="text-xs uppercase text-red-500 flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> Target Word Count
                </Label>
                <Input
                  type="number"
                  value={editedDna.analysis_data?.targetWordCount || ""}
                  onChange={(e) => updateAnalysisField("targetWordCount", parseInt(e.target.value) || 0)}
                  placeholder="e.g., 3316"
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Calculated from viral scripts. Scripts generated will aim for this range.
                </p>
              </GlassCardContent>
            </GlassCard>

            {/* Linguistic Fingerprint */}
            <GlassCard>
              <GlassCardContent className="p-4 space-y-4">
                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                  <Mic className="h-3 w-3" /> Linguistic Fingerprint (The Voice)
                </Label>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Persona / Role</Label>
                  <Input
                    value={editedDna.analysis_data?.linguisticFingerprint?.personaRole || ""}
                    onChange={(e) => {
                      const current = editedDna.analysis_data?.linguisticFingerprint || { personaRole: "", toneAnalysis: "", signatureKeywords: [] };
                      updateAnalysisField("linguisticFingerprint", { ...current, personaRole: e.target.value });
                    }}
                    placeholder="e.g., The Financial Realist Mentor"
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tone Analysis</Label>
                  <Textarea
                    value={editedDna.analysis_data?.linguisticFingerprint?.toneAnalysis || ""}
                    onChange={(e) => {
                      const current = editedDna.analysis_data?.linguisticFingerprint || { personaRole: "", toneAnalysis: "", signatureKeywords: [] };
                      updateAnalysisField("linguisticFingerprint", { ...current, toneAnalysis: e.target.value });
                    }}
                    placeholder="Describe the tone..."
                    className="min-h-[80px] bg-muted/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Signature Keywords</Label>
                  <Input
                    value={editedDna.analysis_data?.linguisticFingerprint?.signatureKeywords?.join(", ") || ""}
                    onChange={(e) => {
                      const current = editedDna.analysis_data?.linguisticFingerprint || { personaRole: "", toneAnalysis: "", signatureKeywords: [] };
                      updateAnalysisField("linguisticFingerprint", { ...current, signatureKeywords: e.target.value.split(",").map(s => s.trim()) });
                    }}
                    placeholder="e.g., Trap, Survival Mode, Freedom, System..."
                    className="bg-muted/50"
                  />
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Hook Angle */}
            <GlassCard>
              <GlassCardContent className="p-4 space-y-4">
                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-green-500" /> Hook Angle (Psychology)
                </Label>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Angle / Category</Label>
                  <Input
                    value={editedDna.analysis_data?.hookAngle?.angleCategory || editedDna.hook_type || ""}
                    onChange={(e) => {
                      const current = editedDna.analysis_data?.hookAngle || { angleCategory: "", deconstruction: "" };
                      updateAnalysisField("hookAngle", { ...current, angleCategory: e.target.value });
                    }}
                    placeholder="e.g., Negative, Curiosity, Paradox..."
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Deconstruction</Label>
                  <Textarea
                    value={editedDna.analysis_data?.hookAngle?.deconstruction || ""}
                    onChange={(e) => {
                      const current = editedDna.analysis_data?.hookAngle || { angleCategory: "", deconstruction: "" };
                      updateAnalysisField("hookAngle", { ...current, deconstruction: e.target.value });
                    }}
                    placeholder="How the hook works psychologically..."
                    className="min-h-[80px] bg-muted/50 resize-none"
                  />
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Pacing  */}
            <GlassCard>
              <GlassCardContent className="p-4 space-y-4">
                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                  <Music className="h-3 w-3" /> Pacing
                </Label>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Pacing</Label>
                  <Textarea
                    value={editedDna.analysis_data?.pacingAndTone?.pacing || editedDna.pacing || ""}
                    onChange={(e) => {
                      const current = editedDna.analysis_data?.pacingAndTone || { pacing: "" };
                      updateAnalysisField("pacingAndTone", { ...current, pacing: e.target.value });
                    }}
                    placeholder="Describe the pacing..."
                    className="min-h-[80px] bg-muted/50 resize-none"
                  />
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Structural Skeleton */}
            <GlassCard>
              <GlassCardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase text-blue-500 flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Structural Skeleton (Advanced)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Est. Total: <span className="text-foreground font-medium">
                      {(editedDna.analysis_data?.structuralSkeleton || []).reduce(
                        (sum, section) => sum + (section.wordCount || 0), 0
                      )} words
                    </span>
                  </span>
                </div>

                <div className="space-y-2">
                  {(editedDna.analysis_data?.structuralSkeleton || []).map((section, index) => (
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
                            const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                            newSkeleton[index] = { ...section, title: e.target.value };
                            updateAnalysisField("structuralSkeleton", newSkeleton);
                          }}
                          className="flex-1 h-8 bg-transparent border-none"
                          placeholder="Section title..."
                        />
                        <Input
                          type="number"
                          value={section.wordCount || 0}
                          onChange={(e) => {
                            const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                            newSkeleton[index] = { ...section, wordCount: parseInt(e.target.value) || 0 };
                            updateAnalysisField("structuralSkeleton", newSkeleton);
                          }}
                          className="w-24 h-8 text-xs text-center bg-muted"
                          placeholder="Words"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => {
                            const newSkeleton = (editedDna.analysis_data?.structuralSkeleton || []).filter((_, i) => i !== index);
                            updateAnalysisField("structuralSkeleton", newSkeleton);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      <CollapsibleContent className="pt-4 pl-4 space-y-4 border-l-2 border-muted ml-3 mb-2">
                        {/* Row 1: Tone (Section-specific) */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground">Section Tone</Label>
                          <Input
                            value={section.tone || ""}
                            onChange={(e) => {
                              const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                              newSkeleton[index] = { ...section, tone: e.target.value };
                              updateAnalysisField("structuralSkeleton", newSkeleton);
                            }}
                            className="h-8 bg-muted/30 text-xs"
                            placeholder="e.g. Urgent, Inquisitive, Calm"
                          />
                        </div>

                        {/* Row 2: Pacing */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground">Linguistic Pacing (Rhythm/Speed)</Label>
                          <Textarea
                            value={section.pacing || ""}
                            onChange={(e) => {
                              const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                              newSkeleton[index] = { ...section, pacing: e.target.value };
                              updateAnalysisField("structuralSkeleton", newSkeleton);
                            }}
                            className="min-h-[60px] bg-muted/30 text-xs resize-none"
                            placeholder="Detailed pacing instructions (e.g. Fast cuts every 2s...)"
                          />
                        </div>

                        {/* Row 3: Content Focus */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground">Content Focus</Label>
                          <Textarea
                            value={section.contentFocus || ""}
                            onChange={(e) => {
                              const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                              newSkeleton[index] = { ...section, contentFocus: e.target.value };
                              updateAnalysisField("structuralSkeleton", newSkeleton);
                            }}
                            className="min-h-[80px] bg-muted/30 text-xs resize-none"
                            placeholder="What happens here? Main objective..."
                          />
                        </div>

                        {/* Row 4: Advanced Fields (Micro Hook, Open Loop) */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">Micro Hook (First 5s)</Label>
                            <Input
                              value={section.microHook || ""}
                              onChange={(e) => {
                                const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                                newSkeleton[index] = { ...section, microHook: e.target.value };
                                updateAnalysisField("structuralSkeleton", newSkeleton);
                              }}
                              className="h-8 bg-muted/30 text-xs"
                              placeholder="Mini-hook strategy..."
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">Open Loop (Optional)</Label>
                            <Input
                              value={section.openLoop || ""}
                              onChange={(e) => {
                                const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                                newSkeleton[index] = { ...section, openLoop: e.target.value };
                                updateAnalysisField("structuralSkeleton", newSkeleton);
                              }}
                              className="h-8 bg-muted/30 text-xs"
                              placeholder="Curiosity gap..."
                            />
                          </div>
                        </div>

                        {/* Row 5: Viral Triggers */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground">Viral Trigger (Optional)</Label>
                          <Input
                            value={section.viralTriggers || ""}
                            onChange={(e) => {
                              const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                              newSkeleton[index] = { ...section, viralTriggers: e.target.value };
                              updateAnalysisField("structuralSkeleton", newSkeleton);
                            }}
                            className="h-8 bg-muted/30 text-xs"
                            placeholder="Specific element..."
                          />
                        </div>

                        {/* Row 6: Must Include */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground">Must Include Elements (Comma Separated)</Label>
                          <Input
                            value={(section.mustInclude || []).join(", ")}
                            onChange={(e) => {
                              const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                              newSkeleton[index] = { ...section, mustInclude: e.target.value.split(",").map(s => s.trim()) };
                              updateAnalysisField("structuralSkeleton", newSkeleton);
                            }}
                            className="h-8 bg-muted/30 text-xs"
                            placeholder="e.g. Sound effect, Visual metaphor"
                          />
                        </div>

                        {/* Row 7: Audience Interaction & Value */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-muted-foreground">Audience Interaction / CTA (Optional)</Label>
                            <Input
                              value={section.audienceInteraction || ""}
                              onChange={(e) => {
                                const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                                newSkeleton[index] = { ...section, audienceInteraction: e.target.value };
                                updateAnalysisField("structuralSkeleton", newSkeleton);
                              }}
                              className="h-8 bg-muted/30 text-xs"
                              placeholder="Specific CTA or engagement prompt..."
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase text-orange-500">Audience Value (Takeaway) *</Label>
                            <Textarea
                              value={section.audienceValue || ""}
                              onChange={(e) => {
                                const newSkeleton = [...(editedDna.analysis_data?.structuralSkeleton || [])];
                                newSkeleton[index] = { ...section, audienceValue: e.target.value };
                                updateAnalysisField("structuralSkeleton", newSkeleton);
                              }}
                              className="min-h-[60px] bg-muted/30 text-xs resize-none border-orange-500/30 focus:border-orange-500/50"
                              placeholder="What value does the viewer get? (Mandatory)"
                            />
                          </div>
                        </div>

                      </CollapsibleContent>
                    </Collapsible>
                  ))}

                  {/* Fallback for legacy structure string array if structuralSkeleton is empty */}
                  {(!editedDna.analysis_data?.structuralSkeleton || editedDna.analysis_data.structuralSkeleton.length === 0) && (editedDna.structure || []).length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-xs text-muted-foreground block mb-2">Legacy Structure View</Label>
                      {editedDna.structure?.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center bg-muted/30 p-2 rounded">
                          <Badge variant="secondary" className="shrink-0">{index + 1}</Badge>
                          <span className="text-sm flex-1">{item}</span>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => {
                          const newSkeleton = (editedDna.structure || []).map(title => ({
                            title,
                            wordCount: 100,
                            percentage: 10,
                            wordRange: "0-0" // legacy support
                          }));
                          updateAnalysisField("structuralSkeleton", newSkeleton);
                        }}
                      >
                        Convert to Advanced Structure
                      </Button>
                    </div>
                  )}

                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const currentSkeleton = editedDna.analysis_data?.structuralSkeleton || [];
                    updateAnalysisField("structuralSkeleton", [
                      ...currentSkeleton,
                      { title: "", wordCount: 100 }
                    ]);
                  }}
                  className="w-full text-muted-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Detailed Section
                </Button>
              </GlassCardContent>
            </GlassCard>

            {/* Pattern Cards Grid - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Core Patterns */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-purple-500 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Core Patterns
                  </Label>
                  <div className="space-y-2">
                    {(editedDna.patterns || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => updateArrayItem("patterns", index, e.target.value)}
                          className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                          placeholder="Enter pattern..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeArrayItem("patterns", index)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addArrayItem("patterns")}
                    className="w-full text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Pattern
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Retention Tactics */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-yellow-500 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> Retention Tactics
                  </Label>
                  <div className="space-y-2">
                    {(editedDna.retention_tactics || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => updateArrayItem("retention_tactics", index, e.target.value)}
                          className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                          placeholder="Enter tactic..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeArrayItem("retention_tactics", index)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addArrayItem("retention_tactics")}
                    className="w-full text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tactic
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Viral X-Factors */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-pink-500 flex items-center gap-1.5">
                    <Shield className="h-3 w-3" /> Viral X-Factors
                  </Label>
                  <div className="space-y-2">
                    {(editedDna.x_factors || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => updateArrayItem("x_factors", index, e.target.value)}
                          className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                          placeholder="Enter x-factor..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeArrayItem("x_factors", index)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addArrayItem("x_factors")}
                    className="w-full text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add X-Factor
                  </Button>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Pattern Cards Grid - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* High Dopamine */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-yellow-500 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> High Dopamine (Keep)
                  </Label>
                  <div className="space-y-2">
                    {(editedDna.analysis_data?.highDopamine || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(editedDna.analysis_data?.highDopamine || [])];
                            newItems[index] = e.target.value;
                            updateAnalysisField("highDopamine", newItems);
                          }}
                          className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                          placeholder="High dopamine element..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => {
                            const newItems = (editedDna.analysis_data?.highDopamine || []).filter((_, i) => i !== index);
                            updateAnalysisField("highDopamine", newItems);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateAnalysisField("highDopamine", [...(editedDna.analysis_data?.highDopamine || []), ""])}
                    className="w-full text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add High
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Confusion Points */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-orange-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" /> Confusion Points (Fix)
                  </Label>
                  <div className="space-y-2">
                    {(editedDna.analysis_data?.confusionPoints || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(editedDna.analysis_data?.confusionPoints || [])];
                            newItems[index] = e.target.value;
                            updateAnalysisField("confusionPoints", newItems);
                          }}
                          className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                          placeholder="Confusion point..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => {
                            const newItems = (editedDna.analysis_data?.confusionPoints || []).filter((_, i) => i !== index);
                            updateAnalysisField("confusionPoints", newItems);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateAnalysisField("confusionPoints", [...(editedDna.analysis_data?.confusionPoints || []), ""])}
                    className="w-full text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Confusion
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Objections */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-red-500 flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" /> Objections (Address)
                  </Label>
                  <div className="space-y-2">
                    {(editedDna.analysis_data?.objections || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(editedDna.analysis_data?.objections || [])];
                            newItems[index] = e.target.value;
                            updateAnalysisField("objections", newItems);
                          }}
                          className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                          placeholder="Objection to address..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => {
                            const newItems = (editedDna.analysis_data?.objections || []).filter((_, i) => i !== index);
                            updateAnalysisField("objections", newItems);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateAnalysisField("objections", [...(editedDna.analysis_data?.objections || []), ""])}
                    className="w-full text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Objection
                  </Button>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Pattern Cards Grid - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Flop Avoidance */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-red-500 flex items-center gap-1.5">
                    <XCircle className="h-3 w-3" /> Flop Avoidance
                  </Label>
                  <div className="space-y-2">
                    {(editedDna.analysis_data?.flopAvoidance || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(editedDna.analysis_data?.flopAvoidance || [])];
                            newItems[index] = e.target.value;
                            updateAnalysisField("flopAvoidance", newItems);
                          }}
                          className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                          placeholder="What to avoid..."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => {
                            const newItems = (editedDna.analysis_data?.flopAvoidance || []).filter((_, i) => i !== index);
                            updateAnalysisField("flopAvoidance", newItems);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateAnalysisField("flopAvoidance", [...(editedDna.analysis_data?.flopAvoidance || []), ""])}
                    className="w-full text-muted-foreground"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Flop
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Hook Examples */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-green-500 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> Hook Examples
                  </Label>
                  <div className="space-y-2">
                    {(editedDna.hook_examples || []).map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={item}
                          onChange={(e) => updateArrayItem("hook_examples", index, e.target.value)}
                          className="min-h-[60px] bg-muted/50 resize-none text-sm flex-1"
                          placeholder="Enter hook example..."
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
                    Add Example
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Audience Psychology */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-blue-500 flex items-center gap-1.5">
                    <Brain className="h-3 w-3" /> Audience Psychology
                  </Label>
                  <Textarea
                    value={editedDna.analysis_data?.audiencePsychology || ""}
                    onChange={(e) => updateAnalysisField("audiencePsychology", e.target.value)}
                    className="min-h-[100px] bg-muted/50 resize-none text-sm"
                    placeholder="Describe audience psychology..."
                  />
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Source Info */}
            {editedDna.source_url && (
              <GlassCard>
                <GlassCardContent className="p-4 space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Source URL</Label>
                  <p className="text-sm text-muted-foreground break-all">{editedDna.source_url}</p>
                </GlassCardContent>
              </GlassCard>
            )}

            {editedDna.source_transcript && (
              <GlassCard>
                <GlassCardContent className="p-4 space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground">Source Transcript</Label>
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
