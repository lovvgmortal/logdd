import { useState, useEffect } from "react";
import { StickyNote, Plus, Search, Trash2, Clock, Loader2, Save } from "lucide-react";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotes, Note } from "@/hooks/useNotes";
import { useLanguage } from "@/hooks/useLanguage";

const NOTE_COLORS = [
  "bg-violet-100 dark:bg-violet-900/20",
  "bg-sky-100 dark:bg-sky-900/20",
  "bg-amber-100 dark:bg-amber-900/20",
  "bg-emerald-100 dark:bg-emerald-900/20",
  "bg-pink-100 dark:bg-pink-900/20",
  "bg-rose-100 dark:bg-rose-900/20",
];

export default function Notes() {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content || "");
    }
  }, [selectedNote]);

  const handleCreateNote = async () => {
    const randomColor = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
    const newNote = await createNote({
      title: t('notes.untitled'),
      content: "",
      color: randomColor,
    });
    if (newNote) {
      setSelectedNote(newNote);
      setEditTitle(newNote.title);
      setEditContent(newNote.content || "");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setSaving(true);
    const updated = await updateNote(selectedNote.id, {
      title: editTitle || "Untitled",
      content: editContent,
    });
    if (updated) {
      setSelectedNote(updated);
    }
    setSaving(false);
  };

  const handleColorChange = async (color: string) => {
    if (!selectedNote) return;
    const updated = await updateNote(selectedNote.id, { color });
    if (updated) {
      setSelectedNote(updated);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    const success = await deleteNote(selectedNote.id);
    if (success) {
      setSelectedNote(null);
      setEditTitle("");
      setEditContent("");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('notes.title')}</h1>
          <p className="text-muted-foreground">{t('notes.subtitle')}</p>
        </div>
        <Button onClick={handleCreateNote} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          {t('notes.newNote')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notes List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('notes.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl bg-card/50"
            />
          </div>

          {/* Notes Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">{t('notes.noNotes')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <GlassCard
                  key={note.id}
                  variant="elevated"
                  className={`cursor-pointer transition-all ${selectedNote?.id === note.id ? "ring-2 ring-primary" : ""
                    }`}
                  onClick={() => setSelectedNote(note)}
                >
                  <GlassCardContent className="p-4">
                    <div className={`mb-3 h-2 w-12 rounded-full ${note.color || "bg-violet-100 dark:bg-violet-900/20"}`} />
                    <h3 className="font-medium line-clamp-1">{note.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {note.content || t('notes.noContent')}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(note.updated_at)}
                    </div>
                  </GlassCardContent>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Note Editor */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full min-h-[500px]">
            {selectedNote ? (
              <GlassCardContent className="p-6 space-y-4 h-full flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                    placeholder={t('notes.titlePlaceholder')}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveNote}
                      disabled={saving}
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={handleDeleteNote}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Color Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('notes.color')}:</span>
                  <div className="flex gap-1.5">
                    {NOTE_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`h-6 w-6 rounded-full transition-all hover:scale-110 ${color} ${selectedNote.color === color
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "ring-1 ring-border/50"
                          }`}
                        title="Select color"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDate(selectedNote.updated_at)}
                </div>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 resize-none border-0 p-0 pl-1 pt-2 focus-visible:ring-0 bg-transparent text-base leading-relaxed"
                  placeholder={t('notes.contentPlaceholder')}
                />
              </GlassCardContent>
            ) : (
              <GlassCardContent className="p-6 h-full flex items-center justify-center">
                <div className="text-center max-w-sm space-y-4">
                  <div className="mx-auto rounded-2xl bg-muted/50 p-6 w-fit">
                    <StickyNote className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">{t('notes.selectNote')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('notes.selectNoteDescription')}
                    </p>
                  </div>
                </div>
              </GlassCardContent>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
