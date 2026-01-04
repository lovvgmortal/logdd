import { useState } from "react";
import {
  Save, X, Plus, Trash2, ChevronDown, ChevronRight,
  Brain, Target, MessageSquare, Zap, AlertTriangle,
  Shield, Sparkles, XCircle, FileText, Music, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExtractedDNA } from "@/lib/dna-extractor";

interface DNAPreviewProps {
  dna: ExtractedDNA;
  onSave: (dna: ExtractedDNA) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function DNAPreview({ dna, onSave, onCancel, saving }: DNAPreviewProps) {
  const [editedDna, setEditedDna] = useState<ExtractedDNA>(dna);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const updateField = <K extends keyof ExtractedDNA>(field: K, value: ExtractedDNA[K]) => {
    setEditedDna(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = <K extends keyof ExtractedDNA>(
    field: K,
    nestedField: string,
    value: unknown
  ) => {
    setEditedDna(prev => ({
      ...prev,
      [field]: { ...(prev[field] as Record<string, unknown>), [nestedField]: value }
    }));
  };

  const addArrayItem = (field: keyof ExtractedDNA, defaultValue: string = "") => {
    const currentArray = editedDna[field] as string[];
    updateField(field, [...currentArray, defaultValue]);
  };

  const updateArrayItem = (field: keyof ExtractedDNA, index: number, value: string) => {
    const currentArray = [...(editedDna[field] as string[])];
    currentArray[index] = value;
    updateField(field, currentArray);
  };

  const removeArrayItem = (field: keyof ExtractedDNA, index: number) => {
    const currentArray = (editedDna[field] as string[]).filter((_, i) => i !== index);
    updateField(field, currentArray);
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const totalWords = editedDna.structuralSkeleton.reduce((acc, section) => {
    return acc + (section.wordCount || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between p-4 max-w-[1600px] mx-auto">
          <Button variant="ghost" onClick={onCancel} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Input
            value={editedDna.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="max-w-md text-center text-lg font-semibold bg-transparent border-none focus-visible:ring-1"
            placeholder="DNA Name"
          />
          <Button onClick={() => onSave(editedDna)} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            Save DNA
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Column */}
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
                  value={editedDna.niche}
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
                  value={editedDna.targetWordCount || ""}
                  onChange={(e) => updateField("targetWordCount", parseInt(e.target.value) || 0)}
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
                    value={editedDna.linguisticFingerprint.personaRole}
                    onChange={(e) => updateNestedField("linguisticFingerprint", "personaRole", e.target.value)}
                    placeholder="e.g., The Financial Realist Mentor"
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tone Analysis</Label>
                  <Textarea
                    value={editedDna.linguisticFingerprint.toneAnalysis}
                    onChange={(e) => updateNestedField("linguisticFingerprint", "toneAnalysis", e.target.value)}
                    placeholder="Describe the tone..."
                    className="min-h-[80px] bg-muted/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Signature Keywords</Label>
                  <Input
                    value={editedDna.linguisticFingerprint.signatureKeywords.join(", ")}
                    onChange={(e) => updateNestedField("linguisticFingerprint", "signatureKeywords", e.target.value.split(",").map(s => s.trim()))}
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
                    value={editedDna.hookAngle.angleCategory}
                    onChange={(e) => updateNestedField("hookAngle", "angleCategory", e.target.value)}
                    placeholder="e.g., Negative, Curiosity, Paradox..."
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Deconstruction</Label>
                  <Textarea
                    value={editedDna.hookAngle.deconstruction}
                    onChange={(e) => updateNestedField("hookAngle", "deconstruction", e.target.value)}
                    placeholder="How the hook works psychologically..."
                    className="min-h-[80px] bg-muted/50 resize-none"
                  />
                </div>
              </GlassCardContent>
            </GlassCard>

            {/* Pacing */}
            <GlassCard>
              <GlassCardContent className="p-4 space-y-4">
                <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                  <Music className="h-3 w-3" /> Pacing (Linguistic Rhythm)
                </Label>

                <Textarea
                  value={editedDna.pacingAndTone.pacing}
                  onChange={(e) => updateNestedField("pacingAndTone", "pacing", e.target.value)}
                  placeholder="Describe the pacing..."
                  className="min-h-[100px] bg-muted/50 resize-none"
                />
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
                    Est. Total: <span className="text-foreground font-medium">{totalWords} words</span>
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
                          placeholder="Words"
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
                        {/* Row 1: Tone (Section-specific) */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground">Section Tone</Label>
                          <Input
                            value={section.tone || ""}
                            onChange={(e) => {
                              const newSkeleton = [...editedDna.structuralSkeleton];
                              newSkeleton[index] = { ...section, tone: e.target.value };
                              updateField("structuralSkeleton", newSkeleton);
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
                              const newSkeleton = [...editedDna.structuralSkeleton];
                              newSkeleton[index] = { ...section, pacing: e.target.value };
                              updateField("structuralSkeleton", newSkeleton);
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
                              const newSkeleton = [...editedDna.structuralSkeleton];
                              newSkeleton[index] = { ...section, contentFocus: e.target.value };
                              updateField("structuralSkeleton", newSkeleton);
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
                                const newSkeleton = [...editedDna.structuralSkeleton];
                                newSkeleton[index] = { ...section, microHook: e.target.value };
                                updateField("structuralSkeleton", newSkeleton);
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
                                const newSkeleton = [...editedDna.structuralSkeleton];
                                newSkeleton[index] = { ...section, openLoop: e.target.value };
                                updateField("structuralSkeleton", newSkeleton);
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
                              const newSkeleton = [...editedDna.structuralSkeleton];
                              newSkeleton[index] = { ...section, viralTriggers: e.target.value };
                              updateField("structuralSkeleton", newSkeleton);
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
                              const newSkeleton = [...editedDna.structuralSkeleton];
                              newSkeleton[index] = { ...section, mustInclude: e.target.value.split(",").map(s => s.trim()) };
                              updateField("structuralSkeleton", newSkeleton);
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
                                const newSkeleton = [...editedDna.structuralSkeleton];
                                newSkeleton[index] = { ...section, audienceInteraction: e.target.value };
                                updateField("structuralSkeleton", newSkeleton);
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
                                const newSkeleton = [...editedDna.structuralSkeleton];
                                newSkeleton[index] = { ...section, audienceValue: e.target.value };
                                updateField("structuralSkeleton", newSkeleton);
                              }}
                              className="min-h-[60px] bg-muted/30 text-xs resize-none border-orange-500/30 focus:border-orange-500/50"
                              placeholder="What value does the viewer get? (Mandatory)"
                            />
                          </div>
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
                  className="w-full text-muted-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Detailed Section
                </Button>
              </GlassCardContent>
            </GlassCard>

            {/* Pattern Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* High Dopamine */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-yellow-500 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> High Dopamine (Keep)
                  </Label>
                  <div className="space-y-2">
                    {editedDna.highDopamine.map((item, index) => (
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
                    {editedDna.confusionPoints.map((item, index) => (
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
                    {editedDna.objections.map((item, index) => (
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
                    Add Objections
                  </Button>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Second Row Pattern Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Core Patterns */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-green-500 flex items-center gap-1.5">
                    <Shield className="h-3 w-3" /> Core Patterns (70% Safe)
                  </Label>
                  <div className="space-y-2">
                    {editedDna.corePatterns.map((item, index) => (
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
                    Add Core
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Viral X-Factors */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-purple-500 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Viral X-Factors (30% Magic)
                  </Label>
                  <div className="space-y-2">
                    {editedDna.viralXFactors.map((item, index) => (
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
                    Add Viral
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Flop Avoidance */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-red-400 flex items-center gap-1.5">
                    <XCircle className="h-3 w-3" /> Flop Avoidance
                  </Label>
                  <div className="space-y-2">
                    {editedDna.flopAvoidance.map((item, index) => (
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
                    Add Flop
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
                    <Zap className="h-3 w-3" /> Hook Examples
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    AI learns from these patterns. DO NOT copy exact wording.
                  </p>
                  <div className="space-y-2">
                    {(editedDna.hook_examples || []).map((item, index) => (
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
                    Add Example
                  </Button>
                </GlassCardContent>
              </GlassCard>

              {/* Audience Psychology */}
              <GlassCard>
                <GlassCardContent className="p-4 space-y-3">
                  <Label className="text-xs uppercase text-purple-500 flex items-center gap-1.5">
                    <Brain className="h-3 w-3" /> Audience Psychology
                  </Label>
                  <Textarea
                    value={editedDna.audiencePsychology}
                    onChange={(e) => updateField("audiencePsychology", e.target.value)}
                    placeholder="Describe the audience's emotional state, fears, desires..."
                    className="min-h-[120px] bg-muted/50 resize-none"
                  />
                </GlassCardContent>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
