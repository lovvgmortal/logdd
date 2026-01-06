import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PenTool, Sparkles, Dna, Users, Lightbulb, Loader2, RefreshCw, ChevronRight, Edit2, Save, Clock, FileText, History as HistoryIcon, Plus, Trash2, Star, Check, X, Copy, Tag, TrendingUp, TrendingDown, ChevronDown, ChevronUp, MessageSquare, Globe } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePersonas } from "@/hooks/usePersonas";
import { Checkbox } from "@/components/ui/checkbox";
import { useDnas } from "@/hooks/useDnas";
import { useScripts, VersionEntry } from "@/hooks/useScripts";
import { useToast } from "@/hooks/use-toast";
import { WordCount } from "@/components/ui/word-count";
import { ModelSelector } from "@/components/writer/ModelSelector";
import { ScoreDisplay } from "@/components/writer/ScoreDisplay";
import { VersionHistory } from "@/components/writer/VersionHistory";
import type { GeneratedOutline, OutlineSection, ScoreResult } from "@/lib/script-generator";
import { ModeSelector, StepIndicator, WriterTitle } from "./components";
import type { WriterMode, WriterStep, OutlineVersion, ReferenceItem } from "./types";
import { createEmptyReference } from "./types";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "@/components/subscription";

export default function Writer() {
  const navigate = useNavigate();
  const { id: scriptId } = useParams();
  const { toast } = useToast();
  const { personas } = usePersonas();
  const { dnas } = useDnas();
  const { scripts, generateOutline, generateScriptFromOutline, generateScriptSectionBySection, scoreScript, createScript, updateScript, suggestUniqueAngle, rewriteSection, generateSEO } = useScripts();

  const [writerMode, setWriterMode] = useState<WriterMode>("select");
  const [currentStep, setCurrentStep] = useState<WriterStep>("input");

  // Separate models for each step
  const [outlineModel, setOutlineModel] = useState("google/gemini-3-flash-preview");
  const [scriptModel, setScriptModel] = useState("google/gemini-3-flash-preview");

  const [selectedPersona, setSelectedPersona] = useState("");
  const [selectedDna, setSelectedDna] = useState("");
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("US");
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);

  // Project title
  const [projectTitle, setProjectTitle] = useState("New Script");
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  // Step 1: Input fields
  const [topic, setTopic] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [uniqueAngle, setUniqueAngle] = useState("");
  const [targetWordCount, setTargetWordCount] = useState<number>(1000);
  const [allowStructureInnovation, setAllowStructureInnovation] = useState(false);
  const [competitorScript, setCompetitorScript] = useState("");

  const [viralReferences, setViralReferences] = useState<ReferenceItem[]>([]);
  const [flopReferences, setFlopReferences] = useState<ReferenceItem[]>([]);
  const [viralOpen, setViralOpen] = useState(false);
  const [flopOpen, setFlopOpen] = useState(false);

  // Step 2: Outline with history
  const [outline, setOutline] = useState<GeneratedOutline | null>(null);
  const [outlineHistory, setOutlineHistory] = useState<OutlineVersion[]>([]);
  const [currentOutlineVersionId, setCurrentOutlineVersionId] = useState<string | null>(null);
  const [editingOutline, setEditingOutline] = useState(false);
  const [showOutlineHistory, setShowOutlineHistory] = useState(false);

  // Step 3: Script
  const [generatedScript, setGeneratedScript] = useState("");
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptDescription, setScriptDescription] = useState("");
  const [scriptTags, setScriptTags] = useState("");
  const [currentScriptVersionId, setCurrentScriptVersionId] = useState<string | null>(null);

  // DB-persisted history for version restore
  const [dbOutlineHistory, setDbOutlineHistory] = useState<VersionEntry[]>([]);
  const [dbScriptHistory, setDbScriptHistory] = useState<VersionEntry[]>([]);
  // Scoring
  const [scriptScore, setScriptScore] = useState<ScoreResult | null>(null);
  const [scoring, setScoring] = useState(false);

  // Loading states
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [scriptProgress, setScriptProgress] = useState<string>("");  // Progress message for section-by-section

  // AI Assistant loading states
  const [suggestingAngle, setSuggestingAngle] = useState(false);
  const [rewritingSectionIndex, setRewritingSectionIndex] = useState<number | null>(null);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [sectionRewriteInput, setSectionRewriteInput] = useState<Record<number, string>>({});

  // Track completed steps for navigation
  const [completedSteps, setCompletedSteps] = useState<WriterStep[]>(["input"]);

  // Track if initial script load is done (prevent step reset on tab switch)
  const hasInitializedRef = useRef(false);

  // Load existing script if editing
  useEffect(() => {
    if (scriptId) {
      const script = scripts.find(s => s.id === scriptId);
      if (script) {
        setCurrentScriptId(script.id);
        setProjectTitle(script.title || "New Script");
        setTopic(script.topic || "");
        setKeyPoints(script.key_points || "");
        setUniqueAngle(script.unique_angle || "");
        setSelectedDna(script.dna_id || "none");
        setSelectedPersona(script.persona_id || "none");
        setGeneratedScript(script.full_script || "");

        // Load DB history with ID polyfill
        const loadedOutlineHistory = (script.outline_history || []).map((h: VersionEntry) => ({
          ...h,
          id: h.id || crypto.randomUUID()
        }));
        const loadedScriptHistory = (script.script_history || []).map((h: VersionEntry) => ({
          ...h,
          id: h.id || crypto.randomUUID()
        }));

        setDbOutlineHistory(loadedOutlineHistory);
        setDbScriptHistory(loadedScriptHistory);

        // Load score if exists
        if (script.score_breakdown) {
          setScriptScore(script.score_breakdown as unknown as ScoreResult);
        }

        if (script.blueprint_content) {
          const loadedOutline = script.blueprint_content as unknown as GeneratedOutline;
          setOutline(loadedOutline);

          // Try to link current outline to history entry
          let versionId: string = crypto.randomUUID();
          // Find matching entry by content or failover to last entry
          const match = loadedOutlineHistory.find(h => h.content === JSON.stringify(loadedOutline))
            || loadedOutlineHistory[loadedOutlineHistory.length - 1]; // Fallback to latest

          if (match) {
            versionId = match.id!;
          }

          setOutlineHistory([{
            id: versionId,
            outline: loadedOutline,
            createdAt: new Date(script.created_at),
            script: script.full_script || undefined
          }]);
          setCurrentOutlineVersionId(versionId);
        }

        // Set mode and step based on script status (ONLY on initial load)
        setWriterMode("new-idea");
        const steps: WriterStep[] = ["input"];
        if (script.blueprint_content) steps.push("outline");
        if (script.full_script) steps.push("script");
        setCompletedSteps(steps);

        // Load model selections from script (ONLY on initial load)
        if (!hasInitializedRef.current) {
          if (script.outline_model) {
            setOutlineModel(script.outline_model);
          }
          if (script.script_model) {
            setScriptModel(script.script_model);
          }
        }

        // Only set step on FIRST load, not on subsequent re-renders
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          if (script.full_script) {
            setCurrentStep("script");
            // Sync current script ID
            const scriptMatch = loadedScriptHistory.find(h => h.content === script.full_script)
              || loadedScriptHistory[loadedScriptHistory.length - 1]; // Fallback
            if (scriptMatch && scriptMatch.id) {
              setCurrentScriptVersionId(scriptMatch.id);
            }
          } else if (script.blueprint_content) {
            setCurrentStep("outline");
          } else {
            setCurrentStep("input");
          }
        }
      }
    }
  }, [scriptId, scripts]);

  // Update project title when topic changes
  useEffect(() => {
    if (topic && projectTitle === "New Script") {
      setProjectTitle(topic.slice(0, 50) + (topic.length > 50 ? "..." : ""));
    }
  }, [topic, projectTitle]);

  const getParams = (model: string) => {
    const dna = selectedDna && selectedDna !== "none" ? dnas.find(d => d.id === selectedDna) : null;
    const persona = selectedPersona && selectedPersona !== "none" ? personas.find(p => p.id === selectedPersona) : null;
    const mode = dna && persona ? "hybrid" : dna ? "dna" : "persona";

    // Combine viral and flop references into context
    const formatReference = (ref: ReferenceItem) => {
      const parts = [];
      if (ref.title) parts.push(`Title: ${ref.title}`);
      if (ref.transcript) parts.push(`Script: ${ref.transcript}`);
      if (ref.comments) parts.push(`Comments: ${ref.comments}`);
      if (ref.notes) parts.push(`Notes: ${ref.notes}`);
      return parts.join('\n');
    };

    const viralWithContent = viralReferences.filter(v => v.transcript || v.comments);
    const flopWithContent = flopReferences.filter(f => f.transcript || f.comments);

    const viralContext = viralWithContent.length > 0
      ? `\n\nViral References (learn from these):\n${viralWithContent.map(formatReference).join('\n---\n')}`
      : '';
    const flopContext = flopWithContent.length > 0
      ? `\n\nFlop References (avoid these patterns):\n${flopWithContent.map(formatReference).join('\n---\n')}`
      : '';

    return {
      topic: writerMode === "new-idea" ? topic : "Rewrite competitor script",
      keyPoints: (writerMode === "new-idea" ? keyPoints : competitorScript) + viralContext + flopContext,
      uniqueAngle: uniqueAngle,
      mode: mode as "dna" | "persona" | "hybrid",
      dna: dna || undefined,
      persona: persona || undefined,
      model: model,
      language: language,
      country: country,
      targetWordCount: targetWordCount || undefined,
      allowStructureInnovation,
    };
  };

  // Reference helpers
  const addViralReference = () => setViralReferences([...viralReferences, createEmptyReference()]);
  const updateViralReference = (id: string, field: keyof ReferenceItem, value: string) => {
    setViralReferences(prev => prev.map(ref =>
      ref.id === id ? { ...ref, [field]: value } : ref
    ));
  };
  const removeViralReference = (id: string) => {
    setViralReferences(viralReferences.filter(ref => ref.id !== id));
  };

  const addFlopReference = () => setFlopReferences([...flopReferences, createEmptyReference()]);
  const updateFlopReference = (id: string, field: keyof ReferenceItem, value: string) => {
    setFlopReferences(prev => prev.map(ref =>
      ref.id === id ? { ...ref, [field]: value } : ref
    ));
  };
  const removeFlopReference = (id: string) => {
    setFlopReferences(flopReferences.filter(ref => ref.id !== id));
  };

  const handleStartEditTitle = () => {
    setTempTitle(projectTitle);
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    setProjectTitle(tempTitle);
    setEditingTitle(false);
    if (currentScriptId) {
      await updateScript(currentScriptId, { title: tempTitle });
    }
  };

  const handleCancelEditTitle = () => {
    setEditingTitle(false);
  };

  // Auto-save as draft when selecting mode
  const handleSelectMode = async (mode: WriterMode) => {
    setWriterMode(mode);

    // Create draft script immediately with generation_mode
    const draftScript = await createScript({
      title: "New Script",
      topic: "",
      status: "draft",
      generation_mode: mode
    } as any);

    if (draftScript) {
      setCurrentScriptId(draftScript.id);
    }
  };

  // Helper to count words
  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  // Helper to copy text (strips section delimiters for clean output)
  const handleCopyText = async (text: string, label: string) => {
    try {
      // Strip section delimiter for clean copy
      const cleanText = text.replace(/\|\|\|SECTION\|\|\|/g, '\n\n').trim();
      await navigator.clipboard.writeText(cleanText);
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not copy content",
        variant: "destructive",
      });
    }
  };

  // Step 2: Generate Outline
  const handleGenerateOutline = async () => {
    setGeneratingOutline(true);

    // Save current outline to DB history before generating new one
    let updatedOutlineHistory = [...dbOutlineHistory];
    const outlineText = outline ? JSON.stringify(outline) : null;
    if (outlineText && currentScriptId) {
      const newHistoryEntry: VersionEntry = {
        id: currentOutlineVersionId || crypto.randomUUID(), // Use existing ID if available, or new
        content: outlineText,
        timestamp: new Date().toISOString(),
        wordCount: countWords(outlineText)
      };
      updatedOutlineHistory = [...dbOutlineHistory, newHistoryEntry];
      setDbOutlineHistory(updatedOutlineHistory);
    }

    try {
      const result = await generateOutline(getParams(outlineModel));
      if (result) {

        // Add to local history
        const versionId = crypto.randomUUID();
        const newVersion: OutlineVersion = {
          id: versionId,
          outline: result,
          createdAt: new Date()
        };
        setOutlineHistory(prev => [...prev, newVersion]);
        setCurrentOutlineVersionId(versionId);
        setOutline(result);
        setGeneratedScript(""); // Clear script when new outline is created
        setScriptScore(null); // Clear score
        setCurrentStep("outline");

        // Add to persistent DB history as well (so it's safe)
        const currentHistoryEntry: VersionEntry = {
          id: versionId,
          name: `Draft ${updatedOutlineHistory.length + 1}`,
          content: JSON.stringify(result),
          timestamp: new Date().toISOString(),
          wordCount: countWords(JSON.stringify(result)) // Approximate
        };
        const finalOutlineHistory = [...updatedOutlineHistory, currentHistoryEntry];
        setDbOutlineHistory(finalOutlineHistory);

        // Update valid completed steps and save to DB
        if (!completedSteps.includes("outline")) {
          setCompletedSteps(prev => [...prev, "outline"]);
        }
        // Remove script from completed if regenerating outline
        setCompletedSteps(prev => prev.filter(s => s !== "script"));

        // Update script with outline and save history
        if (currentScriptId) {
          const dna = selectedDna && selectedDna !== "none" ? dnas.find(d => d.id === selectedDna) : null;
          const persona = selectedPersona && selectedPersona !== "none" ? personas.find(p => p.id === selectedPersona) : null;

          await updateScript(currentScriptId, {
            title: projectTitle,
            topic,
            key_points: keyPoints,
            unique_angle: uniqueAngle,
            dna_id: dna?.id || null,
            persona_id: persona?.id || null,
            blueprint_content: result as any,
            status: "outline",
            full_script: null,
            score: null,
            score_breakdown: null,
            outline_history: finalOutlineHistory,
            outline_model: outlineModel,
            script_model: scriptModel
          });
        }
      }
    } finally {
      setGeneratingOutline(false);
    }
  };

  // Step 3: Generate Script from Outline
  const handleGenerateScript = async () => {
    if (!outline) return;
    setGeneratingScript(true);
    setScriptScore(null); // Clear previous score

    // Save current script to DB history before generating new one (ONLY if changed or new)
    let updatedScriptHistory = [...dbScriptHistory];
    const isCurrentSaved = dbScriptHistory.some(h => h.content === generatedScript);

    if (generatedScript && currentScriptId && !isCurrentSaved) {
      const newHistoryEntry: VersionEntry = {
        id: crypto.randomUUID(),
        content: generatedScript,
        timestamp: new Date().toISOString(),
        wordCount: countWords(generatedScript),
        outlineVersionId: currentOutlineVersionId || undefined
      };
      updatedScriptHistory = [...dbScriptHistory, newHistoryEntry];
      setDbScriptHistory(updatedScriptHistory);
    }

    try {
      // Use Section-by-Section generation with progress callback
      const result = await generateScriptSectionBySection(
        outline,
        getParams(scriptModel),
        (currentSection, totalSections, status) => {
          setScriptProgress(`[${currentSection}/${totalSections}] ${status}`);
        }
      );
      setScriptProgress(""); // Clear progress
      if (result) {
        setGeneratedScript(result);
        setCurrentStep("script");

        // Update completed steps
        if (!completedSteps.includes("script")) {
          setCompletedSteps(prev => [...prev, "script"]);
        }

        // Update history with script
        if (currentOutlineVersionId) {
          setOutlineHistory(prev => prev.map(v =>
            v.id === currentOutlineVersionId
              ? { ...v, script: result }
              : v
          ));
        }

        const draftName = `Draft ${updatedScriptHistory.filter(s =>
          !currentOutlineVersionId || s.outlineVersionId === currentOutlineVersionId
        ).length + 1}`;

        const currentHistoryEntry: VersionEntry = {
          id: crypto.randomUUID(),
          name: draftName,
          content: result,
          timestamp: new Date().toISOString(),
          wordCount: countWords(result),
          outlineVersionId: currentOutlineVersionId || undefined
        };
        const finalScriptHistory = [...updatedScriptHistory, currentHistoryEntry];
        setDbScriptHistory(finalScriptHistory);
        setCurrentScriptVersionId(currentHistoryEntry.id!);

        // Update script as done and save history
        if (currentScriptId) {
          await updateScript(currentScriptId, {
            title: projectTitle,
            full_script: result,
            status: "done",
            script_history: finalScriptHistory,
            blueprint_content: outline as any,
            outline_model: outlineModel,
            script_model: scriptModel
          });
          toast({
            title: "Script Complete",
            description: "Your script has been saved"
          });
        }
      }
    } finally {
      setGeneratingScript(false);
    }
  };

  // Score the script
  const handleScoreScript = async () => {
    if (!generatedScript) return;
    setScoring(true);
    try {
      const dna = selectedDna && selectedDna !== "none" ? dnas.find(d => d.id === selectedDna) : null;
      const persona = selectedPersona && selectedPersona !== "none" ? personas.find(p => p.id === selectedPersona) : null;

      const result = await scoreScript(generatedScript, dna, persona);
      if (result) {
        setScriptScore(result);

        // Update history entry with this score
        const updatedHistory = dbScriptHistory.map(entry => {
          // Simplest match: if content matches current script
          if (entry.content === generatedScript) {
            return { ...entry, score: result };
          }
          return entry;
        });
        setDbScriptHistory(updatedHistory);

        // Save score to database along with updated history
        if (currentScriptId) {
          await updateScript(currentScriptId, {
            score: result.score,
            score_breakdown: result as any, // Only stores latest score in main columns
            script_history: updatedHistory
          });
        }

        toast({
          title: "Script Scored",
          description: `Your script scored ${result.score}/100`
        });
      }
    } finally {
      setScoring(false);
    }
  };

  const handleSaveProject = async () => {
    if (currentScriptId) {
      if (currentStep === "outline" && outline) {
        await updateScript(currentScriptId, {
          title: projectTitle,
          blueprint_content: outline as any,
          status: "draft"
        });
        toast({
          title: "Saved",
          description: "Outline saved successfully"
        });
      } else if (currentStep === "script") {
        await updateScript(currentScriptId, {
          title: projectTitle,
          full_script: generatedScript,
          status: "done"
        });
        toast({
          title: "Saved",
          description: "Script saved successfully"
        });
      }
    } else {
      // Create new if not exists (though usually it exists by now)
    }
  };


  const handleBack = () => {
    if (currentStep === "script") {
      setCurrentStep("outline");
    } else if (currentStep === "outline") {
      setCurrentStep("input");
    } else if (currentStep === "input") {
      // Only reset everything when going from input back to mode selection
      setWriterMode("select");
      setOutline(null);
      setOutlineHistory([]);
      setCurrentOutlineVersionId(null);
      setGeneratedScript("");
      setScriptScore(null);
      setCompletedSteps(["input"]);
      setCurrentScriptId(null);
      setProjectTitle("New Script");
      // Reset input fields
      setTopic("");
      setKeyPoints("");
      setUniqueAngle("");
      setCompetitorScript("");
      navigate("/writer");
    }
  };

  // Navigate to specific step (only if completed)
  const handleStepClick = (step: WriterStep) => {
    if (step === "input" || completedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };

  // Switch to a different outline version
  const handleSelectOutlineVersion = (version: OutlineVersion) => {
    setOutline(version.outline);
    setCurrentOutlineVersionId(version.id);
    setGeneratedScript(version.script || "");
    setShowOutlineHistory(false);

    // Update completed steps
    if (version.script) {
      if (!completedSteps.includes("script")) {
        setCompletedSteps(prev => [...prev, "script"]);
      }
    } else {
      setCompletedSteps(prev => prev.filter(s => s !== "script"));
    }
  };

  // Restore outline from DB history
  const handleRestoreOutline = (entry: VersionEntry) => {
    try {
      if (entry.id) {
        setCurrentOutlineVersionId(entry.id);
      }
      const parsed = JSON.parse(entry.content) as GeneratedOutline;
      setOutline(parsed);

      // Restore linked script if available
      if (entry.script) {
        setGeneratedScript(entry.script);
        setScriptScore(null);
        toast({
          title: "Restored",
          description: "Outline and associated script restored"
        });
      } else {
        setGeneratedScript(""); // Clear if no linked script found
        setScriptScore(null);
        toast({
          title: "Restored",
          description: "Outline restored (no linked script found)"
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Could not restore outline",
        variant: "destructive"
      });
    }
  };

  const handleUpdateOutlineHistoryName = async (entry: VersionEntry, newName: string) => {
    const updatedHistory = dbOutlineHistory.map(v =>
      v.id === entry.id || (v.timestamp === entry.timestamp && v.content === entry.content)
        ? { ...v, name: newName }
        : v
    );
    setDbOutlineHistory(updatedHistory);

    if (currentScriptId) {
      await updateScript(currentScriptId, {
        outline_history: updatedHistory
      });
    }
  };

  const handleUpdateScriptHistoryName = async (entry: VersionEntry, newName: string) => {
    const updatedHistory = dbScriptHistory.map(v =>
      v.id === entry.id || (v.timestamp === entry.timestamp && v.content === entry.content)
        ? { ...v, name: newName }
        : v
    );
    setDbScriptHistory(updatedHistory);

    if (currentScriptId) {
      await updateScript(currentScriptId, {
        script_history: updatedHistory
      });
    }
  };

  const handleDeleteOutlineHistory = async (entry: VersionEntry) => {
    const updatedHistory = dbOutlineHistory.filter(v => v.id !== entry.id);
    setDbOutlineHistory(updatedHistory);

    // If no history left, go back to input
    if (updatedHistory.length === 0) {
      setCurrentStep("input");
      setOutline(null); // Clear current outline
      setCompletedSteps(prev => prev.filter(s => s !== "outline" && s !== "script"));
      toast({ title: "History Cleared", description: "Returned to input step" });

      if (currentScriptId) {
        await updateScript(currentScriptId, {
          outline_history: updatedHistory,
          blueprint_content: null,
          status: "idea"
        });
      }
      return;
    }

    // If we deleted the CURRENT version, switch to the nearest one (first in list, as list is usually sorted desc? 
    // Wait, dbOutlineHistory might not be sorted. VersionHistory sorts it.
    // Let's assume we want the most recent one.
    if (entry.id === currentOutlineVersionId) {
      // Find most recent
      const sorted = [...updatedHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const nearest = sorted[0];
      if (nearest) {
        handleRestoreOutline(nearest);
        toast({ title: "Switched Version", description: "Switched to latest available outline" });
      }
    }

    if (currentScriptId) {
      await updateScript(currentScriptId, {
        outline_history: updatedHistory
      });
    }
  };

  const handleDeleteScriptHistory = async (entry: VersionEntry) => {
    const updatedHistory = dbScriptHistory.filter(v => v.id !== entry.id);
    setDbScriptHistory(updatedHistory);

    if (currentScriptId) {
      await updateScript(currentScriptId, {
        script_history: updatedHistory
      });
    }
  };

  // Header Name Editing
  const [headerEditingName, setHeaderEditingName] = useState(false);
  const [headerNameValue, setHeaderNameValue] = useState("");

  const currentOutlineEntry = dbOutlineHistory.find(v => v.id === currentOutlineVersionId);
  const currentOutlineName = currentOutlineEntry?.name || (dbOutlineHistory.length > 0 ? `Draft ${dbOutlineHistory.length}` : "New Draft");

  const currentScriptEntry = dbScriptHistory.find(v => v.id === currentScriptVersionId);
  const currentScriptName = currentScriptEntry?.name || (dbScriptHistory.filter(s => !currentOutlineVersionId || s.outlineVersionId === currentOutlineVersionId).length > 0
    ? `Draft ${dbScriptHistory.filter(s => !currentOutlineVersionId || s.outlineVersionId === currentOutlineVersionId).length}`
    : "New Script");

  const handleHeaderNameUpdate = async () => {
    if (!headerNameValue.trim()) {
      setHeaderEditingName(false);
      return;
    }

    if (currentStep === "outline" && currentOutlineEntry) {
      await handleUpdateOutlineHistoryName(currentOutlineEntry, headerNameValue);
    } else if (currentStep === "script" && currentScriptEntry) {
      await handleUpdateScriptHistoryName(currentScriptEntry, headerNameValue);
    }
    setHeaderEditingName(false);
  };

  // Restore script from DB history
  const handleRestoreScript = (entry: VersionEntry) => {
    setGeneratedScript(entry.content);
    if (entry.id) {
      setCurrentScriptVersionId(entry.id);
    }

    // Restore score if available
    if (entry.score) {
      setScriptScore(entry.score);
    } else {
      setScriptScore(null);
    }

    toast({
      title: "Restored",
      description: "Script restored from history"
    });
  };

  const updateOutlineSection = (index: number, field: keyof OutlineSection, value: string | number) => {
    if (!outline) return;
    const newSections = [...outline.sections];
    // @ts-ignore - Dynamic key assignment
    newSections[index] = { ...newSections[index], [field]: value };
    setOutline({ ...outline, sections: newSections });
  };

  const addOutlineSection = () => {
    if (!outline) return;
    const newSection: OutlineSection = {
      title: "New Section",
      content: "",
      wordCount: 100,
      notes: ""
    };
    setOutline({ ...outline, sections: [...outline.sections, newSection] });
  };

  const removeOutlineSection = (index: number) => {
    if (!outline) return;
    setOutline({ ...outline, sections: outline.sections.filter((_, i) => i !== index) });
  };

  // Mode Selection Screen
  if (writerMode === "select" && !scriptId) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Writer</h1>
          <p className="text-muted-foreground">Generate unique, viral-ready scripts</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
          <GlassCard variant="elevated" className="cursor-pointer group hover:ring-2 hover:ring-primary transition-all" onClick={() => handleSelectMode("new-idea")}>
            <GlassCardContent className="p-8 text-center space-y-4">
              <div className="mx-auto rounded-2xl bg-primary/10 p-6 w-fit group-hover:bg-primary/20 transition-colors">
                <Lightbulb className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">New Idea</h3>
                <p className="text-muted-foreground">
                  Start fresh with your own topic and create an original script
                </p>
              </div>
              <Badge className="bg-primary/10 text-primary">Most Popular</Badge>
            </GlassCardContent>
          </GlassCard>

          <GlassCard variant="elevated" className="cursor-pointer group hover:ring-2 hover:ring-primary transition-all" onClick={() => handleSelectMode("rewrite")}>
            <GlassCardContent className="p-8 text-center space-y-4">
              <div className="mx-auto rounded-2xl bg-accent/50 p-6 w-fit group-hover:bg-accent transition-colors">
                <RefreshCw className="h-12 w-12 text-accent-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Rewrite</h3>
                <p className="text-muted-foreground">
                  Transform a competitor's script using your unique DNA pattern
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    );
  }

  // Main Writer Screen with Steps
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header with Steps */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            ← Back
          </Button>
          <div className="flex-1">
            {/* Project Title - Editable */}
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-xl font-bold h-9 max-w-md"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") handleCancelEditTitle();
                  }}
                />
                <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelEditTitle}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1
                  className="text-2xl font-bold tracking-tight cursor-pointer hover:text-primary transition-colors"
                  onClick={handleStartEditTitle}
                >
                  {projectTitle}
                </h1>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleStartEditTitle}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground">
              {currentStep === "input" && "Step 1: Enter your inputs"}
              {currentStep === "outline" && "Step 2: Review and edit outline"}
              {currentStep === "script" && "Step 3: Your generated script"}
            </p>
          </div>
          {(currentStep === "script" || currentStep === "outline") && (
            <div className="flex items-center gap-3 bg-muted/30 p-1 rounded-full border border-border/50">
              {/* Save Button */}
              <Button onClick={handleSaveProject} size="sm" className="gap-2 shadow-sm h-8 rounded-full">
                <Save className="h-4 w-4" />
                {currentStep === "outline" ? "Save" : "Save"}
              </Button>

              {/* Central Name Display */}
              <div className="flex items-center justify-center min-w-[150px] px-2 border-l border-r border-border/50 h-6">
                {headerEditingName ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={headerNameValue}
                      onChange={(e) => setHeaderNameValue(e.target.value)}
                      className="h-6 w-32 text-xs text-center"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleHeaderNameUpdate();
                        if (e.key === 'Escape') setHeaderEditingName(false);
                      }}
                      onBlur={handleHeaderNameUpdate} // auto save on blur
                    />
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors group"
                    onClick={() => {
                      if (currentStep === "outline" && currentOutlineEntry) {
                        setHeaderNameValue(currentOutlineName);
                        setHeaderEditingName(true);
                      } else if (currentStep === "script" && currentScriptEntry) {
                        setHeaderNameValue(currentScriptName);
                        setHeaderEditingName(true);
                      }
                      // Future: Add script renaming here if needed
                    }}
                  >
                    <span className="text-sm font-medium text-foreground/80">
                      {currentStep === "outline" ? currentOutlineName : currentScriptName}
                    </span>
                    {(currentStep === "outline" || currentStep === "script") && (
                      <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                    )}
                  </div>
                )}
              </div>

              {/* Step Specific Actions */}
              {currentStep === "outline" && (
                <Button
                  variant={editingOutline ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setEditingOutline(!editingOutline)}
                  className="h-8 gap-2"
                >
                  <Edit2 className="h-3 w-3" />
                  {editingOutline ? "Done" : "Edit"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Clickable Step Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStepClick("input")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${currentStep === "input"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
          >
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>
            Input
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => handleStepClick("outline")}
            disabled={!completedSteps.includes("outline")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${currentStep === "outline"
              ? "bg-primary text-primary-foreground cursor-pointer"
              : completedSteps.includes("outline")
                ? "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
              }`}
          >
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>
            Outline
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={() => handleStepClick("script")}
            disabled={!completedSteps.includes("script")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${currentStep === "script"
              ? "bg-primary text-primary-foreground cursor-pointer"
              : completedSteps.includes("script")
                ? "bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
              }`}
          >
            <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">3</span>
            Script
          </button>
        </div>
      </div>

      {/* Step 1: Input */}
      {currentStep === "input" && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            {/* AI Model Selection for Outline */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Model (Outline)
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <ModelSelector value={outlineModel} onChange={setOutlineModel} />
              </GlassCardContent>
            </GlassCard>

            {/* DNA & Persona Selection */}
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>Configure Generation</GlassCardTitle>
                <GlassCardDescription>
                  Select DNA pattern and/or audience persona to guide the script
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Dna className="h-4 w-4 text-primary" />
                    DNA Pattern
                  </Label>
                  <Select value={selectedDna} onValueChange={setSelectedDna}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select DNA (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No DNA</SelectItem>
                      {dnas.map(dna => <SelectItem key={dna.id} value={dna.id}>{dna.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Audience Persona
                  </Label>
                  <Select value={selectedPersona} onValueChange={setSelectedPersona}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select persona (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Persona</SelectItem>
                      {personas.map(persona => <SelectItem key={persona.id} value={persona.id}>{persona.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select language..." />
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Target Country/Region
                  </Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">🇺🇸 United States</SelectItem>
                      <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                      <SelectItem value="VN">🇻🇳 Vietnam</SelectItem>
                      <SelectItem value="JP">🇯🇵 Japan</SelectItem>
                      <SelectItem value="KR">🇰🇷 Korea</SelectItem>
                      <SelectItem value="IN">🇮🇳 India</SelectItem>
                      <SelectItem value="DE">🇩🇪 Germany</SelectItem>
                      <SelectItem value="FR">🇫🇷 France</SelectItem>
                      <SelectItem value="BR">🇧🇷 Brazil</SelectItem>
                      <SelectItem value="ID">🇮🇩 Indonesia</SelectItem>
                      <SelectItem value="TH">🇹🇭 Thailand</SelectItem>
                      <SelectItem value="PH">🇵🇭 Philippines</SelectItem>
                      <SelectItem value="AU">🇦🇺 Australia</SelectItem>
                      <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                      <SelectItem value="MX">🇲🇽 Mexico</SelectItem>
                      <SelectItem value="ES">🇪🇸 Spain</SelectItem>
                      <SelectItem value="IT">🇮🇹 Italy</SelectItem>
                      <SelectItem value="RU">🇷🇺 Russia</SelectItem>
                      <SelectItem value="PL">🇵🇱 Poland</SelectItem>
                      <SelectItem value="NL">🇳🇱 Netherlands</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Cultural adaptation for local audience</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Target Word Count
                  </Label>
                  <Input
                    type="number"
                    value={targetWordCount}
                    onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 0)}
                    className="rounded-xl"
                    placeholder="e.g. 1000"
                  />
                  <p className="text-xs text-muted-foreground">Approximate length for scaling sections</p>
                </div>

                <FeatureGate feature="structure_innovation">
                  <div className="flex items-start space-x-3 pt-2 p-3 bg-muted/30 rounded-xl border border-border/50">
                    <Checkbox
                      id="innovation"
                      checked={allowStructureInnovation}
                      onCheckedChange={(checked) => setAllowStructureInnovation(checked as boolean)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="innovation"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Allow Structure Innovation
                      </Label>
                      <p className="text-xs text-muted-foreground leading-snug">
                        Allow AI to vary the structure by 15-25% for novelty while keeping core DNA elements.
                      </p>
                    </div>
                  </div>
                </FeatureGate>
              </GlassCardContent>
            </GlassCard>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle>
                  {writerMode === "new-idea" ? "Your Idea" : "Competitor Script"}
                </GlassCardTitle>
                <GlassCardDescription>
                  {writerMode === "new-idea" ? "What topic do you want to create content about?" : "Paste the competitor's script to rewrite"}
                </GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                {writerMode === "new-idea" ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Topic *</Label>
                        <WordCount text={topic} />
                      </div>
                      <Input
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="e.g., How to build a morning routine..."
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Key Points (Optional)</Label>
                        <WordCount text={keyPoints} />
                      </div>
                      <Textarea
                        value={keyPoints}
                        onChange={e => setKeyPoints(e.target.value)}
                        placeholder="Main points you want to cover..."
                        className="rounded-xl resize-none min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Your Unique Angle</Label>
                        <div className="flex items-center gap-2">
                          <FeatureGate feature="ai_suggest_angle" hideCompletely>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (!topic) {
                                  toast({ title: "Enter a topic first", variant: "destructive" });
                                  return;
                                }
                                setSuggestingAngle(true);
                                const dnaObj = selectedDna && selectedDna !== "none" ? dnas.find(d => d.id === selectedDna) : null;
                                const personaObj = selectedPersona && selectedPersona !== "none" ? personas.find(p => p.id === selectedPersona) : null;
                                const angles = await suggestUniqueAngle(topic, dnaObj, personaObj, outlineModel);
                                if (angles.length > 0) {
                                  setUniqueAngle(angles.map((a, i) => `${i + 1}. ${a.angle}`).join('\n\n'));
                                  toast({ title: `${angles.length} angles suggested!` });
                                }
                                setSuggestingAngle(false);
                              }}
                              disabled={suggestingAngle || !topic}
                              className="h-7 text-xs gap-1"
                            >
                              {suggestingAngle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                              AI Suggest
                            </Button>
                          </FeatureGate>
                          <WordCount text={uniqueAngle} />
                        </div>
                      </div>
                      <Textarea
                        value={uniqueAngle}
                        onChange={e => setUniqueAngle(e.target.value)}
                        placeholder="What makes your perspective different? Click 'AI Suggest' for ideas..."
                        className="rounded-xl resize-none min-h-[80px]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Competitor Script *</Label>
                        <WordCount text={competitorScript} />
                      </div>
                      <Textarea
                        value={competitorScript}
                        onChange={e => setCompetitorScript(e.target.value)}
                        placeholder="Paste the competitor's script here..."
                        className="rounded-xl resize-none min-h-[200px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Your Unique Angle (Optional)</Label>
                        <div className="flex items-center gap-2">
                          <FeatureGate feature="ai_suggest_angle" hideCompletely>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (!competitorScript) {
                                  toast({ title: "Paste competitor script first", variant: "destructive" });
                                  return;
                                }
                                setSuggestingAngle(true);
                                const dnaObj = selectedDna && selectedDna !== "none" ? dnas.find(d => d.id === selectedDna) : null;
                                const personaObj = selectedPersona && selectedPersona !== "none" ? personas.find(p => p.id === selectedPersona) : null;
                                // Extract topic from competitor script
                                const inferredTopic = competitorScript.substring(0, 200);
                                const angles = await suggestUniqueAngle(inferredTopic, dnaObj, personaObj, outlineModel);
                                if (angles.length > 0) {
                                  setUniqueAngle(angles.map((a, i) => `${i + 1}. ${a.angle}`).join('\n\n'));
                                  toast({ title: `${angles.length} angles suggested!` });
                                }
                                setSuggestingAngle(false);
                              }}
                              disabled={suggestingAngle || !competitorScript}
                              className="h-7 text-xs gap-1"
                            >
                              {suggestingAngle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                              AI Suggest
                            </Button>
                          </FeatureGate>
                          <WordCount text={uniqueAngle} />
                        </div>
                      </div>
                      <Textarea
                        value={uniqueAngle}
                        onChange={e => setUniqueAngle(e.target.value)}
                        placeholder="What makes your version different? Click 'AI Suggest' for ideas..."
                        className="rounded-xl resize-none min-h-[80px]"
                      />
                    </div>
                  </>
                )}
              </GlassCardContent>
            </GlassCard>

            {/* Viral & Flop References */}
            <div className="space-y-3">
              {/* Viral References */}
              <Collapsible open={viralOpen} onOpenChange={setViralOpen}>
                <GlassCard className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-green-600">Viral References</p>
                          <p className="text-xs text-muted-foreground">Add successful content examples to learn from</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {viralReferences.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{viralReferences.length}</Badge>
                        )}
                        {viralOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {viralReferences.map((ref, index) => (
                        <div key={ref.id} className="relative bg-muted/30 rounded-xl p-4 space-y-3">
                          <Badge className="absolute -top-2 -left-2 bg-green-500 text-white text-xs">
                            #{index + 1}
                          </Badge>
                          {viralReferences.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeViralReference(ref.id)}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Title</Label>
                              <Input
                                placeholder="e.g., How I built a SaaS in 2 days"
                                value={ref.title}
                                onChange={(e) => updateViralReference(ref.id, "title", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">YouTube URL</Label>
                              <Input
                                placeholder="https://youtube.com/"
                                value={ref.url}
                                onChange={(e) => updateViralReference(ref.id, "url", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>

                          <Tabs
                            value={ref.activeTab}
                            onValueChange={(v) => updateViralReference(ref.id, "activeTab", v)}
                          >
                            <TabsList className="h-8 bg-background/50">
                              <TabsTrigger value="transcript" className="text-xs h-6 gap-1">
                                <FileText className="h-3 w-3" /> Script / Transcript
                              </TabsTrigger>
                              <TabsTrigger value="comments" className="text-xs h-6 gap-1">
                                <MessageSquare className="h-3 w-3" /> Comments / Feedback
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="transcript" className="mt-2">
                              <Textarea
                                placeholder="Paste content here..."
                                value={ref.transcript}
                                onChange={(e) => updateViralReference(ref.id, "transcript", e.target.value)}
                                className="min-h-[80px] text-sm resize-none"
                              />
                            </TabsContent>
                            <TabsContent value="comments" className="mt-2">
                              <Textarea
                                placeholder="Paste comments or feedback here..."
                                value={ref.comments}
                                onChange={(e) => updateViralReference(ref.id, "comments", e.target.value)}
                                className="min-h-[80px] text-sm resize-none"
                              />
                            </TabsContent>
                          </Tabs>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Description / Notes</Label>
                            <Textarea
                              placeholder="e.g., A quick breakdown of the tech stack..."
                              value={ref.notes}
                              onChange={(e) => updateViralReference(ref.id, "notes", e.target.value)}
                              className="min-h-[60px] text-sm resize-none"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addViralReference}
                        className="w-full gap-2 border-dashed border-green-500/50 text-green-600 hover:bg-green-500/5"
                      >
                        <Plus className="h-4 w-4" />
                        Add Viral Reference
                      </Button>
                    </div>
                  </CollapsibleContent>
                </GlassCard>
              </Collapsible>

              {/* Flop References */}
              <Collapsible open={flopOpen} onOpenChange={setFlopOpen}>
                <GlassCard className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-red-500">Flop References</p>
                          <p className="text-xs text-muted-foreground">Add examples of what to avoid</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {flopReferences.length > 0 && (
                          <Badge variant="secondary" className="text-xs">{flopReferences.length}</Badge>
                        )}
                        {flopOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      {flopReferences.map((ref, index) => (
                        <div key={ref.id} className="relative bg-muted/30 rounded-xl p-4 space-y-3">
                          <Badge className="absolute -top-2 -left-2 bg-red-500 text-white text-xs">
                            #{index + 1}
                          </Badge>
                          {flopReferences.length > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFlopReference(ref.id)}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Title</Label>
                              <Input
                                placeholder="e.g., Why my video flopped"
                                value={ref.title}
                                onChange={(e) => updateFlopReference(ref.id, "title", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">YouTube URL</Label>
                              <Input
                                placeholder="https://youtube.com/"
                                value={ref.url}
                                onChange={(e) => updateFlopReference(ref.id, "url", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>

                          <Tabs
                            value={ref.activeTab}
                            onValueChange={(v) => updateFlopReference(ref.id, "activeTab", v)}
                          >
                            <TabsList className="h-8 bg-background/50">
                              <TabsTrigger value="transcript" className="text-xs h-6 gap-1">
                                <FileText className="h-3 w-3" /> Script / Transcript
                              </TabsTrigger>
                              <TabsTrigger value="comments" className="text-xs h-6 gap-1">
                                <MessageSquare className="h-3 w-3" /> Comments / Feedback
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="transcript" className="mt-2">
                              <Textarea
                                placeholder="Paste content here..."
                                value={ref.transcript}
                                onChange={(e) => updateFlopReference(ref.id, "transcript", e.target.value)}
                                className="min-h-[80px] text-sm resize-none"
                              />
                            </TabsContent>
                            <TabsContent value="comments" className="mt-2">
                              <Textarea
                                placeholder="Paste comments or feedback here..."
                                value={ref.comments}
                                onChange={(e) => updateFlopReference(ref.id, "comments", e.target.value)}
                                className="min-h-[80px] text-sm resize-none"
                              />
                            </TabsContent>
                          </Tabs>

                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Description / Notes</Label>
                            <Textarea
                              placeholder="e.g., Why this didn't work..."
                              value={ref.notes}
                              onChange={(e) => updateFlopReference(ref.id, "notes", e.target.value)}
                              className="min-h-[60px] text-sm resize-none"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addFlopReference}
                        className="w-full gap-2 border-dashed border-red-500/50 text-red-500 hover:bg-red-500/5"
                      >
                        <Plus className="h-4 w-4" />
                        Add Flop Reference
                      </Button>
                    </div>
                  </CollapsibleContent>
                </GlassCard>
              </Collapsible>
            </div>

            <Button
              className="w-full gap-2 rounded-xl h-12 shadow-lg shadow-primary/20"
              onClick={handleGenerateOutline}
              disabled={generatingOutline || (writerMode === "new-idea" ? !topic : !competitorScript)}
            >
              {generatingOutline ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Outline...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  Generate Outline
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Outline */}
      {currentStep === "outline" && outline && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Est. Words: {outline.totalWordCount}</span>
              </div>

              {/* Outline History Button - Local session */}
              {/* DB Outline History */}
              <VersionHistory
                versions={dbOutlineHistory}
                type="outline"
                onRestore={handleRestoreOutline}
                onUpdateName={handleUpdateOutlineHistoryName}
                onDelete={handleDeleteOutlineHistory}
                renderInfo={(entry) => {
                  const count = dbScriptHistory.filter(s => s.outlineVersionId === entry.id).length;
                  return count > 0 ? (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">
                      {count} scripts
                    </Badge>
                  ) : null;
                }}
                disabled={generatingOutline}
              />

              {/* Model Selector for Script */}
              <ModelSelector
                value={scriptModel}
                onChange={setScriptModel}
                label="Script Model"
                compact
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateOutline}
                disabled={generatingOutline}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${generatingOutline ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
          </div>

          {/* Outline History Panel */}
          {showOutlineHistory && (
            <GlassCard>
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5" />
                  Outline Versions
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="space-y-2">
                  {outlineHistory.map((version, index) => (
                    <div
                      key={version.id}
                      onClick={() => handleSelectOutlineVersion(version)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${version.id === currentOutlineVersionId
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-muted/50 hover:bg-muted'
                        }`}
                    >
                      <div>
                        <span className="font-medium">Version {index + 1}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {version.createdAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {version.script && (
                          <Badge variant="secondary" className="text-xs">Has Script</Badge>
                        )}
                        {version.id === currentOutlineVersionId && (
                          <Badge className="text-xs">Current</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>
          )}


          {/* Sections - All sections including Hook and CTA (from DNA skeleton) */}
          <GlassCard>
            <GlassCardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <GlassCardTitle>Content Sections</GlassCardTitle>
                  <GlassCardDescription>{outline.sections.length} sections in your script</GlassCardDescription>
                </div>
                {editingOutline && (
                  <Button variant="outline" size="sm" onClick={addOutlineSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                )}
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              {outline.sections.map((section, index) => (
                <div key={index}>
                  {/* Insert button ABOVE section */}
                  {editingOutline && (
                    <div className="flex justify-center py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newSection = { title: "New Section", wordCount: 100, content: "", notes: "" };
                          const newSections = [...outline.sections];
                          newSections.splice(index, 0, newSection);
                          setOutline({ ...outline, sections: newSections });
                        }}
                        className="h-6 text-xs gap-1 text-muted-foreground hover:text-primary"
                      >
                        <Plus className="h-3 w-3" />
                        Insert Section
                      </Button>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      {editingOutline ? (
                        <>
                          <Input
                            value={section.title}
                            onChange={e => updateOutlineSection(index, 'title', e.target.value)}
                            className="rounded-lg font-medium flex-1"
                            placeholder="Section title..."
                          />
                          <Input
                            type="number"
                            value={section.wordCount}
                            onChange={e => updateOutlineSection(index, 'wordCount', parseInt(e.target.value) || 0)}
                            className="rounded-lg w-24"
                            placeholder="Words"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOutlineSection(index)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <h4 className="font-medium">{index + 1}. {section.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{section.wordCount} words</Badge>
                          </div>
                        </>
                      )}
                    </div>
                    {editingOutline ? (
                      <div className="space-y-1">
                        <Textarea
                          value={section.content}
                          onChange={e => updateOutlineSection(index, 'content', e.target.value)}
                          className="rounded-lg resize-none min-h-[80px]"
                          placeholder="Section content..."
                        />
                        <WordCount text={section.content} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{section.content}</p>
                    )}
                    {editingOutline ? (
                      <Input
                        value={section.notes || ""}
                        onChange={e => updateOutlineSection(index, 'notes', e.target.value)}
                        className="rounded-lg text-sm"
                        placeholder="Notes (optional)..."
                      />
                    ) : section.notes && (
                      <div className="space-y-1">
                        {section.notes.includes("Unique Angle Integration") && (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20 mb-1">
                            ✨ Unique Angle Integrated
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground italic">📝 {section.notes}</p>
                      </div>
                    )}

                    {/* Per-section AI rewrite */}
                    {!editingOutline && (
                      <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                        <Input
                          value={sectionRewriteInput[index] || ""}
                          onChange={e => setSectionRewriteInput(prev => ({ ...prev, [index]: e.target.value }))}
                          placeholder="Add ideas to improve this section..."
                          className="rounded-lg text-sm flex-1 h-8"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setRewritingSectionIndex(index);
                            const dnaObj = selectedDna && selectedDna !== "none" ? dnas.find(d => d.id === selectedDna) : null;
                            const personaObj = selectedPersona && selectedPersona !== "none" ? personas.find(p => p.id === selectedPersona) : null;
                            const newContent = await rewriteSection(
                              section.title,
                              section.content,
                              sectionRewriteInput[index] || "",
                              { dna: dnaObj, persona: personaObj, targetWordCount: section.wordCount },
                              outlineModel
                            );
                            if (newContent) {
                              updateOutlineSection(index, 'content', newContent);
                              toast({ title: `Section "${section.title}" rewritten!` });
                            }
                            setRewritingSectionIndex(null);
                          }}
                          disabled={rewritingSectionIndex === index}
                          className="h-8 gap-1"
                        >
                          {rewritingSectionIndex === index ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          Rewrite
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Insert button at the END */}
              {editingOutline && (
                <div className="flex justify-center py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOutlineSection}
                    className="h-8 gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Section at End
                  </Button>
                </div>
              )}
            </GlassCardContent>
          </GlassCard>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setCurrentStep("input")}>
              ← Back to Input
            </Button>
            <Button
              className="flex-1 gap-2 rounded-xl h-12 shadow-lg shadow-primary/20"
              onClick={handleGenerateScript}
              disabled={generatingScript}
            >
              {generatingScript ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {scriptProgress || "Starting..."}
                </>
              ) : (
                <>
                  <PenTool className="h-5 w-5" />
                  Write Full Script
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Script Output */}
      {currentStep === "script" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {/* Title, Description, Tags */}
              <GlassCard>
                <GlassCardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <GlassCardTitle className="text-sm">SEO Metadata</GlassCardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!generatedScript) {
                          toast({ title: "Generate script first", variant: "destructive" });
                          return;
                        }
                        setGeneratingSEO(true);
                        const dnaObj = selectedDna && selectedDna !== "none" ? dnas.find(d => d.id === selectedDna) : null;
                        const personaObj = selectedPersona && selectedPersona !== "none" ? personas.find(p => p.id === selectedPersona) : null;
                        const seoResult = await generateSEO(generatedScript, dnaObj, personaObj, scriptModel);
                        if (seoResult) {
                          setScriptTitle(seoResult.title);
                          setScriptDescription(seoResult.description);
                          setScriptTags(seoResult.tags.join(", "));
                          toast({ title: "SEO metadata generated!" });
                        }
                        setGeneratingSEO(false);
                      }}
                      disabled={generatingSEO || !generatedScript}
                      className="h-7 gap-1"
                    >
                      {generatingSEO ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Generate SEO
                    </Button>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="p-4 space-y-4 pt-0">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Title</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyText(scriptTitle, "title")}
                        disabled={!scriptTitle}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      value={scriptTitle}
                      onChange={(e) => setScriptTitle(e.target.value)}
                      placeholder="Enter video title..."
                      className="bg-background/50"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Description</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyText(scriptDescription, "description")}
                        disabled={!scriptDescription}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={scriptDescription}
                      onChange={(e) => setScriptDescription(e.target.value)}
                      placeholder="Enter video description..."
                      className="min-h-[80px] resize-none bg-background/50"
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Tags
                      </Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyText(scriptTags, "tags")}
                        disabled={!scriptTags}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      value={scriptTags}
                      onChange={(e) => setScriptTags(e.target.value)}
                      placeholder="Enter tags (comma separated)..."
                      className="bg-background/50"
                    />
                  </div>
                </GlassCardContent>
              </GlassCard>

              {/* Script Sections */}
              <div className="space-y-4">
                {/* Header with actions */}
                <GlassCard>
                  <GlassCardHeader className="border-b border-border/50 py-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <GlassCardTitle className="flex items-center gap-2 text-base">
                          <PenTool className="h-4 w-4 text-primary" />
                          Script
                        </GlassCardTitle>
                        <Badge className="bg-green-500/10 text-green-600 text-xs">Done</Badge>
                        <WordCount text={generatedScript} showCharacters />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 h-8 text-xs"
                          onClick={() => handleCopyText(generatedScript, "kịch bản")}
                          disabled={!generatedScript}
                        >
                          <Copy className="h-3 w-3" />
                          Copy All
                        </Button>
                        <ModelSelector
                          value={scriptModel}
                          onChange={setScriptModel}
                          label="Model"
                          compact
                        />
                        <VersionHistory
                          versions={dbScriptHistory.filter(v =>
                            !currentOutlineVersionId || v.outlineVersionId === currentOutlineVersionId
                          )}
                          type="script"
                          onRestore={handleRestoreScript}
                          onUpdateName={handleUpdateScriptHistoryName}
                          onDelete={handleDeleteScriptHistory}
                          disabled={generatingScript}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleScoreScript}
                          disabled={scoring || !generatedScript}
                          className="gap-1 h-8 text-xs"
                        >
                          {scoring ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Star className="h-3 w-3" />
                          )}
                          Score
                        </Button>
                      </div>
                    </div>
                  </GlassCardHeader>
                </GlassCard>

                {/* Script split by sections - based on outline (no separate Hook/CTA) */}
                {outline && generatedScript ? (
                  <div className="space-y-3">
                    {/* All sections from outline */}
                    {outline.sections.map((section, index) => {
                      const delimiter = generatedScript.includes("|||SECTION|||") ? "|||SECTION|||" : "\n\n";
                      const parts = generatedScript.split(delimiter);
                      const sectionContent = parts[index] || '';
                      const actualWordCount = sectionContent.trim().split(/\s+/).filter(w => w.length > 0).length;
                      return (
                        <GlassCard key={index}>
                          <GlassCardHeader className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">{index + 1}</span>
                                <span className="font-medium text-sm">{section.title}</span>
                                <Badge variant="outline" className="text-xs">{actualWordCount} words</Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyText(sectionContent, section.title)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </GlassCardHeader>
                          <GlassCardContent className="px-4 pb-4 pt-0 space-y-2">
                            <Textarea
                              value={sectionContent}
                              onChange={(e) => {
                                const delimiter = generatedScript.includes("|||SECTION|||") ? "|||SECTION|||" : "\n\n";
                                const newParts = generatedScript.split(delimiter);
                                newParts[index] = e.target.value;
                                setGeneratedScript(newParts.join(delimiter));
                              }}
                              className="resize-none text-sm leading-relaxed min-h-[100px]"
                            />
                            {/* Per-section AI rewrite */}
                            <div className="flex items-center gap-2 pt-1">
                              <Input
                                value={sectionRewriteInput[index + 1000] || ""}
                                onChange={e => setSectionRewriteInput(prev => ({ ...prev, [index + 1000]: e.target.value }))}
                                placeholder="Ideas to improve this section..."
                                className="text-sm flex-1 h-8"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  setRewritingSectionIndex(index + 1000);
                                  const dnaObj = selectedDna && selectedDna !== "none" ? dnas.find(d => d.id === selectedDna) : null;
                                  const personaObj = selectedPersona && selectedPersona !== "none" ? personas.find(p => p.id === selectedPersona) : null;
                                  const delimiter = generatedScript.includes("|||SECTION|||") ? "|||SECTION|||" : "\n\n";
                                  const allParts = generatedScript.split(delimiter);
                                  const previousSections = allParts.slice(0, index);
                                  const newContent = await rewriteSection(
                                    section.title,
                                    sectionContent,
                                    sectionRewriteInput[index + 1000] || "",
                                    { previousSections, dna: dnaObj, persona: personaObj, targetWordCount: section.wordCount },
                                    scriptModel
                                  );
                                  if (newContent) {
                                    allParts[index] = newContent;
                                    setGeneratedScript(allParts.join(delimiter));
                                    toast({ title: `Section "${section.title}" rewritten!` });
                                  }
                                  setRewritingSectionIndex(null);
                                }}
                                disabled={rewritingSectionIndex === index + 1000}
                                className="h-8 gap-1"
                              >
                                {rewritingSectionIndex === index + 1000 ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                                Rewrite
                              </Button>
                            </div>
                          </GlassCardContent>
                        </GlassCard>
                      );
                    })}
                  </div>
                ) : (
                  <GlassCard>
                    <GlassCardContent className="p-4">
                      <Textarea
                        value={generatedScript}
                        onChange={e => setGeneratedScript(e.target.value)}
                        className="min-h-[400px] resize-none text-sm leading-relaxed"
                        placeholder="Your script will appear here..."
                      />
                    </GlassCardContent>
                  </GlassCard>
                )}
              </div>
            </div>

            {/* Score Display */}
            <div className="lg:col-span-1">
              {scriptScore ? (
                <ScoreDisplay score={scriptScore} />
              ) : (
                <GlassCard>
                  <GlassCardContent className="p-8 text-center space-y-4">
                    <Star className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">No Score Yet</p>
                      <p className="text-sm text-muted-foreground/70">
                        Click "Score Script" to analyze your script's viral potential
                      </p>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setCurrentStep("outline")}>
              ← Back to Outline
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl h-12"
              onClick={handleGenerateScript}
              disabled={generatingScript}
            >
              <RefreshCw className="h-5 w-5" />
              Regenerate Script
            </Button>
            <Button
              className="flex-1 gap-2 rounded-xl h-12"
              onClick={() => navigate("/")}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
