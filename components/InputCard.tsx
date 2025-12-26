
import React, { useState } from 'react';
import { ContentPiece } from '../types';
import { TrashIcon, LayoutIcon, NoteIcon, EditIcon, GlobeIcon, RefreshIcon, SpinnerIcon } from './Icons';
import { PLACEHOLDERS } from '../constants';

interface InputCardProps {
  data: ContentPiece;
  onChange: (id: string, field: keyof ContentPiece, value: string) => void;
  onRemove?: (id: string) => void;
  onFetchComments?: (id: string, url: string) => Promise<void>; 
  label?: string; 
  isRemovable?: boolean;
  className?: string;
  compact?: boolean;
  fieldLabels?: {
    title?: string;
    description?: string;
    script?: string;
    comments?: string;
  };
  placeholders?: {
    title?: string;
    description?: string;
    script?: string;
    comments?: string;
    url?: string;
  };
  showComments?: boolean; 
  showUrl?: boolean;      
  showDescription?: boolean; // New prop to explicitly control description visibility
}

export const InputCard: React.FC<InputCardProps> = ({ 
  data, 
  onChange, 
  onRemove, 
  onFetchComments,
  label, 
  isRemovable, 
  className, 
  compact,
  fieldLabels,
  placeholders,
  showComments = false,
  showUrl = false,
  showDescription = true // Default to true so it shows up for Virals/Flops too
}) => {
  const getWordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
  const [activeTab, setActiveTab] = useState<'script' | 'comments'>('script');
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchClick = async () => {
    if (!data.url || !onFetchComments) return;
    setIsFetching(true);
    try {
      await onFetchComments(data.id, data.url);
      setActiveTab('comments'); 
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-all duration-300 hover:border-zinc-600 hover:shadow-lg group relative ${className}`}>
      
      {/* Optional Label Header */}
      {label && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">{label}</h3>
        </div>
      )}

      {/* Floating Delete Button */}
      {isRemovable && onRemove && (
        <button 
          onClick={() => onRemove(data.id)}
          className={`absolute top-4 right-4 p-2 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all z-10 ${!label ? 'opacity-0 group-hover:opacity-100' : ''}`}
          title="Remove"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}

      <div className="space-y-4">
        {/* Title & URL Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-2">
                 <EditIcon className="w-3 h-3" /> {fieldLabels?.title || 'Title'}
              </label>
              <input
                type="text"
                className="w-full bg-black/20 border-b border-zinc-700 px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:bg-black/40 transition-all font-semibold text-sm rounded-t-md"
                placeholder={placeholders?.title || PLACEHOLDERS.title}
                value={data.title}
                onChange={(e) => onChange(data.id, 'title', e.target.value)}
              />
            </div>
            
            {showUrl && (
                <div>
                   <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-2">
                     <GlobeIcon className="w-3 h-3" /> YouTube URL
                   </label>
                   <div className="flex gap-2">
                     <input
                      type="text"
                      className="flex-1 bg-black/20 border-b border-zinc-700 px-3 py-2 text-blue-400 placeholder-zinc-700 focus:outline-none focus:border-blue-500 focus:bg-black/40 transition-all text-xs font-mono rounded-t-md h-[34px]"
                      placeholder={placeholders?.url || "https://youtube.com/watch?v=..."}
                      value={data.url || ''}
                      onChange={(e) => onChange(data.id, 'url', e.target.value)}
                    />
                    {onFetchComments && (
                      <button 
                        onClick={handleFetchClick}
                        disabled={isFetching || !data.url}
                        className="h-[34px] bg-zinc-800 hover:bg-zinc-700 text-white px-4 rounded-t-md text-[10px] font-bold uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 border-b border-zinc-700"
                        title="Fetch Top Comments"
                      >
                         {isFetching ? <SpinnerIcon className="w-3 h-3 animate-spin" /> : <RefreshIcon className="w-3 h-3" />}
                         FETCH
                      </button>
                    )}
                   </div>
                </div>
            )}
        </div>

        {/* Tabs for Content vs Comments (if comments enabled) */}
        {showComments && (
            <div className="flex border-b border-zinc-800 mb-2">
                <button 
                    onClick={() => setActiveTab('script')}
                    className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all ${activeTab === 'script' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                    Script / Transcript
                </button>
                <button 
                    onClick={() => setActiveTab('comments')}
                    className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all ${activeTab === 'comments' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                    Comments / Feedback {data.comments ? '✓' : ''}
                </button>
            </div>
        )}

        {/* Script Content */}
        {(!showComments || activeTab === 'script') && (
            <div>
              {!showComments && (
                  <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-2">
                     <NoteIcon className="w-3 h-3" /> {fieldLabels?.script || 'Script Content'}
                  </label>
              )}
              <div className="relative">
                <textarea
                  className={`w-full bg-black/20 border border-zinc-800 rounded-lg px-3 py-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:bg-black/40 focus:border-zinc-600 transition-all text-xs font-normal leading-relaxed resize-y pb-6 ${compact ? 'min-h-[80px]' : 'min-h-[150px]'}`}
                  placeholder={placeholders?.script || PLACEHOLDERS.script}
                  value={data.script}
                  onChange={(e) => onChange(data.id, 'script', e.target.value)}
                />
                <div className="absolute bottom-2 right-3 text-[10px] text-zinc-500 font-mono pointer-events-none select-none">
                    {getWordCount(data.script)} words
                </div>
              </div>
            </div>
        )}

        {/* Comments Content */}
        {showComments && activeTab === 'comments' && (
             <div>
                <div className="relative">
                    <textarea
                    className="w-full bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-3 text-yellow-100/80 placeholder-yellow-500/30 focus:outline-none focus:bg-black/40 focus:border-yellow-500/30 transition-all text-xs font-normal leading-relaxed resize-y pb-6 min-h-[150px]"
                    placeholder={placeholders?.comments || "Paste top comments here OR click 'Fetch' above to auto-load audience sentiment..."}
                    value={data.comments || ''}
                    onChange={(e) => onChange(data.id, 'comments', e.target.value)}
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/20 rounded text-[9px] text-yellow-500 font-bold uppercase">
                        Audience Voice
                    </div>
                </div>
            </div>
        )}

        {/* Description Field */}
        {showDescription && (
            <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 flex items-center gap-2">
                <LayoutIcon className="w-3 h-3" /> {fieldLabels?.description || 'Description / Notes'}
            </label>
            <div className="relative">
                <textarea
                className="w-full bg-black/20 border border-zinc-800 rounded-lg px-3 py-3 text-zinc-300 placeholder-zinc-600 focus:outline-none focus:bg-black/40 focus:border-zinc-600 transition-all min-h-[60px] text-xs leading-relaxed resize-none pb-6"
                placeholder={placeholders?.description || PLACEHOLDERS.description}
                value={data.description}
                onChange={(e) => onChange(data.id, 'description', e.target.value)}
                />
            </div>
            </div>
        )}

      </div>
    </div>
  );
};
