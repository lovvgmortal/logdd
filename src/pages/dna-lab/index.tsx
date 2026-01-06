import { useState, useRef } from "react";
import { Dna, Plus, Search, ChevronRight, Upload, PenLine, Check, Trash2, Globe, Loader2, Sparkles, FileText, MessageSquare, Download } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDnas, DNA } from "@/hooks/useDnas";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useYoutubeComments } from "@/hooks/useYoutubeComments";
import { DNAPreview } from "@/components/dna/DNAPreview";
import { DNADetailView } from "@/components/dna/DNADetailView";
import { ExtractedDNA, ExtractionInput, ContentScanResult } from "@/lib/dna-extractor";
import { useUserSettings } from "@/hooks/useUserSettings";
import { ModelSelector } from "@/components/writer/ModelSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle2, RotateCw } from "lucide-react";
import { DNAList } from "./components";
import type { VideoVariant } from "./types";
import { createEmptyVariant } from "./types";
import { FeatureGate } from "@/components/subscription";

export default function DNALab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMainTab, setActiveMainTab] = useState("library");

  // View saved DNA detail
  const [viewingDna, setViewingDna] = useState<DNA | null>(null);

  // Import file ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract form state
  const [viralVariants, setViralVariants] = useState<VideoVariant[]>([createEmptyVariant()]);
  const [flopVariants, setFlopVariants] = useState<VideoVariant[]>([createEmptyVariant()]);
  const [overrideLogic, setOverrideLogic] = useState("");
  const [language, setLanguage] = useState("en");
  const [extracting, setExtracting] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [extractedDna, setExtractedDna] = useState<ExtractedDNA | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");

  // Scanner State
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ContentScanResult[] | null>(null);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [selectedScanKeys, setSelectedScanKeys] = useState<string[]>([]);

  // Manual write dialog state
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualDna, setManualDna] = useState({
    name: "",
    niche: "",
    tone: "",
    patterns: "",
    hookType: "",
    structure: "",
    pacing: "",
  });

  const { dnas, loading, extractDna, createDna, createDnaFromExtracted, updateDna, deleteDna, scanDnaContent, evolveDna } = useDnas();
  const { toast } = useToast();
  const { fetchComments, loading: fetchingComments } = useYoutubeComments();
  const [fetchingVariantId, setFetchingVariantId] = useState<string | null>(null);
  const { settings } = useUserSettings();

  const filteredDnas = dnas.filter(dna =>
    dna.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dna.niche?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Export DNA to JSON file
  const handleExportDna = (dna: DNA) => {
    const exportData = {
      name: dna.name,
      niche: dna.niche,
      hook_type: dna.hook_type,
      hook_examples: dna.hook_examples,
      structure: dna.structure,
      pacing: dna.pacing,
      retention_tactics: dna.retention_tactics,
      x_factors: dna.x_factors,
      tone: dna.tone,
      vocabulary: dna.vocabulary,
      patterns: dna.patterns,
      source_url: dna.source_url,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dna.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_dna.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Exported", description: "DNA exported successfully" });
  };

  // Import DNA from JSON file
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate required fields
      if (!importedData.name) {
        throw new Error("Invalid DNA file: missing name");
      }

      await createDna({
        name: importedData.name,
        niche: importedData.niche || null,
        hook_type: importedData.hook_type || null,
        hook_examples: importedData.hook_examples || null,
        structure: importedData.structure || null,
        pacing: importedData.pacing || null,
        retention_tactics: importedData.retention_tactics || null,
        x_factors: importedData.x_factors || null,
        tone: importedData.tone || null,
        vocabulary: importedData.vocabulary || null,
        patterns: importedData.patterns || null,
        source_url: importedData.source_url || null,
      });

      toast({ title: "Imported", description: `DNA "${importedData.name}" imported successfully` });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import DNA file",
        variant: "destructive"
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addViralVariant = () => {
    setViralVariants(prev => [...prev, createEmptyVariant()]);
  };

  const addFlopVariant = () => {
    setFlopVariants(prev => [...prev, createEmptyVariant()]);
  };

  const updateVariant = (
    type: "viral" | "flop",
    id: string,
    field: keyof VideoVariant,
    value: string
  ) => {
    const setter = type === "viral" ? setViralVariants : setFlopVariants;
    setter(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (type: "viral" | "flop", id: string) => {
    const setter = type === "viral" ? setViralVariants : setFlopVariants;
    setter(prev => prev.filter(v => v.id !== id));
  };

  const handleGetComments = async (type: "viral" | "flop", id: string, url: string) => {
    if (!url) {
      toast({ title: "Error", description: "Please enter a YouTube URL first", variant: "destructive" });
      return;
    }

    setFetchingVariantId(id);
    try {
      const comments = await fetchComments(url);
      if (comments && comments.length > 0) {
        // Format comments for display
        const formattedComments = comments
          .map((c, i) => `${i + 1}. [${c.likeCount} likes] ${c.author}: ${c.text}`)
          .join("\n\n");

        updateVariant(type, id, "comments", formattedComments);
        updateVariant(type, id, "activeTab", "comments");
      }
    } finally {
      setFetchingVariantId(null);
    }
  };

  // Step 1: Scan Content
  const handleScan = async () => {
    const hasContent = viralVariants.some(v => v.transcript || v.comments) || flopVariants.some(v => v.transcript || v.comments);

    if (!hasContent) {
      toast({ title: "Error", description: "Please add at least one video (viral or flop) with transcript or comments", variant: "destructive" });
      return;
    }

    setScanning(true);
    try {
      const input: ExtractionInput = {
        viralVideos: viralVariants
          .map(v => ({
            title: v.title,
            transcript: v.transcript,
            comments: v.comments,
            notes: v.notes,
          })),
        flopVideos: flopVariants
          .map(v => ({
            title: v.title,
            transcript: v.transcript,
            comments: v.comments,
            notes: v.notes,
          })),
        language,
      };

      const results = await scanDnaContent(input);
      if (results) {
        setScanResults(results);
        // Select all valid (non-outliers) by default
        setSelectedScanKeys(results.filter(r => !r.isOutlier).map(r => `${r.type}-${r.index}`));
        setShowScanDialog(true);
      }
    } finally {
      setScanning(false);
    }
  };

  // Step 2: Proceed with Extraction
  const handleProceedToExtract = async () => {
    if (selectedScanKeys.length === 0) {
      toast({ title: "Error", description: "Please select at least one video to analyze", variant: "destructive" });
      return;
    }

    setShowScanDialog(false);
    setExtracting(true);

    try {
      // Filter the inputs based on selection
      // We need to map back scan indices to actual video arrays.
      // scanContent returns results matching the order: [...virals, ...flops]
      // But scan results have a 'type' field now to help us.

      const selectedResults = scanResults?.filter(r => selectedScanKeys.includes(`${r.type}-${r.index}`));

      const selectedVirals = viralVariants.filter((_, idx) =>
        selectedResults?.some(r => r.type === "viral" && r.index === idx)
      );

      const selectedFlops = flopVariants.filter((_, idx) =>
        selectedResults?.some(r => r.type === "flop" && r.index === idx)
      );

      const input: ExtractionInput = {
        viralVideos: selectedVirals.map(v => ({
          title: v.title,
          transcript: v.transcript,
          comments: v.comments,
          notes: v.notes,
        })),
        flopVideos: selectedFlops.map(v => ({
          title: v.title,
          transcript: v.transcript,
          comments: v.comments,
          notes: v.notes,
        })),
        overrideLogic,
        language,
      };

      const result = await extractDna(input, selectedModel);

      if (result) {
        setExtractedDna(result);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveDna = async (dna: ExtractedDNA) => {
    setSaving(true);
    try {
      // Combine transcripts for source
      const sourceTranscript = viralVariants
        .filter(v => v.transcript)
        .map(v => v.transcript)
        .join("\n\n---\n\n");

      const sourceUrl = viralVariants[0]?.url || flopVariants[0]?.url;

      const saved = await createDnaFromExtracted(dna, sourceTranscript, sourceUrl);

      if (saved) {
        // Reset form
        setViralVariants([createEmptyVariant()]);
        setFlopVariants([createEmptyVariant()]);
        setOverrideLogic("");
        setShowPreview(false);
        setExtractedDna(null);
        setActiveMainTab("library");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setExtractedDna(null);
  };

  const handleManualCreate = async () => {
    if (!manualDna.name) {
      toast({ title: "Error", description: "Please enter a name for the DNA", variant: "destructive" });
      return;
    }

    await createDna({
      name: manualDna.name,
      niche: manualDna.niche,
      tone: manualDna.tone,
      patterns: manualDna.patterns ? manualDna.patterns.split(",").map(p => p.trim()) : null,
      hook_type: manualDna.hookType,
      structure: manualDna.structure ? manualDna.structure.split(",").map(s => s.trim()) : null,
      pacing: manualDna.pacing,
    });

    setManualDna({ name: "", niche: "", tone: "", patterns: "", hookType: "", structure: "", pacing: "" });
    setManualDialogOpen(false);
  };

  const renderVariantCard = (variant: VideoVariant, type: "viral" | "flop", index: number) => (
    <div key={variant.id} className="relative bg-muted/50 rounded-2xl p-4 space-y-4">
      <Badge
        className={`absolute -top-2 -left-2 ${type === "viral" ? "bg-green-500" : "bg-red-500"} text-white`}
      >
        #{index + 1}
      </Badge>

      {(type === "viral" ? viralVariants : flopVariants).length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() => removeVariant(type, variant.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
            <PenLine className="h-3 w-3" /> Title
          </Label>
          <Input
            placeholder="e.g., How I built a SaaS in 2 days"
            value={variant.title}
            onChange={(e) => updateVariant(type, variant.id, "title", e.target.value)}
            className="rounded-xl bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3 w-3" /> YouTube URL
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://youtube.com/"
              value={variant.url}
              onChange={(e) => updateVariant(type, variant.id, "url", e.target.value)}
              className="rounded-xl bg-background flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => handleGetComments(type, variant.id, variant.url)}
              disabled={fetchingVariantId === variant.id}
            >
              {fetchingVariantId === variant.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Get"
              )}
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={variant.activeTab}
        onValueChange={(v) => updateVariant(type, variant.id, "activeTab", v)}
        className="w-full"
      >
        <TabsList className="bg-background/50 w-full justify-start">
          <TabsTrigger value="transcript" className="flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Script / Transcript
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3" /> Comments / Feedback
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transcript" className="mt-2">
          <Textarea
            placeholder="Paste content here..."
            value={variant.transcript}
            onChange={(e) => updateVariant(type, variant.id, "transcript", e.target.value)}
            className="min-h-[120px] rounded-xl bg-background resize-none"
          />
        </TabsContent>
        <TabsContent value="comments" className="mt-2">
          <Textarea
            placeholder="Paste comments or feedback here..."
            value={variant.comments}
            onChange={(e) => updateVariant(type, variant.id, "comments", e.target.value)}
            className="min-h-[120px] rounded-xl bg-background resize-none"
          />
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3 w-3" /> Description / Notes
        </Label>
        <Textarea
          placeholder="e.g., A quick breakdown of the tech stack..."
          value={variant.notes}
          onChange={(e) => updateVariant(type, variant.id, "notes", e.target.value)}
          className="min-h-[80px] rounded-xl bg-background resize-none"
        />
      </div>
    </div>
  );

  // Show DNA detail view
  if (viewingDna) {
    return (
      <DNADetailView
        dna={viewingDna}
        onBack={() => setViewingDna(null)}
        onUpdate={(updates) => updateDna(viewingDna.id, updates)}
        onExport={handleExportDna}
        onEvolve={(newContent) => evolveDna(viewingDna.id, newContent)}
      />
    );
  }

  // Show preview if DNA is extracted
  if (showPreview && extractedDna) {
    return (
      <DNAPreview
        dna={extractedDna}
        onSave={handleSaveDna}
        onCancel={handleCancelPreview}
        saving={saving}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DNA Lab</h1>
          <p className="text-muted-foreground">Extract viral patterns from successful content</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <Button variant="outline" className="gap-2 rounded-xl" onClick={handleImportClick}>
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl">
                <PenLine className="h-4 w-4" />
                Write
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create DNA Manually</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., Storytelling Master"
                    value={manualDna.name}
                    onChange={(e) => setManualDna(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Niche</Label>
                    <Input
                      placeholder="e.g., Technology"
                      value={manualDna.niche}
                      onChange={(e) => setManualDna(prev => ({ ...prev, niche: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tone</Label>
                    <Input
                      placeholder="e.g., Energetic"
                      value={manualDna.tone}
                      onChange={(e) => setManualDna(prev => ({ ...prev, tone: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hook Type</Label>
                  <Input
                    placeholder="e.g., Question, Story, Statistic"
                    value={manualDna.hookType}
                    onChange={(e) => setManualDna(prev => ({ ...prev, hookType: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Patterns (comma separated)</Label>
                  <Input
                    placeholder="e.g., Emotional Hook, Three-Act Structure"
                    value={manualDna.patterns}
                    onChange={(e) => setManualDna(prev => ({ ...prev, patterns: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Structure (comma separated)</Label>
                  <Input
                    placeholder="e.g., Hook, Problem, Solution, CTA"
                    value={manualDna.structure}
                    onChange={(e) => setManualDna(prev => ({ ...prev, structure: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pacing</Label>
                  <Input
                    placeholder="e.g., Fast-paced with quick cuts"
                    value={manualDna.pacing}
                    onChange={(e) => setManualDna(prev => ({ ...prev, pacing: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <Button onClick={handleManualCreate} className="w-full rounded-xl">
                  Create DNA
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            className="gap-2 rounded-xl shadow-lg shadow-primary/20"
            onClick={() => setActiveMainTab("extract")}
          >
            <Plus className="h-4 w-4" />
            Extract New DNA
          </Button>
        </div>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="library" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Library
          </TabsTrigger>
          <TabsTrigger value="extract" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            Extract
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <DNAList
            dnas={dnas}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onView={setViewingDna}
            onExport={handleExportDna}
            onDelete={deleteDna}
          />
        </TabsContent>

        <TabsContent value="extract" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Virals Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500">
                <Check className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Virals</h3>
              </div>
              <div className="space-y-6">
                {viralVariants.map((variant, index) => renderVariantCard(variant, "viral", index))}
              </div>
              <FeatureGate feature="batch_dna" hideCompletely>
                <Button
                  variant="secondary"
                  className="w-full rounded-xl gap-2"
                  onClick={addViralVariant}
                >
                  <Plus className="h-4 w-4" />
                  Add Viral
                </Button>
              </FeatureGate>
            </div>

            {/* Flops Section - Pro Only */}
            <FeatureGate feature="flop_analysis">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <Trash2 className="h-5 w-5" />
                  <h3 className="font-semibold text-lg">Flops</h3>
                </div>
                <div className="space-y-6">
                  {flopVariants.map((variant, index) => renderVariantCard(variant, "flop", index))}
                </div>
                <Button
                  variant="secondary"
                  className="w-full rounded-xl gap-2"
                  onClick={addFlopVariant}
                >
                  <Plus className="h-4 w-4" />
                  Add Flop
                </Button>
              </div>
            </FeatureGate>
          </div>

          {/* Bottom Controls */}
          <GlassCard className="sticky bottom-4">
            <GlassCardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label className="text-xs uppercase text-muted-foreground">Override Logic</Label>
                  <Input
                    placeholder="Override default analysis logic..."
                    value={overrideLogic}
                    onChange={(e) => setOverrideLogic(e.target.value)}
                    className="rounded-xl bg-muted"
                  />
                </div>
                <div className="flex gap-4 w-full lg:w-auto items-end">
                  <div className="space-y-2 flex-1 lg:flex-none">
                    <ModelSelector
                      value={selectedModel}
                      onChange={setSelectedModel}
                      label="AI Model"
                      compact={false}
                    />
                  </div>
                  <div className="space-y-2 flex-1 lg:flex-none">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Language
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-full lg:w-[140px] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                        <SelectItem value="ko">한국어 (Korean)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleScan}
                    disabled={scanning || extracting}
                    className="gap-2 rounded-xl px-6 h-10"
                  >
                    {scanning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4" />
                    )}
                    {scanning ? "Scanning..." : "Analyze & Extract DNA"}
                  </Button>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>
      {/* Scan Review Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Content Pre-Scan Results</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 text-blue-500 rounded-lg border border-blue-500/20">
              <RotateCw className="h-5 w-5" />
              <p className="text-sm">We scanned your inputs. Review and uncheck any outliers (e.g., wrong niche/tone) before deep analysis.</p>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {scanResults?.map((res) => {
                const uniqueKey = `${res.type}-${res.index}`;
                return (
                  <div key={uniqueKey} className={`flex items-start gap-3 p-3 rounded-lg border ${res.isOutlier ? 'bg-red-500/5 border-red-500/20' : 'bg-card border-border'}`}>
                    <Checkbox
                      checked={selectedScanKeys.includes(uniqueKey)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedScanKeys(prev => [...prev, uniqueKey]);
                        else setSelectedScanKeys(prev => prev.filter(key => key !== uniqueKey));
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm truncate">{res.title || `${res.type === 'viral' ? 'Viral' : 'Flop'} Video #${res.index + 1}`}</h4>
                        {res.isOutlier && <Badge variant="destructive" className="text-[10px] h-5">Outlier</Badge>}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="font-semibold text-foreground">Topic:</span> {res.topic}</span>
                        <span className="flex items-center gap-1"><span className="font-semibold text-foreground">Tone:</span> {res.tone}</span>
                        <span className="flex items-center gap-1"><span className="font-semibold text-foreground">Quality:</span> {res.qualityScore}/100</span>
                      </div>
                      {res.reason && <p className="text-xs text-red-500 italic mt-1">⚠️ {res.reason}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowScanDialog(false)}>Cancel</Button>
              <Button onClick={handleProceedToExtract} disabled={selectedScanKeys.length === 0}>
                Proceed with {selectedScanKeys.length} Videos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
