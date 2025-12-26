
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
  userSettings: UserSettings | null; // NEW PROP
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

  // ... (Rest of Component - handleSaveEditor, startEdit, etc. unchanged) ...
  // Re-implementing concise render logic

  const handleSaveEditor = () => { if (!activeDNA) return; const existing = (savedDNAs || []).find(d => d.id === activeDNA.id); if (existing) { onUpdateDNA(activeDNA); } else { onSaveDNA(activeDNA); } setView('library'); setActiveDNA(null); setParentDNA(null); setVirals([]); setFlops([]); setCustomPrompt(""); };
  const startEdit = (dna: ScriptDNA) => { setActiveDNA(dna); setParentDNA(null); setView('editor'); };
  const startEvolve = (dna: ScriptDNA) => { setParentDNA(dna); setVirals([]); setFlops([]); setCustomPrompt(""); setView('extractor'); }

  // ... (View logic mostly same, just updating fetch comments calls in render) ...
  
  if (view === 'library') {
      return (
          <div className="animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-8"><div><h1 className="text-3xl font-bold text-white tracking-tight">DNA Library</h1><p className="text-zinc-500 mt-2">Manage your extracted viral patterns.</p></div><button onClick={() => { setView('extractor'); setVirals([]); setFlops([]); setActiveDNA(null); setParentDNA(null); }} className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10"><PlusIcon className="w-4 h-4" /> New Extraction</button></div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{(savedDNAs || []).map(dna => (<div key={dna.id} className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-yellow-500/50 transition-all hover:-translate-y-1 relative flex flex-col justify-between h-full"><div><div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEdit(dna)} className="p-2 bg-black/50 rounded-lg hover:bg-white/20 text-zinc-400 hover:text-white" title="Quick Edit"><EditIcon className="w-4 h-4" /></button><button onClick={() => onDeleteDNA(dna.id)} className="p-2 bg-black/50 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400" title="Delete"><TrashIcon className="w-4 h-4" /></button></div><div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4"><DnaIcon className="w-6 h-6 text-yellow-400" /></div><h3 className="text-lg font-bold text-white mb-2">{dna.name}</h3><div className="space-y-2 mb-4"><div className="flex flex-wrap gap-2"><span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">{(dna.analysis?.tone || '').split(',')[0]}</span><span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">~{dna.source_urls?.length || 0} Sources</span></div><p className="text-xs text-zinc-500 line-clamp-2">{dna.analysis?.pacing || 'No pacing data'}</p></div></div><div className="pt-4 border-t border-zinc-800 mt-2"><button onClick={() => startEvolve(dna)} className="w-full py-2 bg-zinc-950 border border-zinc-700 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-400 rounded-lg text-xs font-bold text-zinc-400 transition-all flex items-center justify-center gap-2"><RefreshIcon className="w-3.5 h-3.5" /> Evolve / Retrain</button></div></div>))}</div>
          </div>
      );
  }

  if (view === 'extractor') {
      return (
          <div className="max-w-6xl mx-auto pb-24 animate-in fade-in">
             <div className="flex items-center justify-between mb-8"><button onClick={() => setView('library')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"><ArrowRightIcon className="w-4 h-4 rotate-180" /> Back to Library</button><div className="text-right"><h2 className="text-2xl font-bold text-white">{parentDNA ? 'Evolve Existing DNA' : 'New DNA Extraction'}</h2>{parentDNA && <p className="text-sm text-yellow-500 font-medium">Training Base: {parentDNA.name}</p>}</div></div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                 <div className="space-y-6"><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-green-400 flex items-center gap-2"><CheckIcon className="w-5 h-5" /> {parentDNA ? 'New Virals' : 'Virals'}</h3><button onClick={() => handleAddPiece(virals, setVirals)} className="text-xs bg-zinc-800 px-3 py-1.5 rounded hover:bg-zinc-700 text-white">Add Video</button></div>{virals.map((v) => (<InputCard key={v.id} data={v} onChange={(id, f, val) => handleUpdatePiece(virals, setVirals, id, f, val)} onRemove={() => setVirals(virals.filter(x => x.id !== v.id))} onFetchComments={(id, url) => handleFetchComments(virals, setVirals, id, url)} isRemovable showUrl showComments fieldLabels={{ script: "Transcript", comments: "Audience Comments" }} placeholders={{ script: "Paste content here..." }} />))}</div>
                 <div className="space-y-6"><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-red-400 flex items-center gap-2"><TrashIcon className="w-5 h-5" /> {parentDNA ? 'New Flops' : 'Flops'}</h3><button onClick={() => handleAddPiece(flops, setFlops)} className="text-xs bg-zinc-800 px-3 py-1.5 rounded hover:bg-zinc-700 text-white">Add Video</button></div>{flops.map((v) => (<InputCard key={v.id} data={v} onChange={(id, f, val) => handleUpdatePiece(flops, setFlops, id, f, val)} onRemove={() => setFlops(flops.filter(x => x.id !== v.id))} onFetchComments={(id, url) => handleFetchComments(flops, setFlops, id, url)} isRemovable showUrl showComments fieldLabels={{ script: "Transcript", comments: "Audience Comments" }} placeholders={{ script: "Paste content here..." }} />))}</div>
             </div>
             <div className="bg-zinc-900 sticky bottom-8 p-4 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-center justify-between z-50 gap-4"><div className="flex-1 w-full md:w-auto relative group"><PenIcon className="absolute top-3 left-3 w-4 h-4 text-zinc-500" /><textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Override default analysis logic..." className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-yellow-500/50 min-h-[50px] resize-none leading-relaxed placeholder-zinc-600"/><div className="absolute -top-3 left-3 px-1 bg-zinc-900 text-[9px] font-bold text-zinc-500 uppercase">Override Logic</div></div><div className="flex items-center gap-4 shrink-0"><div className="flex flex-col"><label className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Language</label><select value={language} onChange={(e) => setLanguage(e.target.value as OutputLanguage)} className="bg-black border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 outline-none h-[42px]">{LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</select></div><button onClick={handleExtractOrRefine} disabled={isProcessing || virals.length === 0} className={`h-[42px] px-8 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 mt-auto ${parentDNA ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-white text-black hover:bg-yellow-400'}`}>{isProcessing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (parentDNA ? <RefreshIcon className="w-5 h-5" /> : <DnaIcon className="w-5 h-5" />)}{parentDNA ? "Run Evolution" : "Analyze & Extract DNA"}</button></div></div>
          </div>
      );
  }

  // ... (Editor View is same logic, simplified for XML) ...
  if (view === 'editor' && activeDNA) {
     // (Assume Editor UI is consistent with previous full implementation, omitting for XML brevity unless requested to change)
     // Actually I should include the Editor view to ensure it renders.
     const updateAnalysis = (field: keyof typeof activeDNA.analysis, value: any) => { setActiveDNA({ ...activeDNA, analysis: { ...activeDNA.analysis, [field]: value } }); };
     const ArrayEditor = ({ label, data, onChange, colorClass }: any) => (<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-full flex flex-col"><label className={`text-[10px] font-bold uppercase mb-3 block ${colorClass} flex items-center gap-2`}><GridIcon className="w-3 h-3" /> {label}</label><div className="flex-1 bg-black/40 border border-zinc-800 rounded-xl p-2 relative"><textarea className={`w-full h-full bg-transparent text-xs font-mono p-2 focus:outline-none resize-none ${colorClass}`} value={JSON.stringify(data, null, 2)} onChange={(e) => { try { onChange(JSON.parse(e.target.value)); } catch {} }} /></div></div>);
     const analysis = activeDNA.analysis || { structure_skeleton: [], viral_triggers: [], retention_tactics: [], flop_reasons: [], pacing: '', tone: '', audience_psychology: '', linguistic_style: '', hook_technique: '' };
     return (<div className="max-w-7xl mx-auto pb-48 animate-in fade-in"><div className="flex items-center justify-between mb-8 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-40 border-b border-white/5"><button onClick={() => setView('library')} className="text-zinc-400 hover:text-white text-sm flex items-center gap-2"><ArrowRightIcon className="w-4 h-4 rotate-180" /> Cancel</button><input className="bg-transparent border-b border-zinc-700 text-2xl font-bold text-white text-center focus:border-yellow-500 focus:outline-none w-[300px]" value={activeDNA.name} onChange={(e) => setActiveDNA({ ...activeDNA, name: e.target.value })} placeholder="Untitled DNA" /><button onClick={handleSaveEditor} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-green-400 transition-colors shadow-lg shadow-white/10 flex items-center gap-2"><CheckIcon className="w-4 h-4" /> Save DNA</button></div><div className="grid grid-cols-1 lg:grid-cols-12 gap-6"><div className="lg:col-span-4 space-y-6"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl"><label className="text-[10px] font-bold text-zinc-500 uppercase mb-4 block flex items-center gap-2"><SparklesIcon className="w-3 h-3 text-purple-400" /> Linguistic Style</label><textarea className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-300 text-sm min-h-[100px] focus:outline-none focus:border-purple-500/50 transition-all" value={analysis.linguistic_style} onChange={(e) => updateAnalysis('linguistic_style', e.target.value)} /></div><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl"><label className="text-[10px] font-bold text-zinc-500 uppercase mb-4 block flex items-center gap-2"><CheckIcon className="w-3 h-3 text-blue-400" /> Hook Technique</label><textarea className="w-full bg-black/40 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-300 text-sm min-h-[80px] focus:outline-none focus:border-blue-500/50 transition-all" value={analysis.hook_technique} onChange={(e) => updateAnalysis('hook_technique', e.target.value)} /></div><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl"><label className="text-[10px] font-bold text-zinc-500 uppercase mb-4 block flex items-center gap-2"><RefreshIcon className="w-3 h-3 text-yellow-400" /> Pacing & Tone</label><div className="space-y-4"><div><span className="text-[9px] text-zinc-600 uppercase font-bold block mb-1">Pacing</span><textarea className="w-full bg-black/40 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs min-h-[60px] focus:outline-none focus:border-yellow-500/50" value={analysis.pacing} onChange={(e) => updateAnalysis('pacing', e.target.value)} /></div><div><span className="text-[9px] text-zinc-600 uppercase font-bold block mb-1">Tone</span><textarea className="w-full bg-black/40 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs min-h-[60px] focus:outline-none focus:border-yellow-500/50" value={analysis.tone} onChange={(e) => updateAnalysis('tone', e.target.value)} /></div></div></div></div><div className="lg:col-span-8 space-y-6"><div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"><div className="absolute top-0 right-0 p-6 opacity-10"><SearchIcon className="w-24 h-24 text-white" /></div><label className="text-[10px] font-bold text-zinc-500 uppercase mb-3 block">Audience Psychology</label><textarea className="w-full bg-transparent border-none text-white text-lg font-medium min-h-[80px] focus:outline-none placeholder-zinc-700 resize-none leading-relaxed" value={analysis.audience_psychology} onChange={(e) => updateAnalysis('audience_psychology', e.target.value)} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]"><ArrayEditor label="Structural Skeleton" data={analysis.structure_skeleton || []} onChange={(d:any) => updateAnalysis('structure_skeleton', d)} colorClass="text-blue-400" /><ArrayEditor label="Viral Triggers" data={analysis.viral_triggers || []} onChange={(d:any) => updateAnalysis('viral_triggers', d)} colorClass="text-green-400" /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[250px]"><ArrayEditor label="Retention Tactics" data={analysis.retention_tactics || []} onChange={(d:any) => updateAnalysis('retention_tactics', d)} colorClass="text-purple-400" /><ArrayEditor label="Flop Avoidance" data={analysis.flop_reasons || []} onChange={(d:any) => updateAnalysis('flop_reasons', d)} colorClass="text-red-400" /></div></div></div></div>);
  }

  return null;
};
