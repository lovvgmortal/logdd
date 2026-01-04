import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { History, Copy, Clock, Edit2, Check, X, Trash2, FileJson } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

import { ScoreResult } from "@/lib/script-generator";

export interface VersionEntry {
  id?: string;
  name?: string;
  content: string;
  timestamp: string;
  wordCount?: number;
  script?: string;
  outlineVersionId?: string;
  score?: ScoreResult;
}

interface VersionHistoryProps {
  versions: VersionEntry[];
  type: "outline" | "script";
  onRestore: (entry: VersionEntry) => void;
  onUpdateName?: (entry: VersionEntry, newName: string) => void;
  onDelete?: (entry: VersionEntry) => void;
  renderInfo?: (entry: VersionEntry) => React.ReactNode;
  disabled?: boolean;
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function VersionHistory({ versions, type, onRestore, onUpdateName, onDelete, renderInfo, disabled }: VersionHistoryProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<VersionEntry | null>(null);

  const handleRestore = (entry: VersionEntry) => {
    onRestore(entry);
    setOpen(false);
    setSelectedVersion(null);
    toast({
      title: "Restored",
      description: `${type === "outline" ? "Outline" : "Script"} version loaded to editor`,
    });
  };

  const handleDeleteClick = (entry: VersionEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      setDeleteTarget(entry);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget);
      if (selectedVersion !== null) setSelectedVersion(null);
      setDeleteTarget(null);
      toast({
        title: "Deleted",
        description: "Version removed from history",
      });
    }
  };

  const handleStartEditName = (index: number, currentName: string) => {
    setEditingNameIndex(index);
    setEditingNameValue(currentName);
  };

  const handleSaveName = (index: number, entry: VersionEntry, e: React.FormEvent) => {
    e.stopPropagation();
    if (onUpdateName && editingNameValue.trim()) {
      onUpdateName(entry, editingNameValue);
      setEditingNameIndex(null);
    }
  };

  const handleCancelEditName = (e: React.FormEvent) => {
    e.stopPropagation();
    setEditingNameIndex(null);
    setEditingNameValue("");
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not copy content",
        variant: "destructive",
      });
    }
  };

  const handleSelectVersion = (index: number, content: string) => {
    if (selectedVersion === index) {
      setSelectedVersion(null);
    } else {
      setSelectedVersion(index);
    }
  };

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Sheet open={open} onOpenChange={(value) => {
      setOpen(value);
      if (!value) {
        setSelectedVersion(null);
        setEditingNameIndex(null);
      }
    }}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || versions.length === 0}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          History ({versions.length})
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {type === "outline" ? "Outline" : "Script"} History
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <div className="space-y-3 pr-4">
            {sortedVersions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No versions saved yet
              </p>
            ) : (
              sortedVersions.map((version, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedVersion === index
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    }`}
                  onClick={() => handleSelectVersion(index, version.content)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {editingNameIndex === index ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Input
                            value={editingNameValue}
                            onChange={(e) => setEditingNameValue(e.target.value)}
                            className="h-7 w-32 text-xs"
                            autoFocus
                            onClick={e => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName(index, version, e);
                              if (e.key === 'Escape') handleCancelEditName(e);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={(e) => handleSaveName(index, version, e)}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-red-50" onClick={handleCancelEditName}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group">
                          <span className="text-foreground/90 font-semibold">
                            {version.name || `Draft ${index + 1}`}
                          </span>
                          {onUpdateName && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditName(index, version.name || `Draft ${index + 1}`);
                              }}
                            >
                              <Edit2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {renderInfo && renderInfo(version)}
                      {version.score && (
                        <div className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${version.score.score >= 90 ? 'bg-green-100 text-green-700' :
                          version.score.score >= 80 ? 'bg-blue-100 text-blue-700' :
                            version.score.score >= 70 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                          }`}>
                          {version.score.score}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(version.timestamp), "HH:mm")}
                      </span>
                    </div>
                  </div>

                  {/* Word count & copy */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {version.wordCount || 0} words
                    </span>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteClick(version, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <p className="text-sm line-clamp-3 text-foreground/80">
                    {version.content.substring(0, 200)}
                    {version.content.length > 200 ? "..." : ""}
                  </p>

                  {selectedVersion === index && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {/* Content Preview */}
                      <ScrollArea className="h-[250px]">
                        <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/70 leading-relaxed">
                          {version.content}
                        </pre>
                      </ScrollArea>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version);
                          }}
                          className="flex-1 gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit in Main Editor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyContent(version.content);
                          }}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <AlertDialog open={!!deleteTarget} onOpenChange={(val) => !val && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this version from history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}