
import React, { useState, useRef, useEffect } from 'react';
import { Project, Folder } from '../../types';
import { FolderIcon, PlusIcon, SearchIcon, HomeIcon, EditIcon, TrashIcon } from '../Icons';

interface DashboardViewProps {
  projects: Project[];
  folders: Folder[];
  onOpenProject: (id: string) => void;
  onNewProject: (fid?: string) => void;
  onDeleteProject: (e: React.MouseEvent, id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onCreateFolder: (name: string) => void;
  onMoveProject: (pid: string, fid?: string) => void;
}

const FolderSelector = ({ folders, currentFolderId, onSelect, onClose }: { folders: Folder[], currentFolderId?: string, onSelect: (fid?: string) => void, onClose: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200">
            <p className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-1">Move To</p>
            <button 
                onClick={(e) => { e.stopPropagation(); onSelect(undefined); }}
                className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 flex items-center gap-2 ${!currentFolderId ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
            >
                <HomeIcon className="w-3 h-3" /> Root Library
            </button>
            {folders.map(f => (
                <button 
                    key={f.id}
                    onClick={(e) => { e.stopPropagation(); onSelect(f.id); }}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 flex items-center gap-2 ${currentFolderId === f.id ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}
                >
                    <FolderIcon className="w-3 h-3" /> {f.name}
                </button>
            ))}
        </div>
    );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ projects, folders, onOpenProject, onNewProject, onDeleteProject, onRenameProject, onCreateFolder, onMoveProject }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempName, setTempName] = useState("");
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [movingProjectId, setMovingProjectId] = useState<string | null>(null);

    const activeFolder = folders.find(f => f.id === activeFolderId);
    const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFolder = activeFolderId ? p.folderId === activeFolderId : !p.folderId; 
        return matchesSearch && matchesFolder;
    });
    const searchModeProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const displayedProjects = searchQuery ? searchModeProjects : filteredProjects;
    const displayedFolders = searchQuery ? filteredFolders : (activeFolderId ? [] : folders);

    const handleStartRename = (e: React.MouseEvent, p: Project) => { e.stopPropagation(); setEditingId(p.id); setTempName(p.name); }
    const handleFinishRename = (id: string) => { if(tempName.trim()) onRenameProject(id, tempName); setEditingId(null); }
    
    return (
    <div className="animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{activeFolderId ? activeFolder?.name : 'Dashboard'}</h1>
                <p className="text-zinc-500 mt-2">{activeFolderId ? `Managing projects in ${activeFolder?.name}` : 'Manage your viral engineering projects.'}</p>
            </div>
            <div className="flex gap-3">
                 <button onClick={() => setIsCreateFolderOpen(!isCreateFolderOpen)} className="bg-zinc-800 text-white px-4 py-3 rounded-full font-bold hover:bg-zinc-700 transition-colors flex items-center gap-2"><FolderIcon className="w-4 h-4" /> New Folder</button>
                 <button onClick={() => onNewProject(activeFolderId || undefined)} className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10">
                    <PlusIcon className="w-4 h-4" /> {activeFolderId ? 'New in Folder' : 'New Project'}
                 </button>
            </div>
        </div>

        <div className="relative mb-8">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
                type="text" 
                placeholder="Search projects and folders..." 
                className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder-zinc-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {isCreateFolderOpen && (<div className="mb-8 p-4 bg-zinc-900 border border-zinc-700 rounded-xl flex gap-3 animate-in slide-in-from-top-2"><input className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white" placeholder="Folder Name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} /><button onClick={() => { if(newFolderName) { onCreateFolder(newFolderName); setNewFolderName(''); setIsCreateFolderOpen(false); } }} className="bg-white text-black px-4 py-2 rounded-lg font-bold">Create</button></div>)}

        {activeFolderId && !searchQuery && (
            <div className="flex items-center gap-2 mb-6 text-sm text-zinc-400">
                <button onClick={() => setActiveFolderId(null)} className="hover:text-white flex items-center gap-1"><HomeIcon className="w-3 h-3" /> Dashboard</button>
                <span>/</span>
                <span className="text-white font-bold flex items-center gap-2"><FolderIcon className="w-3 h-3" /> {activeFolder?.name}</span>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!activeFolderId && displayedFolders.map(folder => (
                <div key={folder.id} onClick={() => { setActiveFolderId(folder.id); setSearchQuery(""); }} className="group bg-zinc-900/30 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900/60 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-center min-h-[160px]">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors"><FolderIcon className="w-6 h-6 text-blue-400" /></div>
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{folder.name}</h3>
                    <p className="text-xs text-zinc-500">{projects.filter(p => p.folderId === folder.id).length} projects</p>
                </div>
            ))}

            {displayedProjects.map(project => (
                <div key={project.id} onClick={() => onOpenProject(project.id)} className="group bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900 hover:border-white/10 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                        <button onClick={(e) => handleStartRename(e, project)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white" title="Rename"><EditIcon className="w-4 h-4" /></button>
                        <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setMovingProjectId(movingProjectId === project.id ? null : project.id); }} className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${project.folderId ? 'text-blue-400' : 'text-zinc-500 hover:text-blue-400'}`} title="Move to folder"><FolderIcon className="w-4 h-4" /></button>
                            {movingProjectId === project.id && (
                                <FolderSelector folders={folders} currentFolderId={project.folderId} onSelect={(fid) => { onMoveProject(project.id, fid); setMovingProjectId(null); }} onClose={() => setMovingProjectId(null)} />
                            )}
                        </div>
                        <button onClick={(e) => onDeleteProject(e, project.id)} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-red-400" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-col h-full justify-between">
                        <div>
                            <div className="mb-4"><span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${project.data.result ? 'bg-green-500/10 text-green-400 border-green-500/20' : project.data.blueprint ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>{project.data.result ? 'Completed' : project.data.blueprint ? 'In Progress' : 'Draft'}</span></div>
                            {editingId === project.id ? (
                                <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} onBlur={() => handleFinishRename(project.id)} onKeyDown={e => e.key === 'Enter' && handleFinishRename(project.id)} onClick={e => e.stopPropagation()} className="bg-black border border-zinc-600 rounded px-2 py-1 text-white font-bold w-full mb-2" />
                            ) : (
                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{project.name || "Untitled Project"}</h3>
                            )}
                            <p className="text-sm text-zinc-500 line-clamp-2">{project.data.userDraft.description || project.data.userDraft.title || "No description provided."}</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className="text-xs text-zinc-600">{new Date(project.updatedAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-zinc-700 uppercase">{project.data.language}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
    );
};
