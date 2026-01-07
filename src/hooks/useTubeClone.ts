import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { TubeCloneProject, TubeCloneVideo, TubeCloneAnalysis } from "@/pages/TubeClone/types";

export function useTubeClone() {
    const [projects, setProjects] = useState<TubeCloneProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentProject, setCurrentProject] = useState<TubeCloneProject | null>(null);
    const [videos, setVideos] = useState<TubeCloneVideo[]>([]);
    const [analysis, setAnalysis] = useState<TubeCloneAnalysis | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    // Fetch all projects
    const fetchProjects = useCallback(async () => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await (supabase as any)
                .from("tubeclone_projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setProjects((data as unknown as TubeCloneProject[]) || []);
        } catch (error) {
            console.error("Error fetching TubeClone projects:", error);
            toast({
                title: "Error",
                description: "Failed to fetch projects",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Create new project
    const createProject = async (data: Partial<TubeCloneProject>) => {
        if (!user) return null;

        try {
            const insertData = {
                user_id: user.id,
                name: data.name || "New Project",
                source_url: data.source_url || null,
                niche: data.niche || null,
                country: data.country || "USA",
                category_id: data.category_id || null,
                video_limit: data.video_limit || 50,
                time_range: data.time_range || "30d",
                status: "draft",
            };

            const { data: result, error } = await (supabase as any)
                .from("tubeclone_projects")
                .insert(insertData)
                .select()
                .single();

            if (error) throw error;

            const newProject = result as unknown as TubeCloneProject;
            setProjects(prev => [newProject, ...prev]);
            toast({ title: "Success", description: "Project created" });
            return newProject;
        } catch (error) {
            console.error("Error creating project:", error);
            toast({
                title: "Error",
                description: "Failed to create project",
                variant: "destructive",
            });
            return null;
        }
    };

    // Update project
    const updateProject = async (id: string, updates: Partial<TubeCloneProject>) => {
        try {
            const { data, error } = await (supabase as any)
                .from("tubeclone_projects")
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            const updated = data as unknown as TubeCloneProject;
            setProjects(prev => prev.map(p => p.id === id ? updated : p));
            if (currentProject?.id === id) {
                setCurrentProject(updated);
            }
            return updated;
        } catch (error) {
            console.error("Error updating project:", error);
            toast({
                title: "Error",
                description: "Failed to update project",
                variant: "destructive",
            });
            return null;
        }
    };

    // Delete project
    const deleteProject = async (id: string) => {
        try {
            const { error } = await (supabase as any)
                .from("tubeclone_projects")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setProjects(prev => prev.filter(p => p.id !== id));
            if (currentProject?.id === id) {
                setCurrentProject(null);
            }
            toast({ title: "Success", description: "Project deleted" });
            return true;
        } catch (error) {
            console.error("Error deleting project:", error);
            toast({
                title: "Error",
                description: "Failed to delete project",
                variant: "destructive",
            });
            return false;
        }
    };

    // Load project with videos and analysis
    const loadProject = async (id: string) => {
        try {
            // Get project
            const { data: projectData, error: projectError } = await (supabase as any)
                .from("tubeclone_projects")
                .select("*")
                .eq("id", id)
                .single();

            if (projectError) throw projectError;
            setCurrentProject(projectData as unknown as TubeCloneProject);

            // Get videos
            const { data: videosData, error: videosError } = await (supabase as any)
                .from("tubeclone_videos")
                .select("*")
                .eq("project_id", id)
                .order("combined_score", { ascending: false });

            if (videosError) throw videosError;
            setVideos((videosData as unknown as TubeCloneVideo[]) || []);

            // Get latest analysis
            const { data: analysisData, error: analysisError } = await (supabase as any)
                .from("tubeclone_analyses")
                .select("*")
                .eq("project_id", id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (!analysisError && analysisData) {
                setAnalysis(analysisData as unknown as TubeCloneAnalysis);
            } else {
                setAnalysis(null);
            }

            return projectData;
        } catch (error) {
            console.error("Error loading project:", error);
            toast({
                title: "Error",
                description: "Failed to load project",
                variant: "destructive",
            });
            return null;
        }
    };

    // Save videos to project
    const saveVideos = async (projectId: string, videosToSave: Partial<TubeCloneVideo>[]) => {
        try {
            const insertData = videosToSave.map(v => ({
                ...v,
                project_id: projectId,
            }));

            // Use upsert instead of insert to support updates
            const { error } = await (supabase as any)
                .from("tubeclone_videos")
                .upsert(insertData);

            if (error) throw error;

            // Refresh videos
            const { data } = await (supabase as any)
                .from("tubeclone_videos")
                .select("*")
                .eq("project_id", projectId)
                .order("combined_score", { ascending: false });

            setVideos((data as unknown as TubeCloneVideo[]) || []);
            return true;
        } catch (error) {
            console.error("Error saving videos:", error);
            toast({
                title: "Error",
                description: "Failed to save videos",
                variant: "destructive",
            });
            return false;
        }
    };

    // Save analysis
    const saveAnalysis = async (projectId: string, analysisData: Partial<TubeCloneAnalysis>) => {
        try {
            const { data, error } = await (supabase as any)
                .from("tubeclone_analyses")
                .insert({
                    ...analysisData,
                    project_id: projectId,
                })
                .select()
                .single();

            if (error) throw error;
            setAnalysis(data as unknown as TubeCloneAnalysis);
            return data;
        } catch (error) {
            console.error("Error saving analysis:", error);
            toast({
                title: "Error",
                description: "Failed to save analysis",
                variant: "destructive",
            });
            return null;
        }
    };

    return {
        // State
        projects,
        loading,
        currentProject,
        videos,
        analysis,

        // Actions
        fetchProjects,
        createProject,
        updateProject,
        deleteProject,
        loadProject,
        saveVideos,
        saveAnalysis,
        setCurrentProject,
    };
}
