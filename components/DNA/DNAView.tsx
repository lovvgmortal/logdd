
import React, { useState } from 'react';
import { ScriptDNA, ContentPiece, OutputLanguage, UserSettings } from '../../types';
import { extractScriptDNA, refineScriptDNA } from '../../services/geminiService';
import { fetchYoutubeComments } from '../../services/youtubeService';
import { InputCard } from '../InputCard';
import { SpinnerIcon, SearchIcon, PlusIcon, DnaIcon, CheckIcon, TrashIcon, EditIcon, ArrowRightIcon, RefreshIcon, PenIcon, SparklesIcon, GridIcon } from '../Icons';

interface DNAViewProps {
  savedDNAs: ScriptDNA[];
  onSaveDNA: (dna: ScriptDNA) => void;
  onDeleteDNA: (id: string) => void;
  onUpdateDNA: (dna: ScriptDNA) => void;
  userSettings: UserSettings | null;
}

const LANGUAGES: OutputLanguage[] = ['English', 'Vietnamese', 'Spanish', 'Japanese', 'Korean'];

export const DNAView: React.FC<DNAViewProps> = ({ savedDNAs, onSaveDNA, onDeleteDNA, onUpdateDNA, userSettings }) => {
  const [view, setView] = useState<'library' | 'extractor' | 'editor'>('library');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDNA, setActiveDNA] = useState<ScriptDNA | null>(null);
  const [parentDNA, setParentDNA] = useState<ScriptDNA | null>(null);

  const [virals, setVirals] = useState<ContentPiece[]>([]);
  const [flops, setFlops] = useState<ContentPiece[]>([]);
  const [language, setLanguage] = useState<OutputLanguage>('English');
  const [customPrompt, setCustomPrompt] = useState("");

  const handleAddPiece = (list: ContentPiece[], setList: React.Dispatch<React.SetStateAction<ContentPiece[]>>) => {
    setList([...list, { id: `ref-${Date.now()}`, title: '', description: '', script: '', comments: '' }]);
  };

  const handleUpdatePiece = (list: ContentPiece[], setList: React.Dispatch<React.SetStateAction<ContentPiece[]>>, id: string, field: keyof ContentPiece, value: string) => {
    setList(list.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleFetchComments = async (list: ContentPiece[], setList: React.Dispatch<React.SetStateAction<ContentPiece[]>>, id: string, url: string) => {
    if (!userSettings?.youtube_key) {
        alert("Please enter YouTube API Key in Settings.");
        return;
    }
    try {
      const comments = await fetchYoutubeComments(url, userSettings.youtube_key);
      handleUpdatePiece(list, setList, id, 'comments', comments);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExtractOrRefine = async () => {
    if (virals.length === 0 || !virals[0].script) { alert("Please add at least one viral video with a transcript."); return; }
    if (!userSettings?.openrouter_key) { alert("Please enter OpenRouter API Key in Settings."); return; }
    
    setIsProcessing(true);
    try {
        let result: ScriptDNA;
        if (parentDNA) {
            result = await refineScriptDNA(parentDNA, virals, flops, language, userSettings.openrouter_key, customPrompt);
        } else {
            result = await extractScriptDNA(virals, flops, language, userSettings.openrouter_key, customPrompt);
        }
        setActiveDNA(result);
        setView('editor');
    } catch (e: any) {
        alert("Failed to process DNA: " + e.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleSaveEditor = () => { if (!activeDNA) return; const existing = (savedDNAs || []).find(d => d.id === activeDNA.id); if (existing) { onUpdateDNA(activeDNA); } else { onSaveDNA(activeDNA); } setView('library'); setActiveDNA(null); setParentDNA(null); setVirals([]); setFlops([]); setCustomPrompt(""); };
  const startEdit = (dna: ScriptDNA) => { setActiveDNA(dna); setParentDNA(null); setView('editor'); };
  const startEvolve = (dna: ScriptDNA) => { setParentDNA(dna); setVirals([]); setFlops([]); setCustomPrompt(""); setView('extractor'); }

  // --- IMPROVED UI: Card-style List Editor with Textarea ---
  const ListEditor = ({ label, items, onChange, colorClass, placeholder }: { label: string, items: string[], onChange: (items: string[]) => void, colorClass: string, placeholder?: string }) => {
    const handleChange = (index: number, val: string) => {
        const newItems = [...items];
        newItems[index] = val;
        onChange(newItems);
    };
    const handleAdd = () => onChange([...items, ""]);
    const handleRemove = (index: number) => onChange(items.filter((_, i) => i !== index));

    // Extract bg color from text color class (naive mapping for UI glow)
    const bgColorClass = colorClass.replace('text-', 'bg-');

    return (
        <div className="bg-zinc-900/80 border border-white/5 rounded-3xl p-5 h-full flex flex-col group hover:border-white/10 transition-all shadow-xl backdrop-blur-sm relative overflow-hidden">
            {/* Ambient colored glow based on category color */}
            <div className={`absolute top-0 left-0 w-full h-1 opacity-50 ${bgColorClass}`}></div>

            <label className={`text-xs font-black uppercase tracking-widest mb-4 block ${colorClass} flex items-center gap-2`}>
                <GridIcon className="w-4 h-4" /> {label}
            </label>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 max-h-[250px] lg:max-h-none">
                {items.length === 0 && (
                    <div className="text-center py-8 opacity-30 text-xs italic">
                        No items yet. Add one below.
                    </div>
                )}
                {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start group/item animate-in slide-in-from-bottom-2 duration-300">
                        <span className="text-[10px] font-mono text-zinc-600 w-4 text-right mt-3">{idx + 1}.</span>
                        <div className="flex-1 relative">
                            <textarea 
                                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-all placeholder-zinc-700 shadow-inner min-h-[70px] resize-y leading-relaxed"
                                value={item}
                                onChange={(e) => handleChange(idx, e.target.value)}
                                placeholder={placeholder || "Enter detail..."}
                            />
                            {/* Color dot indicator inside input */}
                            <div className={`absolute right-3 top-4 w-1.5 h-1.5 rounded-full opacity-0 group-focus-within/item:opacity-100 transition-opacity ${bgColorClass}`}></div>
                        </div>
                        
                        <button 
                            onClick={() => handleRemove(idx)} 
                            className="p-2.5 mt-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover/item:opacity-100 scale-90 hover:scale-100"
                            title="Remove Item"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="pt-4 mt-2 border-t border-white/5">
                <button onClick={handleAdd} className="w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-transparent hover:border-white/10 group/btn">
                    <div className={`p-0.5 rounded-full border border-zinc-600 group-hover/btn:border-white/50 transition-colors`}>
                        <PlusIcon className="w-3 h-3" />
                    </div>
                    Add {label.split(' ')[0]}
                </button>
            </div>
        </div>
    );
  };

  if (view === 'library') {
      return (
          <div className="animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-8"><div><h1 className="text-3xl font-bold text-white tracking-tight">DNA Library</h1><p className="text-zinc-500 mt-2">Manage your extracted viral patterns.</p></div><button onClick={() => { setView('extractor'); setVirals([]); setFlops([]); setActiveDNA(null); setParentDNA(null); }} className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10"><PlusIcon className="w-4 h-4" /> New Extraction</button></div>
             {/* UPDATE: Increased column count for XL screens */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{(savedDNAs || []).map(dna => (<div key={dna.id} className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-yellow-500/50 transition-all hover:-translate-y-1 relative flex flex-col justify-between h-full"><div><div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEdit(dna)} className="p-2 bg-black/50 rounded-lg hover:bg-white/20 text-zinc-400 hover:text-white" title="Quick Edit"><EditIcon className="w-4 h-4" /></button><button onClick={() => onDeleteDNA(dna.id)} className="p-2 bg-black/50 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400" title="Delete"><TrashIcon className="w-4 h-4" /></button></div><div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4"><DnaIcon className="w-6 h-6 text-yellow-400" /></div><h3 className="text-lg font-bold text-white mb-2">{dna.name}</h3><div className="space-y-2 mb-4"><div className="flex flex-wrap gap-2"><span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">{(dna.analysis?.tone || '').split(',')[0]}</span><span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">~{dna.source_urls?.length || 0} Sources</span></div><p className="text-xs text-zinc-500 line-clamp-2">{dna.analysis?.pacing || 'No pacing data'}</p></div></div><div className="pt-4 border-t border-zinc-800 mt-2"><button onClick={() => startEvolve(dna)} className="w-full py-2 bg-zinc-950 border border-zinc-700 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-400 rounded-lg text-xs font-bold text-zinc-400 transition-all flex items-center justify-center gap-2"><RefreshIcon className="w-3.5 h-3.5" /> Evolve / Retrain</button></div></div>))}</div>
          </div>
      );
  }

  if (view === 'extractor') {
      return (
          // UPDATE: max-w-6xl -> w-full
          <div className="w-full mx-auto pb-24 animate-in fade-in">
             <div className="flex items-center justify-between mb-8"><button onClick={() => setView('library')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"><ArrowRightIcon className="w-4 h-4 rotate-180" /> Back to Library</button><div className="text-right"><h2 className="text-2xl font-bold text-white">{parentDNA ? 'Evolve Existing DNA' : 'New DNA Extraction'}</h2>{parentDNA && <p className="text-sm text-yellow-500 font-medium">Training Base: {parentDNA.name}</p>}</div></div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                 <div className="space-y-6"><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-green-400 flex items-center gap-2"><CheckIcon className="w-5 h-5" /> {parentDNA ? 'New Virals' : 'Virals'}</h3><button onClick={() => handleAddPiece(virals, setVirals)} className="text-xs bg-zinc-800 px-3 py-1.5 rounded hover:bg-zinc-700 text-white">Add Video</button></div>{virals.map((v) => (<InputCard key={v.id} data={v} onChange={(id, f, val) => handleUpdatePiece(virals, setVirals, id, f, val)} onRemove={() => setVirals(virals.filter(x => x.id !== v.id))} onFetchComments={(id, url) => handleFetchComments(virals, setVirals, id, url)} isRemovable showUrl showComments fieldLabels={{ script: "Transcript", comments: "Audience Comments" }} placeholders={{ script: "Paste content here..." }} />))}</div>
                 <div className="space-y-6"><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-red-400 flex items-center gap-2"><TrashIcon className="w-5 h-5" /> {parentDNA ? 'New Flops' : 'Flops'}</h3><button onClick={() => handleAddPiece(flops, setFlops)} className="text-xs bg-zinc-800 px-3 py-1.5 rounded hover:bg-zinc-700 text-white">Add Video</button></div>{flops.map((v) => (<InputCard key={v.id} data={v} onChange={(id, f, val) => handleUpdatePiece(flops, setFlops, id, f, val)} onRemove={() => setFlops(flops.filter(x => x.id !== v.id))} onFetchComments={(id, url) => handleFetchComments(flops, setFlops, id, url)} isRemovable showUrl showComments fieldLabels={{ script: "Transcript", comments: "Audience Comments" }} placeholders={{ script: "Paste content here..." }} />))}</div>
             </div>
             <div className="bg-zinc-900 sticky bottom-8 p-4 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-center justify-between z-50 gap-4"><div className="flex-1 w-full md:w-auto relative group"><PenIcon className="absolute top-3 left-3 w-4 h-4 text-zinc-500" /><textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Override default analysis logic..." className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-yellow-500/50 min-h-[50px] resize-none leading-relaxed placeholder-zinc-600"/><div className="absolute -top-3 left-3 px-1 bg-zinc-900 text-[9px] font-bold text-zinc-500 uppercase">Override Logic</div></div><div className="flex items-center gap-4 shrink-0"><div className="flex flex-col"><label className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Language</label><select value={language} onChange={(e) => setLanguage(e.target.value as OutputLanguage)} className="bg-black border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 outline-none h-[42px]">{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select></div><button onClick={handleExtractOrRefine} disabled={isProcessing || virals.length === 0} className={`h-[42px] px-8 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 mt-auto ${parentDNA ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-white text-black hover:bg-yellow-400'}`}>{isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (parentDNA ? <RefreshIcon className="w-5 h-5" /> : <DnaIcon className="w-5 h-5" />)}{parentDNA ? "Run Evolution" : "Analyze & Extract DNA"}</button></div></div>
          </div>
      );
  }

  if (view === 'editor' && activeDNA) {
     const updateAnalysis = (field: keyof typeof activeDNA.analysis, value: any) => { setActiveDNA({ ...activeDNA, analysis: { ...activeDNA.analysis, [field]: value } }); };
     const updateSentiment = (field: 'high_dopamine_triggers' | 'confusion_points' | 'objections', value: any) => { 
        setActiveDNA({ ...activeDNA, analysis: { ...activeDNA.analysis, audience_sentiment: { ...activeDNA.analysis.audience_sentiment, [field]: value } } }); 
     };
     
     const analysis = activeDNA.analysis || { structure_skeleton: [], viral_triggers: [], retention_tactics: [], flop_reasons: [], pacing: '', tone: '', audience_psychology: '', linguistic_style: '', hook_technique: '', audience_sentiment: { high_dopamine_triggers: [], confusion_points: [], objections: [] } };
     const sentiment = analysis.audience_sentiment || { high_dopamine_triggers: [], confusion_points: [], objections: [] };

     return (
        // UPDATE: max-w-7xl -> w-full
        <div className="w-full mx-auto pb-48 animate-in fade-in">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-40 border-b border-white/5">
                <button onClick={() => setView('library')} className="text-zinc-400 hover:text-white text-sm flex items-center gap-2"><ArrowRightIcon className="w-4 h-4 rotate-180" /> Cancel</button>
                <input className="bg-transparent border-b border-zinc-700 text-2xl font-bold text-white text-center focus:border-yellow-500 focus:outline-none w-[300px]" value={activeDNA.name} onChange={(e) => setActiveDNA({ ...activeDNA, name: e.target.value })} placeholder="Untitled DNA" />
                <button onClick={handleSaveEditor} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-green-400 transition-colors shadow-lg shadow-white/10 flex items-center gap-2"><CheckIcon className="w-4 h-4" /> Save DNA</button>
            </div>
            
            {/* UPDATE: Optimized grid for XL screens (12 columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: DNA Core Specs (Narrower on XL screens) */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                    {/* User Constraints Input (NEW) */}
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-xl relative group">
                        <label className="text-[10px] font-bold text-yellow-400 uppercase mb-4 block flex items-center gap-2">
                             <PenIcon className="w-3 h-3" /> My Notes / Constraints
                        </label>
                        <textarea 
                            className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm min-h-[120px] focus:outline-none focus:border-yellow-500 transition-all placeholder-zinc-600" 
                            placeholder="Add your own mandatory elements or notes here (optional)..."
                            value={activeDNA.user_notes || ''} 
                            onChange={(e) => setActiveDNA({ ...activeDNA, user_notes: e.target.value })} 
                        />
                        <div className="absolute top-4 right-4 text-[9px] text-zinc-600 bg-black/50 px-2 py-1 rounded">Optional</div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-4 block flex items-center gap-2"><SparklesIcon className="w-3 h-3 text-purple-400" /> Linguistic Style</label>
                        <textarea className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-300 text-sm min-h-[100px] focus:outline-none focus:border-purple-500/50 transition-all" value={analysis.linguistic_style} onChange={(e) => updateAnalysis('linguistic_style', e.target.value)} />
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-4 block flex items-center gap-2"><CheckIcon className="w-3 h-3 text-blue-400" /> Hook Technique</label>
                        <textarea className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-300 text-sm min-h-[80px] focus:outline-none focus:border-blue-500/50 transition-all" value={analysis.hook_technique} onChange={(e) => updateAnalysis('hook_technique', e.target.value)} />
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-4 block flex items-center gap-2"><RefreshIcon className="w-3 h-3 text-yellow-400" /> Pacing & Tone</label>
                        <div className="space-y-4">
                            <div><span className="text-[9px] text-zinc-600 uppercase font-bold block mb-1">Pacing</span><textarea className="w-full bg-black/40 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs min-h-[60px] focus:outline-none focus:border-yellow-500/50" value={analysis.pacing} onChange={(e) => updateAnalysis('pacing', e.target.value)} /></div>
                            <div><span className="text-[9px] text-zinc-600 uppercase font-bold block mb-1">Tone</span><textarea className="w-full bg-black/40 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs min-h-[60px] focus:outline-none focus:border-yellow-500/50" value={analysis.tone} onChange={(e) => updateAnalysis('tone', e.target.value)} /></div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Deep Analysis (Wider on XL screens) */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><SearchIcon className="w-24 h-24 text-white" /></div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase mb-3 block">Audience Psychology Overview</label>
                        <textarea className="w-full bg-transparent border-none text-white text-lg font-medium min-h-[80px] focus:outline-none placeholder-zinc-700 resize-none leading-relaxed" value={analysis.audience_psychology} onChange={(e) => updateAnalysis('audience_psychology', e.target.value)} />
                    </div>

                    {/* Audience Sentiment Breakdown - Editable */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:h-[320px]">
                         <ListEditor label="High Dopamine (Keep)" items={sentiment.high_dopamine_triggers || []} onChange={(d) => updateSentiment('high_dopamine_triggers', d)} colorClass="text-green-400" placeholder="e.g. 'Unexpected plot twist'" />
                         <ListEditor label="Confusion Points (Fix)" items={sentiment.confusion_points || []} onChange={(d) => updateSentiment('confusion_points', d)} colorClass="text-yellow-400" placeholder="e.g. 'Jargon used too early'" />
                         <ListEditor label="Objections (Address)" items={sentiment.objections || []} onChange={(d) => updateSentiment('objections', d)} colorClass="text-red-400" placeholder="e.g. 'Price is too high'" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:h-[400px]">
                        <ListEditor label="Structural Skeleton" items={analysis.structure_skeleton || []} onChange={(d) => updateAnalysis('structure_skeleton', d)} colorClass="text-blue-400" placeholder="e.g. '0:00 - Cold Hook'" />
                        <ListEditor label="Viral Triggers" items={analysis.viral_triggers || []} onChange={(d) => updateAnalysis('viral_triggers', d)} colorClass="text-green-400" placeholder="e.g. 'Visual Pattern Interrupt'" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:h-[250px]">
                        <ListEditor label="Retention Tactics" items={analysis.retention_tactics || []} onChange={(d) => updateAnalysis('retention_tactics', d)} colorClass="text-purple-400" placeholder="e.g. 'Open Loops'" />
                        <ListEditor label="Flop Avoidance" items={analysis.flop_reasons || []} onChange={(d) => updateAnalysis('flop_reasons', d)} colorClass="text-red-400" placeholder="e.g. 'Slow Intro'" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return null;
};
