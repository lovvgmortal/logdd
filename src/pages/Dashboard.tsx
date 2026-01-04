import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Sparkles, CreditCard, Search, FolderPlus, Plus, Dna, PenTool, MoreVertical, Pencil, Trash2, Folder, FolderOpen, ArrowRight, RefreshCw, Facebook } from "lucide-react";
import { CompactStatCard } from "@/components/dashboard/CompactStatCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { QuickAction } from "@/components/dashboard/QuickAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScripts } from "@/hooks/useScripts";
import { useDnas } from "@/hooks/useDnas";
import { useFolders } from "@/hooks/useFolders";
import { useOpenRouterCredits } from "@/hooks/useOpenRouterCredits";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
const quickActions = [{
  title: "Extract DNA",
  description: "Analyze viral content patterns",
  icon: Dna,
  to: "/dna-lab"
}, {
  title: "New Script",
  description: "Create content with AI",
  icon: PenTool,
  to: "/writer"
}];
export default function Dashboard() {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    scripts,
    loading: scriptsLoading,
    updateScript,
    deleteScript
  } = useScripts();
  const {
    dnas,
    loading: dnasLoading
  } = useDnas();
  const {
    folders,
    loading: foldersLoading,
    createFolder,
    deleteFolder
  } = useFolders();
  const {
    credits,
    loading: creditsLoading,
    error: creditsError,
    refetch: refetchCredits
  } = useOpenRouterCredits();
  const [searchQuery, setSearchQuery] = useState("");

  // Folder dialog
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Selected folder view
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Rename state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameScriptId, setRenameScriptId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Calculate stats
  const totalProjects = scripts.length;
  const dnaTemplates = dnas.length;

  // Format credits display - show total usage
  const getCreditsDisplay = () => {
    if (creditsLoading) return "Loading...";
    if (creditsError) {
      if (creditsError.includes("No API key")) return "No API Key";
      return "Error";
    }
    if (credits?.total_usage !== undefined) {
      return `$${credits.total_usage.toFixed(2)}`;
    }
    return "N/A";
  };

  // Filter scripts by search and folder
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.title.toLowerCase().includes(searchQuery.toLowerCase()) || script.topic && script.topic.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFolderId) {
      return matchesSearch && (script as any).folder_id === selectedFolderId;
    }
    return matchesSearch;
  });

  // Scripts without folder (for main view)
  const unfolderedScripts = scripts.filter(s => !(s as any).folder_id);
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName);
    setNewFolderName("");
    setShowFolderDialog(false);
  };
  const handleRenameScript = async () => {
    if (!renameScriptId || !renameValue.trim()) return;
    await updateScript(renameScriptId, {
      title: renameValue
    });
    setShowRenameDialog(false);
    setRenameScriptId(null);
    setRenameValue("");
  };
  const handleDeleteScript = async (id: string) => {
    await deleteScript(id);
  };
  const handleMoveToFolder = async (scriptId: string, folderId: string | null) => {
    await updateScript(scriptId, {
      folder_id: folderId
    } as any);
    toast({
      title: folderId ? "Moved to folder" : "Removed from folder",
      description: folderId ? "Script has been moved to the folder" : "Script has been moved to root"
    });
  };
  const openRenameDialog = (id: string, currentTitle: string) => {
    setRenameScriptId(id);
    setRenameValue(currentTitle);
    setShowRenameDialog(true);
  };
  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  return <div className="p-4 md:p-6 lg:p-8 space-y-6">
    {/* Compact Stats Row */}
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <CompactStatCard title="Total Projects" value={totalProjects} icon={BarChart3} iconColor="text-blue-500" />
      <CompactStatCard title="DNA Templates" value={dnaTemplates} icon={Sparkles} iconColor="text-purple-500" />
      <div className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/80">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2.5">
            <CreditCard className="h-5 w-5 text-emerald-500" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Credits Used</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{getCreditsDisplay()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => refetchCredits()}
            disabled={creditsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${creditsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <a href="https://www.facebook.com/logdd.pitre" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/80 hover:border-primary/50 hover:bg-card transition-all">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/10 p-2.5">
            <Facebook className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Contact</span>
        </div>
        <span className="text-lg font-semibold">LONG
        </span>
      </a>
    </div>

    {/* Dashboard Header */}
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        {selectedFolder ? <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedFolderId(null)}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-primary" />
              {selectedFolder.name}
            </h1>
            <p className="text-muted-foreground">
              {filteredScripts.length} scripts in this folder
            </p>
          </div>
        </div> : <>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your viral engineering projects.</p>
        </>}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFolderDialog(true)}>
          <FolderPlus className="h-4 w-4" />
          New Folder
        </Button>
        <Button size="sm" className="gap-2" asChild>
          <Link to="/writer">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>
    </div>

    {/* Search Bar */}
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input placeholder="Search projects and folders..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
    </div>

    {/* Quick Actions - Only show on main view */}
    {!selectedFolderId && <div className="grid gap-3 sm:grid-cols-2">
      {quickActions.map(action => <QuickAction key={action.title} {...action} />)}
    </div>}

    {/* Folders - Only show on main view */}
    {!selectedFolderId && folders.length > 0 && <div className="space-y-4">
      <h2 className="text-lg font-semibold">Folders</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {folders.map(folder => {
          const folderScriptCount = scripts.filter(s => (s as any).folder_id === folder.id).length;
          return <div key={folder.id} className="relative group p-4 rounded-2xl border border-border/50 bg-card/80 hover:border-primary/50 transition-all cursor-pointer" onClick={() => setSelectedFolderId(folder.id)}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{folder.name}</h3>
                <p className="text-xs text-muted-foreground">{folderScriptCount} items</p>
              </div>
            </div>

            {/* Folder Actions */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={e => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>;
        })}
      </div>
    </div>}

    {/* Project Grid */}
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        {selectedFolderId ? "Scripts" : "Recent Projects"}
      </h2>

      {scriptsLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/50" />)}
      </div> : (selectedFolderId ? filteredScripts : unfolderedScripts.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.topic && s.topic.toLowerCase().includes(searchQuery.toLowerCase()))).length > 0 ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(selectedFolderId ? filteredScripts : unfolderedScripts.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.topic && s.topic.toLowerCase().includes(searchQuery.toLowerCase()))).map(script => <div key={script.id} className="relative group">
          <ProjectCard
            title={script.title}
            status={script.status || "draft"}
            mode={(script as any).generation_mode || undefined}
            date={script.created_at}
            onClick={() => navigate(`/writer/${script.id}`)}
          />

          {/* Actions Menu */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openRenameDialog(script.id, script.title)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>

                {folders.length > 0 && <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Move to folder
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(script as any).folder_id && <DropdownMenuItem onClick={() => handleMoveToFolder(script.id, null)}>
                      <Folder className="h-4 w-4 mr-2" />
                      Remove from folder
                    </DropdownMenuItem>}
                    {folders.filter(f => f.id !== (script as any).folder_id).map(folder => <DropdownMenuItem key={folder.id} onClick={() => handleMoveToFolder(script.id, folder.id)}>
                      <Folder className="h-4 w-4 mr-2" />
                      {folder.name}
                    </DropdownMenuItem>)}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleDeleteScript(script.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>)}
      </div> : <div className="rounded-2xl border border-dashed border-border/50 p-12 text-center">
        <p className="text-muted-foreground">
          {searchQuery ? "No projects found matching your search." : selectedFolderId ? "No scripts in this folder yet." : "No projects yet. Create your first script!"}
        </p>
        <Button className="mt-4" asChild>
          <Link to="/writer">
            <Plus className="mr-2 h-4 w-4" />
            Create Script
          </Link>
        </Button>
      </div>}
    </div>

    {/* Create Folder Dialog */}
    <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Folder Name</Label>
            <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="My folder..." onKeyDown={e => e.key === "Enter" && handleCreateFolder()} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowFolderDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Rename Dialog */}
    <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} placeholder="Project name..." onKeyDown={e => e.key === "Enter" && handleRenameScript()} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
          <Button onClick={handleRenameScript}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}