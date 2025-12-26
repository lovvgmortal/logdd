import React, { useState } from 'react';
import { ScriptNode, ChannelProfile, ContentPiece } from '../types';
import { generateScriptStructure, generateNodeContent } from '../services/geminiService';
import { SparklesIcon, CopyIcon, TrashIcon, RefreshIcon } from './Icons';

interface Props {
  virals: ContentPiece[];
  profile?: ChannelProfile;
}

export const FlowBuilder: React.FC<Props> = ({ virals, profile }) => {
  const [topic, setTopic] = useState("");
  const [nodes, setNodes] = useState<ScriptNode[]>([]);
  const [isAnalzying, setIsAnalyzing] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const handleCreateStructure = async () => {
    if (!topic) return;
    setIsAnalyzing(true);
    try {
      const newNodes = await generateScriptStructure(topic, virals, profile);
      setNodes(newNodes);
    } catch (e) {
      console.error(e);
      alert("Failed to analyze structure");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateNode = async (node: ScriptNode) => {
    setActiveNodeId(node.id);
    try {
      const content = await generateNodeContent(node, nodes, topic, profile);
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, content } : n));
    } catch (e) {
      console.error(e);
    } finally {
      setActiveNodeId(null);
    }
  };

  const handleGenerateAll = async () => {
    // Sequential generation to maintain context
    for (const node of nodes) {
      if (!node.content) {
        await handleGenerateNode(node);
      }
    }
  };

  const copyFullScript = () => {
    const fullText = nodes.map(n => n.content).join("\n\n");
    navigator.clipboard.writeText(fullText);
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* 1. TOPIC INPUT */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-12">
        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">What is your video about?</label>
        <div className="flex gap-4">
          <input 
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-white focus:outline-none"
            placeholder="e.g. Top 10 React Libraries for 2025"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
          <button 
            disabled={isAnalzying || !topic}
            onClick={handleCreateStructure}
            className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {isAnalzying ? <SparklesIcon className="animate-spin w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
            Create Blueprint
          </button>
        </div>
      </div>

      {/* 2. FLOW VISUALIZATION */}
      {nodes.length > 0 && (
        <div className="relative pl-8 md:pl-0">
          
          {/* Vertical connection line (The "Wire") */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-zinc-700 to-transparent -translate-x-1/2 hidden md:block"></div>
          
          <div className="space-y-8 relative">
            {nodes.map((node, index) => (
              <div key={node.id} className="relative md:flex md:items-start md:justify-center group">
                
                {/* Connector Dot */}
                <div className="absolute left-[-2rem] md:left-1/2 top-8 w-4 h-4 bg-zinc-800 border-2 border-zinc-600 rounded-full md:-translate-x-1/2 z-10 group-hover:border-white transition-colors"></div>

                {/* Card */}
                <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all rounded-xl p-6 w-full md:w-[600px] shadow-lg relative z-0">
                  <div className="flex justify-between items-start mb-4">
                     <div>
                       <span className="text-xs font-mono text-zinc-500 mb-1 block">BLOCK {index + 1}</span>
                       <h3 className="text-lg font-bold text-white">{node.type}</h3>
                     </div>
                     <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">~{node.wordCountTarget} words</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-zinc-400 italic bg-zinc-950/50 p-3 rounded border border-zinc-800/50">
                      Goal: {node.description}
                    </p>
                  </div>

                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-300 min-h-[150px] focus:outline-none focus:ring-1 focus:ring-zinc-600 font-medium"
                    value={node.content}
                    placeholder="Content will be generated here..."
                    onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? {...n, content: e.target.value} : n))}
                  />

                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => handleGenerateNode(node)}
                      disabled={!!activeNodeId}
                      className="text-xs flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-white transition-colors"
                    >
                      {activeNodeId === node.id ? <RefreshIcon className="animate-spin w-3 h-3" /> : <SparklesIcon className="w-3 h-3" />}
                      {node.content ? 'Regenerate' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-8 mt-12 flex justify-center gap-4 z-20">
            <button 
              onClick={handleGenerateAll}
              disabled={!!activeNodeId}
              className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-xl hover:bg-zinc-200 transition-transform hover:-translate-y-1"
            >
              Run Flow (Generate All)
            </button>
            <button 
              onClick={copyFullScript}
              className="bg-zinc-800 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-zinc-700 transition-transform hover:-translate-y-1 flex items-center gap-2"
            >
              <CopyIcon className="w-4 h-4" /> Copy Full Script
            </button>
          </div>

        </div>
      )}
    </div>
  );
};