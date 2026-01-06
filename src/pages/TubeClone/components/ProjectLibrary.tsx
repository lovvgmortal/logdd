import { FolderOpen, Loader2, Trash2, Clock, Globe, Video } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { TubeCloneProject } from "../types";
// import { useTubeClone } from "@/hooks/useTubeClone"; // Removed

interface ProjectLibraryProps {
    projects: TubeCloneProject[];
    loading: boolean;
    onOpen: (project: TubeCloneProject) => void;
    onCreateNew: () => void;
    onDelete: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-gray-500/20 text-gray-600",
    searching: "bg-blue-500/20 text-blue-600",
    filtering: "bg-yellow-500/20 text-yellow-600",
    embedding: "bg-purple-500/20 text-purple-600",
    analyzing: "bg-orange-500/20 text-orange-600",
    done: "bg-green-500/20 text-green-600",
};

export function ProjectLibrary({ projects, loading, onOpen, onCreateNew, onDelete }: ProjectLibraryProps) {
    // const { deleteProject } = useTubeClone(); // Removed

    const handleDeleteConfirm = async (projectId: string) => {
        onDelete(projectId);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={onCreateNew}>Create Your First Research</Button>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
                <GlassCard
                    key={project.id}
                    variant="elevated"
                    className="group cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => onOpen(project)}
                >
                    <GlassCardHeader>
                        <div className="flex items-start justify-between">
                            <Badge className={STATUS_COLORS[project.status] || STATUS_COLORS.draft}>
                                {project.status}
                            </Badge>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete "{project.name}" and all of its research data. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteConfirm(project.id);
                                            }}
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <GlassCardTitle className="mt-2 line-clamp-1">{project.name}</GlassCardTitle>
                        {project.niche && (
                            <GlassCardDescription className="line-clamp-1">{project.niche}</GlassCardDescription>
                        )}
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {project.country}
                            </span>
                            <span className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                {project.video_limit} videos
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(project.created_at)}
                            </span>
                        </div>
                    </GlassCardContent>
                </GlassCard>
            ))}
        </div>
    );
}
