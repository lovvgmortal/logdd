
import React, { useState } from 'react';
import { ScriptDNA, ScoringTemplate, ScoringResult, OutputLanguage, ScoringCriterion } from '../../types';
import { analyzeScriptScore } from '../../services/geminiService';
import { SparklesIcon, SpinnerIcon, CheckIcon, PlusIcon, TrashIcon, EditIcon, LayoutIcon, RefreshIcon } from '../Icons';

interface Props {
  fullScript: string;
  dna?: ScriptDNA;
  savedTemplates: ScoringTemplate[];
  lastScore?: ScoringResult;
  language: OutputLanguage;
  onSaveTemplate: (template: ScoringTemplate) => void;
  onUpdateScore: (result: ScoringResult) => void;
  onDeleteTemplate: (id: string) => void;
  apiKey: string; // NEW PROP
}

export const ScoringPanel: React.FC<Props> = ({ 
  fullScript, dna, savedTemplates, lastScore, language, 
  onSaveTemplate, onUpdateScore, onDeleteTemplate, apiKey 
}) => {
  const [activeTab, setActiveTab] = useState<'dna' | 'custom'>('dna');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Custom Template State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ScoringTemplate>({
    id: '', name: '', criteria: [{ id: '1', name: '', description: '' }]
  });

  const handleRunAnalysis = async () => {
    if (!apiKey) {
      alert("Missing OpenRouter API Key. Please add it in Settings.");
      return;
    }
    setIsAnalyzing(true);
    try {
      let result;
      if (activeTab === 'dna') {
        if (!dna) return;
        result = await analyzeScriptScore(fullScript, 'dna', language, apiKey, dna);
      } else {
        const template = isEditing ? editTemplate : savedTemplates.find(t => t.id === selectedTemplateId);
        if (!template) { alert("Please select or create a template"); return; }
        result = await analyzeScriptScore(fullScript, 'custom', language, apiKey, undefined, template);
      }
      onUpdateScore(result);
    } catch (e: any) {
      alert("Scoring failed: " + e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateNewTemplate = () => {
    setEditTemplate({ id: `tmpl-${Date.now()}`, name: 'New Scoring Template', criteria: [{ id: '1', name: 'Engagement', description: 'Is the script engaging from start to finish?' }, { id: '2', name: 'Clarity', description: 'Is the message easy to understand?' }] });
    setIsEditing(true); setSelectedTemplateId(""); setActiveTab('custom');
  };

  const handleSaveCurrentTemplate = () => { if (!editTemplate.name) return; onSaveTemplate(editTemplate); setIsEditing(false); setSelectedTemplateId(editTemplate.id); };
  const updateCriterion = (idx: number, field: keyof ScoringCriterion, val: string) => { const newCriteria = [...editTemplate.criteria]; newCriteria[idx] = { ...newCriteria[idx], [field]: val }; setEditTemplate({ ...editTemplate, criteria: newCriteria }); };
  const addCriterion = () => { setEditTemplate({ ...editTemplate, criteria: [...editTemplate.criteria, { id: Date.now().toString(), name: '', description: '' }] }); };
  const removeCriterion = (idx: number) => { const newCriteria = editTemplate.criteria.filter((_, i) => i !== idx); setEditTemplate({ ...editTemplate, criteria: newCriteria }); };
  const getColor = (score: number) => { if (score >= 80) return 'text-green-400 border-green-500/50 bg-green-500/10'; if (score >= 60) return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10'; return 'text-red-400 border-red-500/50 bg-red-500/10'; };

  const currentTemplate = savedTemplates.find(t => t.id === selectedTemplateId);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2"><LayoutIcon className="w-5 h-5 text-purple-400" /> Scoring & Audit</h3>
        <div className="flex bg-black rounded-lg p-1 border border-zinc-800">
          <button onClick={() => setActiveTab('dna')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'dna' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>DNA Match</button>
          <button onClick={() => setActiveTab('custom')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'custom' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Custom Rules</button>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        {activeTab === 'dna' && (dna ? (<div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl"><p className="text-sm text-purple-200 mb-2 font-medium">Analyzing against: <span className="font-bold">{dna.name}</span></p><div className="flex gap-2 text-xs text-zinc-400"><span className="bg-black/30 px-2 py-1 rounded">Tone: {dna.analysis.tone}</span><span className="bg-black/30 px-2 py-1 rounded">Pacing: {dna.analysis.pacing}</span></div></div>) : (<div className="p-6 bg-zinc-800/50 border border-zinc-700 border-dashed rounded-xl text-center"><p className="text-sm text-zinc-400 font-medium mb-1">No DNA Template Selected</p><p className="text-xs text-zinc-600">Select a DNA in the Input step to score against it.</p></div>))}
        
        {activeTab === 'custom' && (
            <div className="space-y-4">
                {!isEditing ? (
                    <div className="flex flex-col gap-3">
                         <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select 
                                    value={selectedTemplateId} 
                                    onChange={(e) => setSelectedTemplateId(e.target.value)} 
                                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-blue-500 cursor-pointer text-sm font-bold"
                                >
                                    <option value="" disabled>-- Select a Rule Template --</option>
                                    {savedTemplates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.criteria.length} criteria)</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
                            </div>
                            <button onClick={handleCreateNewTemplate} className="px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 text-white" title="New Template"><PlusIcon className="w-5 h-5" /></button>
                         </div>
                         
                         {currentTemplate && (
                             <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 relative group">
                                 <div className="absolute top-2 right-2 flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setEditTemplate(currentTemplate); setIsEditing(true); }} className="p-1.5 hover:bg-white/20 rounded text-zinc-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
                                      <button onClick={() => { onDeleteTemplate(currentTemplate.id); setSelectedTemplateId(""); }} className="p-1.5 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                 </div>
                                 <h4 className="font-bold text-white mb-2">{currentTemplate.name}</h4>
                                 <ul className="space-y-1">
                                     {currentTemplate.criteria.slice(0, 3).map((c, i) => (
                                         <li key={i} className="text-xs text-zinc-500 flex items-center gap-2"><span className="w-1 h-1 bg-zinc-500 rounded-full"></span> {c.name}</li>
                                     ))}
                                     {currentTemplate.criteria.length > 3 && <li className="text-xs text-zinc-600 italic">...and {currentTemplate.criteria.length - 3} more</li>}
                                 </ul>
                             </div>
                         )}
                    </div>
                ) : (
                    <div className="bg-black/40 border border-zinc-700 rounded-xl p-4 animate-in fade-in">
                        <div className="flex justify-between items-start mb-4">
                            <input className="bg-transparent border-b border-zinc-700 text-white font-bold text-lg focus:outline-none focus:border-blue-500 w-full mr-4" placeholder="Template Name" value={editTemplate.name} onChange={e => setEditTemplate({ ...editTemplate, name: e.target.value })} />
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(false)} className="text-xs text-zinc-500 hover:text-white px-3 py-1">Cancel</button>
                                <button onClick={handleSaveCurrentTemplate} className="text-xs bg-white text-black font-bold px-3 py-1 rounded hover:bg-zinc-200">Save</button>
                            </div>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {editTemplate.criteria.map((c, idx) => (
                                <div key={idx} className="flex gap-2 items-start">
                                    <span className="text-zinc-600 text-xs mt-2.5 font-mono">{idx + 1}.</span>
                                    <div className="flex-1 space-y-1">
                                        <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-sm text-white focus:border-zinc-600 focus:outline-none placeholder-zinc-700" placeholder="Criterion Name" value={c.name} onChange={e => updateCriterion(idx, 'name', e.target.value)} />
                                        <input className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-400 focus:border-zinc-600 focus:outline-none placeholder-zinc-700" placeholder="Description" value={c.description} onChange={e => updateCriterion(idx, 'description', e.target.value)} />
                                    </div>
                                    <button onClick={() => removeCriterion(idx)} className="mt-2 text-zinc-600 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                            <button onClick={addCriterion} className="w-full py-2 border border-dashed border-zinc-800 rounded text-xs text-zinc-500 hover:text-white hover:border-zinc-600 flex items-center justify-center gap-2"><PlusIcon className="w-3 h-3" /> Add Criterion</button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>

      {lastScore && (<div className="border-t border-zinc-800 pt-6 animate-in slide-in-from-bottom-2"><div className="flex items-center justify-between mb-6"><div><h4 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Total Score</h4><div className={`text-4xl font-black ${getColor(lastScore.total_score).split(' ')[0]}`}>{lastScore.total_score}/100</div></div><div className="text-right"><span className="text-[10px] text-zinc-600 block mb-1">Analyzed at</span><span className="text-xs text-zinc-400 font-mono">{new Date(lastScore.timestamp).toLocaleTimeString()}</span></div></div><div className="space-y-4 mb-6">{(lastScore.breakdown || []).map((item, i) => (<div key={i} className="bg-black/30 rounded-xl p-4 border border-zinc-800"><div className="flex justify-between items-center mb-2"><span className="font-bold text-sm text-white">{item.criteria}</span><span className={`px-2 py-0.5 rounded text-xs font-bold border ${getColor(item.score)}`}>{item.score}</span></div><p className="text-xs text-zinc-400 mb-2">{item.reasoning}</p><div className="flex gap-2 items-start bg-blue-500/5 p-2 rounded border border-blue-500/10"><SparklesIcon className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" /><p className="text-[10px] text-blue-300 font-medium">Tip: {item.improvement_tip}</p></div></div>))}</div><div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800"><h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Overall Verdict</h5><p className="text-sm text-zinc-300 leading-relaxed italic">"{lastScore.overall_feedback}"</p></div></div>)}
    </div>
  );
};
