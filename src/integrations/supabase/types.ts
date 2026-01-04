export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blueprints: {
        Row: {
          created_at: string
          description: string | null
          dna_id: string | null
          estimated_length: string | null
          id: string
          persona_id: string | null
          sections: Json
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dna_id?: string | null
          estimated_length?: string | null
          id?: string
          persona_id?: string | null
          sections?: Json
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dna_id?: string | null
          estimated_length?: string | null
          id?: string
          persona_id?: string | null
          sections?: Json
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprints_dna_id_fkey"
            columns: ["dna_id"]
            isOneToOne: false
            referencedRelation: "dnas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blueprints_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      dnas: {
        Row: {
          analysis_data: Json | null
          created_at: string
          hook_examples: string[] | null
          hook_type: string | null
          id: string
          name: string
          niche: string | null
          pacing: string | null
          patterns: string[] | null
          retention_tactics: string[] | null
          source_transcript: string | null
          source_url: string | null
          structure: string[] | null
          tone: string | null
          updated_at: string
          user_id: string
          vocabulary: string[] | null
          x_factors: string[] | null
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          hook_examples?: string[] | null
          hook_type?: string | null
          id?: string
          name: string
          niche?: string | null
          pacing?: string | null
          patterns?: string[] | null
          retention_tactics?: string[] | null
          source_transcript?: string | null
          source_url?: string | null
          structure?: string[] | null
          tone?: string | null
          updated_at?: string
          user_id: string
          vocabulary?: string[] | null
          x_factors?: string[] | null
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          hook_examples?: string[] | null
          hook_type?: string | null
          id?: string
          name?: string
          niche?: string | null
          pacing?: string | null
          patterns?: string[] | null
          retention_tactics?: string[] | null
          source_transcript?: string | null
          source_url?: string | null
          structure?: string[] | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          vocabulary?: string[] | null
          x_factors?: string[] | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          color: string | null
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          age_range: string | null
          created_at: string
          description: string | null
          id: string
          knowledge_level: string | null
          name: string
          pain_points: string[] | null
          platform: string | null
          preferred_tone: string | null
          updated_at: string
          user_id: string
          vocabulary: string | null
        }
        Insert: {
          age_range?: string | null
          created_at?: string
          description?: string | null
          id?: string
          knowledge_level?: string | null
          name: string
          pain_points?: string[] | null
          platform?: string | null
          preferred_tone?: string | null
          updated_at?: string
          user_id: string
          vocabulary?: string | null
        }
        Update: {
          age_range?: string | null
          created_at?: string
          description?: string | null
          id?: string
          knowledge_level?: string | null
          name?: string
          pain_points?: string[] | null
          platform?: string | null
          preferred_tone?: string | null
          updated_at?: string
          user_id?: string
          vocabulary?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          blueprint_content: Json | null
          blueprint_id: string | null
          created_at: string
          dna_id: string | null
          folder_id: string | null
          full_script: string | null
          generation_mode: string | null
          id: string
          key_points: string | null
          outline_history: Json | null
          persona_id: string | null
          score: number | null
          score_breakdown: Json | null
          script_history: Json | null
          status: string | null
          title: string
          topic: string | null
          unique_angle: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blueprint_content?: Json | null
          blueprint_id?: string | null
          created_at?: string
          dna_id?: string | null
          folder_id?: string | null
          full_script?: string | null
          generation_mode?: string | null
          id?: string
          key_points?: string | null
          outline_history?: Json | null
          persona_id?: string | null
          score?: number | null
          score_breakdown?: Json | null
          script_history?: Json | null
          status?: string | null
          title: string
          topic?: string | null
          unique_angle?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blueprint_content?: Json | null
          blueprint_id?: string | null
          created_at?: string
          dna_id?: string | null
          folder_id?: string | null
          full_script?: string | null
          generation_mode?: string | null
          id?: string
          key_points?: string | null
          outline_history?: Json | null
          persona_id?: string | null
          score?: number | null
          score_breakdown?: Json | null
          script_history?: Json | null
          status?: string | null
          title?: string
          topic?: string | null
          unique_angle?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripts_blueprint_id_fkey"
            columns: ["blueprint_id"]
            isOneToOne: false
            referencedRelation: "blueprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_dna_id_fkey"
            columns: ["dna_id"]
            isOneToOne: false
            referencedRelation: "dnas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          email: string | null
          id: string
          openrouter_api_key: string | null
          preferred_model: string | null
          updated_at: string
          user_id: string
          youtube_api_key: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          openrouter_api_key?: string | null
          preferred_model?: string | null
          updated_at?: string
          user_id: string
          youtube_api_key?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          openrouter_api_key?: string | null
          preferred_model?: string | null
          updated_at?: string
          user_id?: string
          youtube_api_key?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
