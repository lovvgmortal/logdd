import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Json } from "@/integrations/supabase/types";

export interface Blueprint {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  sections: Json;
  estimated_length: string | null;
  dna_id: string | null;
  persona_id: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export function useBlueprints() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBlueprints = useCallback(async () => {
    if (!user) {
      setBlueprints([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("blueprints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlueprints(data || []);
    } catch (error) {
      console.error("Error fetching blueprints:", error);
      toast({
        title: "Error",
        description: "Failed to fetch blueprints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchBlueprints();
  }, [fetchBlueprints]);

  const createBlueprint = async (blueprint: Partial<Blueprint>) => {
    if (!user) return null;

    try {
      const insertData = {
        title: blueprint.title || "New Blueprint",
        user_id: user.id,
        description: blueprint.description,
        sections: blueprint.sections || [],
        estimated_length: blueprint.estimated_length,
        dna_id: blueprint.dna_id,
        persona_id: blueprint.persona_id,
        status: blueprint.status,
      };

      const { data, error } = await supabase
        .from("blueprints")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      setBlueprints(prev => [data, ...prev]);
      toast({ title: "Success", description: "Blueprint created successfully" });
      return data;
    } catch (error) {
      console.error("Error creating blueprint:", error);
      toast({
        title: "Error",
        description: "Failed to create blueprint",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateBlueprint = async (id: string, updates: Partial<Blueprint>) => {
    try {
      const { data, error } = await supabase
        .from("blueprints")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setBlueprints(prev => prev.map(b => b.id === id ? data : b));
      toast({ title: "Success", description: "Blueprint updated successfully" });
      return data;
    } catch (error) {
      console.error("Error updating blueprint:", error);
      toast({
        title: "Error",
        description: "Failed to update blueprint",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteBlueprint = async (id: string) => {
    try {
      const { error } = await supabase
        .from("blueprints")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setBlueprints(prev => prev.filter(b => b.id !== id));
      toast({ title: "Success", description: "Blueprint deleted successfully" });
      return true;
    } catch (error) {
      console.error("Error deleting blueprint:", error);
      toast({
        title: "Error",
        description: "Failed to delete blueprint",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    blueprints,
    loading,
    createBlueprint,
    updateBlueprint,
    deleteBlueprint,
    refetch: fetchBlueprints,
  };
}
