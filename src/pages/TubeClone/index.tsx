import { useState } from "react";
import { Plus, FolderOpen, Search, Loader2, Trash2, Play } from "lucide-react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardDescription } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTubeClone } from "@/hooks/useTubeClone";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "@/components/subscription";
import { ProjectLibrary } from "./components/ProjectLibrary";
import { ResearchWizard } from "./components/ResearchWizard";
import type { TubeCloneProject } from "./types";

export default function TubeClone() {
    const { projects, loading, currentProject, createProject, setCurrentProject, deleteProject } = useTubeClone();
    const [activeTab, setActiveTab] = useState<"library" | "research">("library");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateProject = async () => {
        setIsCreating(true);
        const newProject = await createProject({ name: "New Research" });
        if (newProject) {
            setCurrentProject(newProject);
            setActiveTab("research");
        }
        setIsCreating(false);
    };

    const handleOpenProject = (project: TubeCloneProject) => {
        setCurrentProject(project);
        setActiveTab("research");
    };

    return (
        <FeatureGate feature="tubeclone">
            <div className="p-4 md:p-6 lg:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Search className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">TubeClone</h1>
                            <p className="text-muted-foreground">Research & optimize your YouTube metadata</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleCreateProject}
                        disabled={isCreating}
                        className="gap-2 rounded-xl shadow-lg shadow-primary/20"
                    >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        New Research
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "library" | "research")}>
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="library" className="gap-2">
                            <FolderOpen className="h-4 w-4" />
                            Library
                        </TabsTrigger>
                        <TabsTrigger value="research" className="gap-2" disabled={!currentProject}>
                            <Play className="h-4 w-4" />
                            Research
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="library" className="mt-6">
                        <ProjectLibrary
                            projects={projects}
                            loading={loading}
                            onOpen={handleOpenProject}
                            onCreateNew={handleCreateProject}
                            onDelete={deleteProject}
                        />
                    </TabsContent>

                    <TabsContent value="research" className="mt-6">
                        {currentProject ? (
                            <ResearchWizard project={currentProject} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                <p className="text-muted-foreground">Select or create a project to start research</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </FeatureGate>
    );
}
