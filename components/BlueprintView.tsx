
import React, { useState } from 'react';
import { ScriptBlueprint, BlueprintSection } from '../types';
import { SparklesIcon, SpinnerIcon, PenIcon } from './Icons';

interface Props {
  blueprint: ScriptBlueprint;
  customBlueprintPrompt: string;
  onUpdateBlueprintPrompt: (value: string) => void;
  onProceed: () => void;
  onBack: () => void; // Kept for prop interface compatibility, but unused in UI
  onWriteSection: (sectionId: string) => Promise<void>;
  onUpdateSection: (sectionId: string, updates: Partial<BlueprintSection>) => void;
  isWriting: boolean;
}

export const BlueprintView: React.FC<Props> = ({ 
  blueprint, 
  customBlueprintPrompt, 
  onUpdateBlueprintPrompt, 
  onProceed, 
  onWriteSection, 
  onUpdateSection, 
  isWriting 
}) => {
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);

  const handleWriteSection = async (sectionId: string) => {
    setGeneratingSectionId(sectionId);
    await onWriteSection(sectionId);
    setGeneratingSectionId(null);
  };

  const getWordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
  
  // Calculate total estimated words from blueprint targets
  const totalTargetWords = (blueprint.sections || []).reduce((sum, section) => sum + (section.word_count_target || 0), 0);
  
  // Calculate total generated words so far
  const totalGeneratedWords = (blueprint.sections || []).reduce((sum, section) => sum + getWordCount(section.generated_content || ""), 0);

  // Safe access to analysis object
  const analysis = blueprint.analysis;
  const hookHierarchy = analysis?.hook_hierarchy || { main_hook: "N/A", micro_hooks: [], psychological_anchor: "" };
  const pacingMap = analysis?.pacing_map || { pattern: "N/A", speed_strategy: "N/A", climax_points: [] };
  const linguisticFingerprint = analysis?.linguistic_fingerprint || { pov: "N/A", dominant_tones: [], vocabulary_style: "" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-right-4 duration-500">
        
        {/* Left Column: Analysis & Config */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-zinc-900/60 border border-white/10 rounded-3xl p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-4">
                 <h3 className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
                    Blueprint Specs
                 </h3>
                 <div className="text-right">
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold">Word Count</span>
                    <span className={`text-sm font-mono font-bold ${totalGeneratedWords > 0 ? 'text-white' : 'text-zinc-500'}`}>
                        {totalGeneratedWords} <span className="text-zinc-600">/</span> {totalTargetWords}
                    </span>
                 </div>
             </div>
             
             <div className="space-y-4">
                <div>
                   <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Main Hook</label>
                   <p className="text-sm text-white font-medium">{hookHierarchy.main_hook || "N/A"}</p>
                </div>
                <div>
                   <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-2">Micro-Hooks</label>
                   <div className="space-y-1.5">
                      {(hookHierarchy.micro_hooks || []).map((h: string, i: number) => (
                        <div key={i} className="text-xs text-zinc-400 flex gap-2">
                           <span className="text-yellow-500">◈</span> {h}
                        </div>
                      ))}
                   </div>
                </div>
                <div>
                   <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Pacing Strategy</label>
                   <p className="text-xs text-zinc-300 leading-relaxed">{pacingMap.speed_strategy || "N/A"}</p>
                </div>
             </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-purple-500/20">
              <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                  <PenIcon className="w-3 h-3" /> Global Assembly Rules
              </label>
              <textarea 
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 min-h-[120px] resize-none"
                  placeholder="e.g. 'Use a lot of rhetorical questions', 'Keep the tone more aggressive'..."
                  value={customBlueprintPrompt}
                  onChange={(e) => onUpdateBlueprintPrompt(e.target.value)}
              />
          </div>
          
          <button 
             onClick={onProceed} 
             className="w-full py-4 rounded-xl bg-white text-black font-black text-sm hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
          >
             {isWriting ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
             ASSEMBLE FULL SCRIPT
          </button>
        </div>

        {/* Right Column: Section Architecture */}
        <div className="lg:col-span-8 space-y-6 pb-24">
           {(blueprint.sections || []).map((section, idx) => (
             <div key={section.id} className="relative pl-14 group">
                <div className="absolute left-[23px] top-6 bottom-0 w-[1px] bg-zinc-800 last:hidden"></div>
                <div className={`absolute left-0 top-6 w-12 h-12 rounded-full border-4 border-black flex items-center justify-center text-sm font-bold z-10 transition-all ${section.generated_content ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                  {idx + 1}
                </div>
                
                <div className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                  <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex flex-wrap gap-4 text-[9px] uppercase font-bold tracking-widest">
                     <span className="text-yellow-400">Tact: {section.hook_tactic}</span>
                     <span className="text-blue-400">Pace: {section.pacing_instruction}</span>
                     <span className="text-zinc-500 ml-auto">EST: {section.word_count_target} WORDS</span>
                  </div>
                  
                  <div className="p-6">
                     <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-white">{section.title}</h4>
                        <div className="flex items-center gap-2">
                           <input 
                              type="text" 
                              placeholder="Instruction for this section..."
                              value={section.custom_script_prompt || ''}
                              onChange={(e) => onUpdateSection(section.id, { custom_script_prompt: e.target.value })}
                              className="bg-black/40 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none w-[180px]"
                           />
                           <button
                             onClick={() => handleWriteSection(section.id)}
                             disabled={generatingSectionId === section.id}
                             className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${section.generated_content ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
                           >
                             {generatingSectionId === section.id ? <SpinnerIcon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                             {section.generated_content ? 'Regen' : 'Draft'}
                           </button>
                        </div>
                     </div>
                     
                     <p className="text-xs text-zinc-400 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                        {section.content_plan}
                     </p>

                     {/* Preview Generated Content if available */}
                     {section.generated_content && (
                        <div className="mt-4 p-4 bg-green-500/5 border border-green-500/10 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <h5 className="text-[9px] font-bold text-green-400 uppercase">Draft Preview:</h5>
                                <span className="text-[9px] font-mono text-zinc-500">{getWordCount(section.generated_content)} words</span>
                            </div>
                            <p className="text-xs text-zinc-300 line-clamp-3 italic">{section.generated_content}</p>
                        </div>
                     )}
                  </div>
                </div>
             </div>
           ))}
        </div>
    </div>
  );
};
