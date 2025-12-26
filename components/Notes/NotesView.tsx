
import React, { useState } from 'react';
import { Note } from '../../types';
import { SearchIcon, PlusIcon, PaletteIcon, MaximizeIcon, TrashIcon, MinimizeIcon } from '../Icons';

const NOTE_COLORS: Record<string, string> = {
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200 selection:bg-yellow-500/30',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-200 selection:bg-blue-500/30',
    green: 'bg-green-500/10 border-green-500/20 text-green-200 selection:bg-green-500/30',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-200 selection:bg-purple-500/30',
    red: 'bg-red-500/10 border-red-500/20 text-red-200 selection:bg-red-500/30',
    gray: 'bg-zinc-800/50 border-zinc-700 text-zinc-300 selection:bg-zinc-600/30'
};

interface NotesViewProps {
  notes: Note[];
  onCreate: () => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onCreate, onUpdate, onDelete }) => {
    const [search, setSearch] = useState("");
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
    const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));
    const activeNote = notes.find(n => n.id === expandedNoteId);

    const ColorPicker = ({ noteId, current }: { noteId: string, current?: string }) => (
        <div className="flex gap-1.5 p-1 bg-black/50 rounded-full border border-white/10 backdrop-blur-md shadow-xl">
            {Object.keys(NOTE_COLORS).map(color => (
                <button
                    key={color}
                    onClick={(e) => { e.stopPropagation(); onUpdate(noteId, { color }); }}
                    className={`w-3 h-3 rounded-full transition-all border border-transparent hover:scale-125 ${color === 'yellow' ? 'bg-yellow-400' : color === 'blue' ? 'bg-blue-400' : color === 'green' ? 'bg-green-400' : color === 'purple' ? 'bg-purple-400' : color === 'red' ? 'bg-red-400' : 'bg-zinc-400'} ${current === color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                />
            ))}
        </div>
    );

    return (
        <div className="animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-8">
                <div><h1 className="text-3xl font-bold text-white tracking-tight">Quick Notes</h1><p className="text-zinc-500 mt-2">Capture ideas, hooks, and snippets.</p></div>
                <button onClick={onCreate} className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10"><PlusIcon className="w-4 h-4" /> New Note</button>
            </div>
            <div className="relative mb-8"><SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" /><input type="text" placeholder="Search notes..." className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder-zinc-600" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNotes.map(note => {
                    const colorClass = NOTE_COLORS[note.color || 'yellow'];
                    return (
                        <div key={note.id} className={`group ${colorClass} border rounded-xl p-5 transition-all relative flex flex-col h-[280px] hover:shadow-lg hover:-translate-y-1`}>
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                                <div className="relative group/palette"><button className="p-1.5 rounded bg-black/20 hover:bg-black/40 text-current transition-colors"><PaletteIcon className="w-3.5 h-3.5" /></button><div className="absolute right-0 top-full mt-2 opacity-0 group-hover/palette:opacity-100 pointer-events-none group-hover/palette:pointer-events-auto transition-all"><ColorPicker noteId={note.id} current={note.color} /></div></div>
                                <button onClick={() => setExpandedNoteId(note.id)} className="p-1.5 rounded bg-black/20 hover:bg-black/40 text-current transition-colors"><MaximizeIcon className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDelete(note.id)} className="p-1.5 rounded bg-black/20 hover:bg-red-500 text-current hover:text-white transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
                            </div>
                            <input className={`bg-transparent text-lg font-bold placeholder-current/50 focus:outline-none mb-3 w-full pr-16 ${note.color === 'gray' ? 'text-white' : ''}`} placeholder="Untitled Note" value={note.title} onChange={(e) => onUpdate(note.id, { title: e.target.value })} />
                            <textarea className={`flex-1 bg-transparent text-sm placeholder-current/40 focus:outline-none resize-none leading-relaxed custom-scrollbar ${note.color === 'gray' ? 'text-zinc-300' : ''}`} placeholder="Type something..." value={note.content} onChange={(e) => onUpdate(note.id, { content: e.target.value })} />
                            <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center text-[10px] opacity-60 font-medium"><span>{new Date(note.updatedAt).toLocaleDateString()}</span><span className="font-mono">{note.content.length} chars</span></div>
                        </div>
                    );
                })}
            </div>
            {activeNote && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setExpandedNoteId(null)}></div>
                    <div className={`relative w-full max-w-4xl h-[85vh] ${NOTE_COLORS[activeNote.color || 'yellow']} border rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col transform transition-all animate-in zoom-in-95 duration-300`}>
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-black/5"><div className="flex items-center gap-4"><ColorPicker noteId={activeNote.id} current={activeNote.color} /><span className="text-xs font-mono opacity-50 uppercase tracking-widest">{new Date(activeNote.updatedAt).toLocaleString()}</span></div><button onClick={() => setExpandedNoteId(null)} className="p-2 rounded-full bg-black/10 hover:bg-black/20 text-current transition-colors"><MinimizeIcon className="w-5 h-5" /></button></div>
                        <input className={`bg-transparent text-3xl sm:text-4xl font-black placeholder-current/50 focus:outline-none mb-6 w-full ${activeNote.color === 'gray' ? 'text-white' : ''}`} placeholder="Untitled Note" value={activeNote.title} onChange={(e) => onUpdate(activeNote.id, { title: e.target.value })} autoFocus />
                        <textarea className={`flex-1 bg-transparent text-lg sm:text-xl font-light placeholder-current/40 focus:outline-none resize-none leading-relaxed custom-scrollbar ${activeNote.color === 'gray' ? 'text-zinc-300' : ''}`} placeholder="Start writing..." value={activeNote.content} onChange={(e) => onUpdate(activeNote.id, { content: e.target.value })} />
                    </div>
                </div>
            )}
        </div>
    );
};
