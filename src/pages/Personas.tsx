import { useState } from "react";
import { Users, Plus, Search, ChevronRight, Brain, Target, MessageCircle, Trash2, Edit, Loader2, Sparkles, Shield, Zap, Youtube, Link as LinkIcon, Download, Globe } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { usePersonas, Persona } from "@/hooks/usePersonas";
import { useYoutubeComments } from "@/hooks/useYoutubeComments";

const COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-pink-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

const AVAILABLE_MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Fast)" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro (Quality)" },
  { value: "anthropic/claude-sonnet-4.5", label: "Claude 4.5 Sonnet (Reasoning)" },
  { value: "openai/gpt-5.2", label: "GPT-5.2 (SOTA)" },
  { value: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B (Free)" },
];

export default function Personas() {
  const { personas, loading, createPersona, updatePersona, deletePersona, analyzePersona } = usePersonas();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [knowledgeLevel, setKnowledgeLevel] = useState("intermediate");
  const [painPoints, setPainPoints] = useState("");
  const [preferredTone, setPreferredTone] = useState("");
  const [platform, setPlatform] = useState("");
  const [targetCountry, setTargetCountry] = useState("");
  const [description, setDescription] = useState("");

  // New Analysis Fields (Multi-source)
  interface ContentSource {
    id: string;
    script: string;
    youtubeUrl: string;
    comments: string;
    fetchedCommentsCount?: number;
  }

  const [sources, setSources] = useState<ContentSource[]>([
    { id: "1", script: "", youtubeUrl: "", comments: "" }
  ]);

  // New Data Fields
  const [motivations, setMotivations] = useState("");
  const [objections, setObjections] = useState("");

  // Comment limit slider
  const [commentLimit, setCommentLimit] = useState(200);

  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].value);

  // We'll reuse this hook, but we might need to handle it per-source or just use it generally
  const { fetchComments, loading: loadingComments } = useYoutubeComments();



  const filteredPersonas = personas.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setAgeRange("");
    setKnowledgeLevel("intermediate");
    setPainPoints("");
    setPreferredTone("");
    setPlatform("");
    setDescription("");
    // Reset to one empty source
    setSources([{ id: crypto.randomUUID(), script: "", youtubeUrl: "", comments: "" }]);

    setMotivations("");
    setObjections("");
    setTargetCountry("");

    setEditingPersona(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (persona: Persona) => {
    setEditingPersona(persona);
    setName(persona.name);
    setAgeRange(persona.age_range || "");
    setKnowledgeLevel(persona.knowledge_level || "intermediate");
    setPainPoints(persona.pain_points?.join(", ") || "");
    setPreferredTone(persona.preferred_tone || "");
    setPlatform(persona.platform || "");
    setDescription(persona.description || "");
    setMotivations(persona.motivations?.join(", ") || "");
    setObjections(persona.objections?.join(", ") || "");
    setTargetCountry(persona.target_country || "");

    if (persona.content_sources && Array.isArray(persona.content_sources) && persona.content_sources.length > 0) {
      setSources(persona.content_sources);
    } else {
      // Backwards compatibility or empty
      setSources([{ id: crypto.randomUUID(), script: "", youtubeUrl: "", comments: "" }]);
    }

    setDialogOpen(true);
  };

  const updateSource = (id: string, field: keyof ContentSource, value: any) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSource = () => {
    setSources(prev => [...prev, { id: crypto.randomUUID(), script: "", youtubeUrl: "", comments: "" }]);
  };

  const removeSource = (id: string) => {
    if (sources.length > 1) {
      setSources(prev => prev.filter(s => s.id !== id));
    }
  };

  // Fetch comments for a specific source
  const handleFetchCommentsForSource = async (sourceId: string, url: string, limit: number) => {
    if (!url) return;
    const fetched = await fetchComments(url, limit);
    if (fetched && fetched.length > 0) {
      const commentText = fetched.map(c => `- ${c.author}: ${c.text} (${c.likeCount} likes)`).join("\n");
      // Append or replace? Let's append to existing if any
      setSources(prev => prev.map(s => {
        if (s.id === sourceId) {
          const newComments = s.comments ? `${s.comments}\n\n${commentText}` : commentText;
          return { ...s, comments: newComments, fetchedCommentsCount: fetched.length };
        }
        return s;
      }));
    }
  };

  const handleAnalyze = async () => {
    // Aggregate data
    const fullTranscript = sources.map(s => s.script).filter(Boolean).join("\n\n-- NEXT SOURCE --\n\n");
    const fullComments = sources.map(s => s.comments).filter(Boolean).join("\n\n-- NEXT SOURCE --\n\n");

    if (!fullTranscript && !fullComments) return;

    setAnalyzing(true);
    try {
      // Pass selectedModel as the override
      const result = await analyzePersona(undefined, fullTranscript, fullComments, selectedModel);

      if (result) {
        setName(result.name || name);
        setAgeRange(result.ageRange || ageRange);
        setKnowledgeLevel(result.knowledgeLevel || knowledgeLevel);

        // Handle painPoints (string[] or object[])
        if (Array.isArray(result.painPoints)) {
          const painPointsText = result.painPoints.map(p => typeof p === 'string' ? p : p.text).join(", ");
          setPainPoints(painPointsText || painPoints);
        }

        setPreferredTone(result.preferredTone || preferredTone);
        setPlatform(result.platform || platform);
        setTargetCountry(result.targetCountry || targetCountry);

        // Handle motivations (string[] or object[])
        if (Array.isArray(result.motivations)) {
          const motivationsText = result.motivations.map(m => typeof m === 'string' ? m : m.text).join(", ");
          setMotivations(motivationsText || motivations);
        }

        // Handle objections (string[] or object[])
        if (Array.isArray(result.objections)) {
          const objectionsText = result.objections.map(o => typeof o === 'string' ? o : o.text).join(", ");
          setObjections(objectionsText || objections);
        }

        // Store extended fields for saving (we'll add state for these)
        if (result.knowledgeProfile || result.demographics || result.contentConsumption) {
          // @ts-ignore - Add to window temporary storage for now
          window.__tempPersonaExtended = {
            knowledge_profile: result.knowledgeProfile,
            demographics: result.demographics,
            content_consumption: result.contentConsumption
          };
        }
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    const personaData: any = {
      name,
      age_range: ageRange || null,
      knowledge_level: knowledgeLevel || null,
      target_country: targetCountry || null,
      pain_points: painPoints ? painPoints.split(",").map(p => p.trim()).filter(Boolean) : null,
      preferred_tone: preferredTone || null,
      platform: platform || null,
      description: description || null,
      motivations: motivations ? motivations.split(",").map(p => p.trim()).filter(Boolean) : null,
      objections: objections ? objections.split(",").map(p => p.trim()).filter(Boolean) : null,
      content_sources: sources, // Save sources
    };

    // Include extended fields if available (from AI analysis)
    // @ts-ignore
    if (window.__tempPersonaExtended) {
      // @ts-ignore
      const extended = window.__tempPersonaExtended;
      if (extended.knowledge_profile) personaData.knowledge_profile = extended.knowledge_profile;
      if (extended.demographics) personaData.demographics = extended.demographics;
      if (extended.content_consumption) personaData.content_consumption = extended.content_consumption;
      // @ts-ignore
      delete window.__tempPersonaExtended; // Cleanup
    }

    setSaving(true);
    if (editingPersona) {
      // @ts-ignore - id mismatch?
      await updatePersona(editingPersona.id, personaData);
    } else {
      // @ts-ignore
      await createPersona(personaData);
    }
    setSaving(false);
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deletePersona(id);
  };

  const getKnowledgeValue = (level: string | null) => {
    switch (level) {
      case "complete-beginner": return 20;
      case "beginner": return 40;
      case "intermediate": return 60;
      case "advanced": return 80;
      case "expert": return 100;
      default: return 50;
    }
  };

  const getRandomColor = (index: number) => COLORS[index % COLORS.length];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audience Personas</h1>
          <p className="text-muted-foreground">Define and manage your target audiences (Manual or AI Analyzed)</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          Create Persona
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search personas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl bg-card/50"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPersonas.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No personas yet. Create your first one!</p>
        </div>
      ) : (
        /* Personas Grid */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPersonas.map((persona, index) => (
            <GlassCard key={persona.id} variant="elevated" className="group">
              <GlassCardHeader>
                <div className="flex items-start justify-between">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`${getRandomColor(index)} text-primary-foreground font-semibold`}>
                      {persona.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(persona)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(persona.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <GlassCardTitle className="mt-3">{persona.name}</GlassCardTitle>
                <GlassCardDescription>
                  {persona.age_range && `Age ${persona.age_range}`}
                  {persona.age_range && (persona.target_country || persona.platform) && " • "}
                  {persona.target_country && (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {persona.target_country}
                    </span>
                  )}
                  {persona.target_country && persona.platform && " • "}
                  {persona.platform}
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                {/* Knowledge Level */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Brain className="h-4 w-4" />
                      Knowledge
                    </span>
                    <span className="font-medium capitalize">{persona.knowledge_level || "Intermediate"}</span>
                  </div>
                  <Progress
                    value={getKnowledgeValue(persona.knowledge_level)}
                    className="h-1.5"
                  />
                </div>

                {/* Knowledge Profile (Extended) */}
                {persona.knowledge_profile && (
                  <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-xs font-semibold text-primary">3D Knowledge Profile</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-bold text-lg text-primary">{persona.knowledge_profile.domainKnowledge}</div>
                        <div className="text-muted-foreground">Domain</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-primary">{persona.knowledge_profile.engagementDepth}</div>
                        <div className="text-muted-foreground">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-primary">{persona.knowledge_profile.skepticismLevel}</div>
                        <div className="text-muted-foreground">Skepticism</div>
                      </div>
                    </div>
                    {persona.knowledge_profile.reasoning && (
                      <p className="text-xs text-muted-foreground italic">{persona.knowledge_profile.reasoning}</p>
                    )}
                  </div>
                )}

                {/* Pain Points */}
                {persona.pain_points && persona.pain_points.length > 0 && (
                  <div className="space-y-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      Pain Points
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {persona.pain_points.slice(0, 2).map((point, idx) => {
                        const text = typeof point === 'string' ? point : point.text;
                        const intensity = typeof point === 'object' && point.intensity ? point.intensity : null;
                        return (
                          <span
                            key={idx}
                            className={`rounded-lg px-2 py-1 text-xs font-medium ${intensity === 'high' ? 'bg-red-500/20 text-red-600' :
                              intensity === 'medium' ? 'bg-orange-500/20 text-orange-600' :
                                intensity === 'low' ? 'bg-yellow-500/20 text-yellow-600' :
                                  'bg-accent text-accent-foreground'
                              }`}
                          >
                            {text}
                          </span>
                        );
                      })}
                      {persona.pain_points.length > 2 && (
                        <span className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                          +{persona.pain_points.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Demographics (Extended) */}
                {persona.demographics && (
                  <div className="space-y-1.5 text-xs">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <Users className="h-4 w-4" />
                      Demographics Inference
                    </span>
                    {persona.demographics.ageEvidence && (
                      <div><span className="text-muted-foreground">Age:</span> {persona.demographics.ageEvidence}</div>
                    )}
                    {persona.demographics.occupationInference && (
                      <div><span className="text-muted-foreground">Occupation:</span> {persona.demographics.occupationInference}</div>
                    )}
                    {persona.demographics.digitalFluency && (
                      <div><span className="text-muted-foreground">Digital Fluency:</span> <span className="capitalize">{persona.demographics.digitalFluency}</span></div>
                    )}
                  </div>
                )}

                {/* Content Consumption (Extended) */}
                {persona.content_consumption && (
                  <div className="space-y-1.5 text-xs">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <Target className="h-4 w-4" />
                      Content Preferences
                    </span>
                    {persona.content_consumption.attentionSpan && (
                      <div><span className="text-muted-foreground">Attention:</span> <span className="capitalize">{persona.content_consumption.attentionSpan}</span></div>
                    )}
                    {persona.content_consumption.engagementTriggers && persona.content_consumption.engagementTriggers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {persona.content_consumption.engagementTriggers.map(trigger => (
                          <span key={trigger} className="rounded-md bg-blue-500/10 text-blue-600 px-1.5 py-0.5 text-xs">{trigger}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Motivations (New) */}
                {persona.motivations && persona.motivations.length > 0 && (
                  <div className="space-y-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      Motivations
                    </span>
                    <p className="text-xs text-foreground/80 line-clamp-1">
                      {Array.isArray(persona.motivations) && typeof persona.motivations[0] === 'string'
                        ? persona.motivations.join(", ")
                        : persona.motivations.map((m: any) => m.text || m).join(", ")}
                    </p>
                  </div>
                )}

                {/* Tone */}
                {persona.preferred_tone && (
                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-border/50">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tone:</span>
                    <span className="font-medium">{persona.preferred_tone}</span>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPersona ? "Edit Persona" : "Create Audience Persona"}</DialogTitle>
            <DialogDescription>
              Define your target audience manually or analyze content to reverse-engineer them.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Description</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Content (AI)</TabsTrigger>
            </TabsList>

            {/* TAB: MANUAL */}
            <TabsContent value="manual" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your target audience... e.g., Young professionals aged 25-35..."
                  className="min-h-[80px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={analyzing || !description}
                  className="w-full"
                >
                  {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Format Description with AI
                </Button>
              </div>
            </TabsContent>

            {/* TAB: ANALYZE */}
            <TabsContent value="analyze" className="space-y-6 py-4">
              <div className="space-y-4">
                {sources.map((source, index) => (
                  <div key={source.id} className="relative rounded-xl border border-border bg-muted/10 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs border border-primary/20">Source #{index + 1}</span>
                      </h4>
                      {sources.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeSource(source.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Left Column: Script */}
                      <div className="space-y-2">
                        <Label>Script / Transcript</Label>
                        <Textarea
                          value={source.script}
                          onChange={(e) => updateSource(source.id, "script", e.target.value)}
                          placeholder="Paste video transcript here..."
                          className="min-h-[120px] resize-none"
                        />
                      </div>

                      {/* Right Column: YouTube & Comments */}
                      <div className="space-y-3">
                        {/* YouTube Fetcher (Mini version) */}
                        <div className="space-y-2">
                          <Label>Import from YouTube (Optional)</Label>
                          <div className="flex gap-2">
                            <div className="flex-1 relative">
                              <LinkIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                value={source.youtubeUrl}
                                onChange={(e) => updateSource(source.id, "youtubeUrl", e.target.value)}
                                placeholder="https://youtube.com/..."
                                className="pl-8 h-8 text-xs"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 px-2"
                              onClick={() => handleFetchCommentsForSource(source.id, source.youtubeUrl, commentLimit)}
                              disabled={loadingComments || !source.youtubeUrl}
                            >
                              {loadingComments ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                            </Button>
                          </div>
                          {/* Comment Limit Slider */}
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={50}
                              max={500}
                              step={50}
                              value={commentLimit}
                              onChange={(e) => setCommentLimit(Number(e.target.value))}
                              className="flex-1 h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                            />
                            <span className="text-xs text-muted-foreground w-16 text-right">{commentLimit} max</span>
                          </div>
                        </div>

                        {/* Comments Area */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Comments</Label>
                            {source.fetchedCommentsCount ? (
                              <span className="text-[10px] text-green-600 font-medium">
                                {source.fetchedCommentsCount} fetched
                              </span>
                            ) : null}
                          </div>
                          <Textarea
                            value={source.comments}
                            onChange={(e) => updateSource(source.id, "comments", e.target.value)}
                            placeholder="Community comments..."
                            className="min-h-[80px] resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full border-dashed text-muted-foreground hover:text-foreground hover:border-primary/50"
                  onClick={addSource}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Another Source
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  variant="default"
                  size="default"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full bg-violet-600 hover:bg-violet-700 h-10 text-md shadow-lg shadow-violet-500/20"
                >
                  {analyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                  Reverse-Engineer Audience with AI
                </Button>
              </div>
            </TabsContent>
          </Tabs>


          <div className="grid gap-4 py-4 border-t border-border">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tech Enthusiast" />
              </div>
              <div className="space-y-2">
                <Label>Age Range</Label>
                <Input value={ageRange} onChange={(e) => setAgeRange(e.target.value)} placeholder="e.g., 25-35" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Knowledge Level</Label>
                <Select value={knowledgeLevel} onValueChange={setKnowledgeLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete-beginner">1 - Complete Beginner</SelectItem>
                    <SelectItem value="beginner">2 - Beginner</SelectItem>
                    <SelectItem value="intermediate">3 - Intermediate</SelectItem>
                    <SelectItem value="advanced">4 - Advanced</SelectItem>
                    <SelectItem value="expert">5 - Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Target Country / Region</Label>
                <Input
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  placeholder="e.g., USA, UK, Vietnam, Japan, Global..."
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred Tone</Label>
                <Input
                  value={preferredTone}
                  onChange={(e) => setPreferredTone(e.target.value)}
                  placeholder="Casual & Direct, Motivational"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pain Points</Label>
              <Input
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
                placeholder="Time management, Career growth..."
              />
            </div>

            {/* NEW FIELDS */}
            <div className="space-y-2">
              <Label>Motivations (Why they watch)</Label>
              <Input
                value={motivations}
                onChange={(e) => setMotivations(e.target.value)}
                placeholder="To get rich quick, To feel validated..."
              />
            </div>
            <div className="space-y-2">
              <Label>Objections (Why they skip)</Label>
              <Input
                value={objections}
                onChange={(e) => setObjections(e.target.value)}
                placeholder="Too complicated, Fake guru vibes..."
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
            <div className="w-[200px]">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select AI Model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingPersona ? "Update" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
