
import React, { useState } from 'react';
import { Project, ContentPiece, CreationMode, OutputLanguage, BlueprintSection, ScriptSection, ScriptDNA, ScoringTemplate, ScoringResult, Step, VersionedItem, ScriptBlueprint, OptimizedResult, UserSettings } from '../../types';
import { generateScriptBlueprint, generateScriptFromBlueprint, generateSectionScript, refineSection, analyzeScriptScore } from '../../services/geminiService';
import { fetchYoutubeComments } from '../../services/youtubeService';
import { InputCard } from '../InputCard';
import { BlueprintView } from '../BlueprintView';
import { ScriptSectionCard } from '../ScriptSectionCard';
import { ScoringPanel } from '../Scoring/ScoringPanel';
import { AI_MODELS, GEMINI_MODEL } from '../../constants';
import { SpinnerIcon, SparklesIcon, PlusIcon, ArrowRightIcon, RefreshIcon, CheckIcon, TrashIcon, SearchIcon, GlobeIcon, GridIcon, CopyIcon, HistoryIcon, LayoutIcon } from '../Icons';

interface CreationDashboardProps {
  project: Project | undefined;
  onUpdateProject: (p: Project) => void;
  globalDNAs: ScriptDNA[];
  // NEW PROPS FOR GLOBAL RULES
  globalScoringTemplates: ScoringTemplate[];
  onSaveGlobalTemplate: (t: ScoringTemplate) => void;
  onDeleteGlobalTemplate: (id: string) => void;
  userSettings: UserSettings | null;
}

const LANGUAGES: OutputLanguage[] = ['English', 'Vietnamese', 'Spanish', 'Japanese', 'Korean'];

// ... VersionSelector Component (unchanged) ...
const VersionSelector = <T extends any>({ versions, onSelect }: { versions: VersionedItem<T>[], onSelect: (v: T) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative z-20">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] font-bold uppercase hover:bg-zinc-700 transition-colors"><HistoryIcon className="w-3 h-3 text-zinc-400" /> History ({versions.length})</button>
            {isOpen && (<div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95"><div className="px-3 py-2 bg-black/20 border-b border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Restore Version</div><div className="max-h-[200px] overflow-y-auto">{[...versions].reverse().map((v, i) => (<button key={v.id} onClick={() => { onSelect(v.data); setIsOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-white/5 border-b border-zinc-800/50 last:border-0 flex flex-col gap-0.5"><span className="text-xs font-bold text-white">{v.name}</span><span className="text-[9px] text-zinc-500 font-mono">{new Date(v.timestamp).toLocaleTimeString()}</span></button>))}</div></div>)}
            {isOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>}
        </div>
    );
};

export const CreationDashboard: React.FC<CreationDashboardProps> = ({ 
  project, 
  onUpdateProject, 
  globalDNAs, 
  globalScoringTemplates, 
  onSaveGlobalTemplate, 
  onDeleteGlobalTemplate, 
  userSettings 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  
  if (!project) return <div className="text-zinc-500 text-center mt-20 text-lg">Project not found.</div>;

  const { data } = project;

  const updateData = (updates: Partial<typeof data>) => {
    onUpdateProject({ ...project, data: { ...data, ...updates }, updatedAt: Date.now() });
  };

  const checkKeys = () => {
    if (!userSettings?.openrouter_key) {
        alert("Please enter your OpenRouter API Key in Settings (Sidebar) to use AI features.");
        return false;
    }
    return true;
  }

  const handleInputChange = (updates: Partial<typeof data>) => {
    updateData({ ...updates, blueprint: null, result: null });
  };

  const handleAddContentPiece = (type: 'virals' | 'flops') => {
    const newItem: ContentPiece = { id: `${type}-${Date.now()}`, title: '', description: '', script: '', comments: '' };
    handleInputChange({ [type]: [...(data[type] || []), newItem] });
  };

  const handleUpdateContentPiece = (type: 'virals' | 'flops', id: string, field: keyof ContentPiece, value: string) => {
    const updatedList = (data[type] || []).map(item => item.id === id ? { ...item, [field]: value } : item);
    handleInputChange({ [type]: updatedList });
  };

  const handleRemoveContentPiece = (type: 'virals' | 'flops', id: string) => {
    handleInputChange({ [type]: (data[type] || []).filter(item => item.id !== id) });
  };

  const handleFetchComments = async (type: 'virals' | 'flops', id: string, url: string) => {
    if (!userSettings?.youtube_key) {
        alert("Please enter your YouTube API Key in Settings to fetch comments.");
        return;
    }
    try {
      const comments = await fetchYoutubeComments(url, userSettings.youtube_key);
      const updatedList = (data[type] || []).map(item => item.id === id ? { ...item, comments: comments } : item);
      handleInputChange({ [type]: updatedList });
    } catch (e: any) {
      alert(`Error fetching comments: ${e.message}`);
    }
  };

  const handleAnalyze = async () => {
    if (!checkKeys()) return;
    setIsProcessing(true);
    try {
      // Use Global Templates
      const activeScoringTemplate = (globalScoringTemplates || []).find(t => t.id === data.selectedScoringTemplateId);
      
      const blueprint = await generateScriptBlueprint(
        data.mode,
        data.language,
        data.userDraft,
        data.virals || [],
        data.flops || [],
        parseInt(data.targetWordCount) || 800,
        userSettings!.openrouter_key!,
        data.customStructurePrompt, 
        data.selectedDNA,
        activeScoringTemplate
      );
      const newVersion: VersionedItem<ScriptBlueprint> = { id: `bp-v-${Date.now()}`, timestamp: Date.now(), name: `Draft ${((data.blueprintVersions?.length) || 0) + 1}`, data: blueprint };
      updateData({ blueprint, blueprintVersions: [...(data.blueprintVersions || []), newVersion], step: 'blueprint', result: null }); 
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateFull = async () => {
    if (!data.blueprint || !checkKeys()) return;
    setIsProcessing(true);
    try {
      const result = await generateScriptFromBlueprint(
        data.blueprint,
        data.userDraft,
        data.language,
        userSettings!.openrouter_key!,
        data.customBlueprintPrompt,
        data.selectedModel 
      );
      const newVersion: VersionedItem<OptimizedResult> = { id: `rs-v-${Date.now()}`, timestamp: Date.now(), name: `Script ${((data.resultVersions?.length) || 0) + 1}`, data: result };
      updateData({ result, resultVersions: [...(data.resultVersions || []), newVersion], step: 'result' });
    } catch (e: any) {
      console.error(e);
      alert(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBlueprintChange = (updates: Partial<typeof data>) => {
      updateData({ ...updates, result: null });
  };

  const handleWriteSection = async (sectionId: string) => {
    if (!data.blueprint || !checkKeys()) return;
    const sectionIndex = data.blueprint.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;
    try {
      const section = data.blueprint.sections[sectionIndex];
      const content = await generateSectionScript(
          section, 
          data.blueprint, 
          data.userDraft, 
          data.language,
          userSettings!.openrouter_key!,
          data.customBlueprintPrompt,
          data.selectedModel 
      );
      const updatedSections = [...data.blueprint.sections];
      updatedSections[sectionIndex] = { ...section, generated_content: content };
      handleBlueprintChange({ blueprint: { ...data.blueprint, sections: updatedSections } });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<BlueprintSection>) => {
    if (!data.blueprint) return;
    const sections = data.blueprint.sections || [];
    const updatedSections = sections.map(s => s.id === sectionId ? { ...s, ...updates } : s);
    handleBlueprintChange({ blueprint: { ...data.blueprint, sections: updatedSections } });
  };

  const handleUpdateResultSection = (id: string, newContent: string) => {
    if (!data.result || !data.result.rewritten.script_sections) return;
    const updatedSections = data.result.rewritten.script_sections.map(s => s.id === id ? { ...s, content: newContent } : s);
    updateData({ result: { ...data.result, rewritten: { ...data.result.rewritten, script_sections: updatedSections } } });
  };

  const handleRefineResultSection = async (id: string, instruction: string) => {
    if (!data.result || !checkKeys()) return;
    const section = (data.result.rewritten.script_sections || []).find(s => s.id === id);
    if (!section) return;
    setIsProcessing(true);
    try {
      const newContent = await refineSection(
          section, 
          instruction, 
          "Full Script Context", 
          data.language, 
          userSettings!.openrouter_key!,
          data.selectedModel
      );
      handleUpdateResultSection(id, newContent);
    } finally {
      setIsProcessing(false);
    }
  };

  // NEW: Handle scoring for a single section
  const handleScoreSection = async (id: string) => {
    if (!data.result || !checkKeys()) return;
    const section = (data.result.rewritten.script_sections || []).find(s => s.id === id);
    if (!section) return;

    try {
        let result: ScoringResult;
        
        // Prioritize DNA scoring, fallback to first template, or generic logic
        if (data.selectedDNA) {
             result = await analyzeScriptScore(section.content, 'dna', data.language, userSettings!.openrouter_key!, data.selectedDNA);
        } else if (globalScoringTemplates && globalScoringTemplates.length > 0) {
             result = await analyzeScriptScore(section.content, 'custom', data.language, userSettings!.openrouter_key!, undefined, globalScoringTemplates[0]);
        } else {
             // Fallback: Create a temporary generic template
             const genericTemplate: ScoringTemplate = { id: 'generic', name: 'Standard Viral', criteria: [{ id: '1', name: 'Engagement', description: 'Is it boring?' }, { id: '2', name: 'Clarity', description: 'Is the message clear?' }] };
             result = await analyzeScriptScore(section.content, 'custom', data.language, userSettings!.openrouter_key!, undefined, genericTemplate);
        }
        
        // Update the section with the scoring result
        const updatedSections = data.result.rewritten.script_sections.map(s => 
            s.id === id ? { ...s, scoringResult: result } : s
        );
        updateData({ result: { ...data.result, rewritten: { ...data.result.rewritten, script_sections: updatedSections } } });

    } catch (e: any) {
        alert("Scoring Error: " + e.message);
    }
  };

  // NEW: Handle scoring for the FULL SCRIPT
  const handleScoreFullScript = async () => {
    if (!data.result || !checkKeys()) return;
    setIsProcessing(true);
    try {
        const fullText = (data.result.rewritten.script_sections || []).map(s => s.content).join('\n\n');
        let result: ScoringResult;

        // Prioritize DNA scoring, fallback to Selected Template, fallback to First Template, fallback to Generic
        if (data.selectedDNA) {
             result = await analyzeScriptScore(fullText, 'dna', data.language, userSettings!.openrouter_key!, data.selectedDNA);
        } else if (globalScoringTemplates && globalScoringTemplates.length > 0) {
             // Use selected template if set, otherwise first one
             const tmpl = globalScoringTemplates.find(t => t.id === data.selectedScoringTemplateId) || globalScoringTemplates[0];
             result = await analyzeScriptScore(fullText, 'custom', data.language, userSettings!.openrouter_key!, undefined, tmpl);
        } else {
             const genericTemplate: ScoringTemplate = { id: 'generic', name: 'Standard Viral', criteria: [{ id: '1', name: 'Engagement', description: 'Is it boring?' }, { id: '2', name: 'Clarity', description: 'Is the message clear?' }] };
             result = await analyzeScriptScore(fullText, 'custom', data.language, userSettings!.openrouter_key!, undefined, genericTemplate);
        }

        updateData({ lastScore: result });
    } catch (e: any) {
        alert("Full Script Scoring Error: " + e.message);
    } finally {
        setIsProcessing(false);
    }
  };

  // Use GLOBAL handlers
  const handleSaveScoringTemplate = (template: ScoringTemplate) => {
    onSaveGlobalTemplate(template);
  };

  const handleDeleteScoringTemplate = (id: string) => {
    onDeleteGlobalTemplate(id);
  };

  const handleUpdateScore = (result: ScoringResult) => {
    updateData({ lastScore: result });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleCopyFullScript = () => {
    if (!data.result) return;
    // UPDATED: Only concatenate script content, joined by double newlines
    const fullScript = (data.result.rewritten.script_sections || [])
        .map(s => s.content)
        .join('\n\n');
    handleCopy(fullScript, 'Full Script');
  };

  const handleRestoreBlueprint = (bp: ScriptBlueprint) => updateData({ blueprint: bp, result: null });
  const handleRestoreResult = (res: OptimizedResult) => updateData({ result: res });

  // Quick Add Template helper (Updated to use Global)
  const addDefaultTemplate = () => {
      const newTmpl: ScoringTemplate = {
          id: `tmpl-${Date.now()}`,
          name: "Standard Viral Quality",
          criteria: [
              { id: '1', name: 'Hook Retention', description: 'Does the first sentence grab attention immediately?' },
              { id: '2', name: 'Value Density', description: 'Is every sentence necessary? No fluff.' }
          ]
      };
      // Save globally
      onSaveGlobalTemplate(newTmpl);
      // Select it in current project
      handleInputChange({ selectedScoringTemplateId: newTmpl.id });
  };

  if (!data.mode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 animate-in fade-in">
        <h2 className="text-4xl font-bold text-white tracking-tight">Choose your workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button onClick={() => updateData({ mode: 'rewrite' })} className="w-72 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-blue-500 hover:bg-zinc-800 hover:scale-105 transition-all group text-left shadow-2xl relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div><div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors"><RefreshIcon className="w-7 h-7 text-blue-400" /></div><h3 className="text-xl font-bold text-white mb-3">Rewrite Draft</h3><p className="text-sm text-zinc-400 leading-relaxed">Optimize your existing draft using a selected DNA template or viral references.</p></button>
          <button onClick={() => updateData({ mode: 'idea' })} className="w-72 p-8 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:bg-zinc-800 hover:scale-105 transition-all group text-left shadow-2xl relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div><div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors"><SparklesIcon className="w-7 h-7 text-purple-400" /></div><h3 className="text-xl font-bold text-white mb-3">New Idea</h3><p className="text-sm text-zinc-400 leading-relaxed">Generate a fresh script from scratch using a DNA template structure.</p></button>
        </div>
      </div>
    );
  }

  const steps: Step[] = ['input', 'blueprint', 'result'];
  const isIdeaMode = data.mode === 'idea';
  const canAccessStep = (stepName: Step) => stepName === 'input' || (stepName === 'blueprint' && !!data.blueprint) || (stepName === 'result' && !!data.result);

  return (
    <div className="animate-in fade-in">
       <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 mb-8 -mx-8 px-8 py-4 flex items-center justify-between">
           <div className="flex items-center bg-zinc-900 p-1 rounded-full border border-zinc-800">
              {['1. INPUT', '2. BLUEPRINT', '3. RESULT'].map((label, idx) => {
                 const stepName = steps[idx];
                 return (<button key={label} onClick={() => canAccessStep(stepName) && updateData({ step: stepName })} disabled={!canAccessStep(stepName)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${data.step === stepName ? 'bg-white text-black shadow-lg' : canAccessStep(stepName) ? 'text-zinc-300 hover:text-white hover:bg-white/5' : 'text-zinc-600 cursor-not-allowed'}`}>{label}</button>);
              })}
           </div>
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg"><span className="text-[10px] font-bold text-zinc-500 uppercase">Writer AI:</span><select value={data.selectedModel || GEMINI_MODEL} onChange={(e) => updateData({ selectedModel: e.target.value })} className="bg-zinc-900 text-white text-xs font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 appearance-none min-w-[120px]">{AI_MODELS.map(m => (<option key={m.id} value={m.id} className="bg-zinc-900 text-white py-2">{m.name}</option>))}</select></div>
              <button onClick={() => updateData({ mode: null, step: 'input' })} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors" title="Exit Project"><ArrowRightIcon className="w-4 h-4" /></button>
           </div>
       </div>

       {/* UPDATE: Removed max-w-7xl, added w-full px-4 for full-width layout */}
       <div className="w-full mx-auto pb-24 px-4">
          {data.step === 'input' && (
             // UPDATE: Changed grid to 12 columns for better wide-screen usage
             <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in slide-in-from-left-4 duration-500">
                 {/* Left Column: Reference Material (Wider) */}
                 <div className="xl:col-span-7 space-y-8">
                     <section>
                         <div className="flex items-center justify-between mb-4">
                             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                 <span className="w-2 h-2 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span> Target DNA (Style)
                             </h3>
                             <button onClick={() => handleInputChange({ selectedDNA: undefined })} className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${!data.selectedDNA ? 'bg-zinc-800 text-white border-zinc-600' : 'text-zinc-500 border-zinc-800 hover:text-white'}`}>
                                 No DNA
                             </button>
                         </div>
                         
                         {/* UPDATE: Grid layout for DNA selection instead of vertical list */}
                         {globalDNAs && globalDNAs.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {globalDNAs.map(dna => (
                                    <div key={dna.id} onClick={() => handleInputChange({ selectedDNA: dna })} className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden group ${data.selectedDNA?.id === dna.id ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}>
                                        <div className={`absolute top-0 right-0 p-4 transition-opacity ${data.selectedDNA?.id === dna.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <CheckIcon className={`w-5 h-5 ${data.selectedDNA?.id === dna.id ? 'text-yellow-400' : 'text-zinc-600'}`} />
                                        </div>
                                        <h4 className={`font-bold mb-2 pr-6 ${data.selectedDNA?.id === dna.id ? 'text-yellow-400' : 'text-white'}`}>{dna.name}</h4>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            <span className="text-[10px] bg-black/40 px-2 py-1 rounded text-zinc-400 border border-white/5">
                                                {dna.analysis?.tone?.split(',')[0] || 'Unknown Tone'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 line-clamp-2">{dna.analysis?.pacing || 'No pacing data'}</p>
                                    </div>
                                ))}
                            </div>
                         ) : (
                             <div className="p-8 border-2 border-dashed border-zinc-800 rounded-xl text-center bg-zinc-900/50">
                                 <p className="text-zinc-500 text-sm">No DNA templates found. Go to DNA Lab to extract one.</p>
                             </div>
                         )}
                     </section>
                     
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                         <section>
                            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Viral References</h3><button onClick={() => handleAddContentPiece('virals')} className="text-xs bg-zinc-800 px-3 py-1.5 rounded-lg text-white hover:bg-zinc-700 flex items-center gap-1"><PlusIcon className="w-3 h-3"/> Add</button></div>
                            <div className="space-y-4">{(data.virals || []).map(v => (<InputCard key={v.id} data={v} onChange={(id, f, val) => handleUpdateContentPiece('virals', id, f, val)} onRemove={(id) => handleRemoveContentPiece('virals', id)} onFetchComments={(id, url) => handleFetchComments('virals', id, url)} isRemovable showUrl showComments compact />))}</div>
                         </section>

                         <section>
                             <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-white flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Flop References (Avoid)</h3><button onClick={() => handleAddContentPiece('flops')} className="text-xs bg-zinc-800 px-3 py-1.5 rounded-lg text-white hover:bg-zinc-700 flex items-center gap-1"><PlusIcon className="w-3 h-3"/> Add</button></div>
                             <div className="space-y-4">{(data.flops || []).map(v => (<InputCard key={v.id} data={v} onChange={(id, f, val) => handleUpdateContentPiece('flops', id, f, val)} onRemove={(id) => handleRemoveContentPiece('flops', id)} onFetchComments={(id, url) => handleFetchComments('flops', id, url)} isRemovable showUrl showComments compact />))}{(!data.flops || data.flops.length === 0) && (<p className="text-xs text-zinc-600 italic">No flop references added. (Optional)</p>)}</div>
                         </section>
                     </div>
                 </div>

                 {/* Right Column: Draft & Config (Sticky if possible) */}
                 <div className="xl:col-span-5 space-y-8">
                    <section><h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><span className={`w-2 h-2 ${isIdeaMode ? 'bg-purple-500' : 'bg-blue-500'} rounded-full shadow-[0_0_10px_currentColor]`}></span> {isIdeaMode ? "Your Idea (The Seed)" : "Your Draft (The Source)"}</h3><div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-xl relative"><InputCard data={data.userDraft} onChange={(id, field, val) => handleInputChange({ userDraft: { ...data.userDraft, [field]: val } })} className="bg-transparent border-none p-0 shadow-none hover:shadow-none hover:border-none" fieldLabels={isIdeaMode ? { title: "Idea Topic", script: "Detailed Prompt / Concept Description" } : undefined} placeholders={isIdeaMode ? { title: "e.g. 5 Ways to use AI", script: "e.g. I want to make a video about... The key points are... The tone should be..." } : undefined} />{isIdeaMode && (<div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-300"><strong>Tip:</strong> In "New Idea" mode, this prompt is the primary instruction.</div>)}</div></section>
                    
                    {/* Output Config Section */}
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl sticky top-24">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Output Config</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Language</label>
                                <select value={data.language} onChange={(e) => handleInputChange({ language: e.target.value as OutputLanguage })} className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500">{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Word Count</label>
                                <input type="number" value={data.targetWordCount} onChange={(e) => handleInputChange({ targetWordCount: e.target.value })} placeholder="800" className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500"/>
                            </div>
                        </div>

                        {/* NEW: Scoring Template / Custom Rules Selector (USING GLOBAL TEMPLATES) */}
                        <div className="mb-6">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block flex items-center justify-between">
                                <span>Quality Standards (Custom Rules)</span>
                                {(globalScoringTemplates?.length || 0) === 0 && <button onClick={addDefaultTemplate} className="text-blue-400 hover:text-blue-300">+ Add Rule</button>}
                            </label>
                            <select 
                                value={data.selectedScoringTemplateId || ""} 
                                onChange={(e) => handleInputChange({ selectedScoringTemplateId: e.target.value })} 
                                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 mb-2"
                            >
                                <option value="">-- No Specific Rules --</option>
                                {(globalScoringTemplates || []).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            
                            <label className="text-[10px] font-bold text-zinc-400 uppercase mb-1 block">Additional Instructions</label>
                             <textarea 
                                value={data.customStructurePrompt || ""} 
                                onChange={(e) => handleInputChange({ customStructurePrompt: e.target.value })} 
                                placeholder="e.g. 'Ensure strict word count limits' or 'Make it very funny'"
                                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 min-h-[60px]"
                            />
                        </div>

                        <button onClick={handleAnalyze} disabled={isProcessing || !data.userDraft.script} className="w-full py-4 rounded-xl bg-white text-black font-black text-sm hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />} GENERATE BLUEPRINT
                        </button>
                    </div>
                 </div>
             </div>
          )}
          {data.step === 'blueprint' && data.blueprint && (
             <><div className="mb-4 flex justify-end">{data.blueprintVersions && data.blueprintVersions.length > 0 && (<VersionSelector versions={data.blueprintVersions} onSelect={handleRestoreBlueprint} />)}</div><BlueprintView blueprint={data.blueprint} customBlueprintPrompt={data.customBlueprintPrompt || ''} onUpdateBlueprintPrompt={(s) => handleBlueprintChange({ customBlueprintPrompt: s })} onProceed={handleGenerateFull} onBack={() => updateData({ step: 'input' })} onWriteSection={handleWriteSection} onUpdateSection={handleUpdateSection} isWriting={isProcessing} /></>
          )}
          {data.step === 'result' && data.result && (
             // UPDATE: Changed grid to 12 columns. Main content takes 9 (more width), Scoring takes 3.
             <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in slide-in-from-right-4 duration-500">
                <div className="xl:col-span-9 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-bold text-white">Final Output</h3>
                            {/* NEW: Total Word Count Box */}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg shadow-sm">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Total Words:</span>
                                <span className="text-sm font-mono font-bold text-white">
                                    {(data.result.rewritten.script_sections || []).reduce((acc, s) => acc + (s.content.trim() ? s.content.trim().split(/\s+/).length : 0), 0)}
                                </span>
                            </div>

                            {data.resultVersions && data.resultVersions.length > 0 && (<VersionSelector versions={data.resultVersions} onSelect={handleRestoreResult} />)}
                        </div>
                        <div className="flex gap-3">
                            {/* NEW: Audit Full Script Button */}
                            <button 
                                onClick={handleScoreFullScript} 
                                disabled={isProcessing}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg font-bold hover:bg-zinc-700 hover:text-white transition-colors shadow-lg disabled:opacity-50"
                            >
                                {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <LayoutIcon className="w-4 h-4" />}
                                Audit Full Script
                            </button>
                            <button onClick={handleCopyFullScript} className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-colors shadow-lg">
                                {copyFeedback === 'Full Script' ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                {copyFeedback === 'Full Script' ? 'Copied!' : 'Copy Full Script'}
                            </button>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 shadow-2xl space-y-6">
                        <div className="group relative"><div className="flex justify-between items-start"><h1 className="text-3xl font-black text-white leading-tight pr-8">{data.result.rewritten.title}</h1><button onClick={() => handleCopy(data.result?.rewritten.title || '', 'Title')} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-white transition-all bg-black/50 rounded-lg"><CopyIcon className="w-4 h-4" /></button></div>{copyFeedback === 'Title' && <span className="absolute -top-6 right-0 text-xs text-green-400 font-bold">Copied!</span>}</div>
                        <div className="group relative"><p className="text-zinc-400 leading-relaxed pr-8">{data.result.rewritten.description}</p><button onClick={() => handleCopy(data.result?.rewritten.description || '', 'Description')} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-white transition-all bg-black/50 rounded-lg"><CopyIcon className="w-3 h-3" /></button>{copyFeedback === 'Description' && <span className="absolute -top-6 right-0 text-xs text-green-400 font-bold">Copied!</span>}</div>
                        <div className="group relative"><div className="flex flex-wrap gap-2 pr-8">{(data.result.rewritten.tags || "").split(',').map(tag => (<span key={tag} className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300 font-bold border border-zinc-700">{tag.trim().replace(/^#/, '')}</span>))}</div><button onClick={() => handleCopy(data.result?.rewritten.tags || '', 'Tags')} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-white transition-all bg-black/50 rounded-lg"><CopyIcon className="w-3 h-3" /></button>{copyFeedback === 'Tags' && <span className="absolute -top-6 right-0 text-xs text-green-400 font-bold">Copied!</span>}</div>
                    </div>
                    {/* Pass handleScoreSection to ScriptSectionCard */}
                    <div className="space-y-0">{(data.result.rewritten.script_sections || []).map((section, idx) => (<ScriptSectionCard key={section.id} section={section} index={idx} onUpdate={(id, content) => handleUpdateResultSection(id, content)} onRefine={handleRefineResultSection} onAudit={handleScoreSection} isProcessing={isProcessing} />))}</div>
                </div>
                {/* Scoring Panel Column - Sticky */}
                <div className="xl:col-span-3"><div className="sticky top-24"><ScoringPanel fullScript={(data.result.rewritten.script_sections || []).map(s => s.content).join('\n\n')} dna={data.selectedDNA} savedTemplates={globalScoringTemplates || []} lastScore={data.lastScore} language={data.language} onSaveTemplate={handleSaveScoringTemplate} onUpdateScore={handleUpdateScore} onDeleteTemplate={handleDeleteScoringTemplate} apiKey={userSettings?.openrouter_key || ''} /></div></div>
             </div>
          )}
       </div>
    </div>
  );
};
