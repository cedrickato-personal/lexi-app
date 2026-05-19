// lib/supabase/types.ts
// Database typings. Hand-written to match supabase/schema.sql.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          gallup_top10: string[] | null;
          vark: string | null;
          motivations: string[] | null;
          motivation_other: string | null;
          time_commitment: string | null;
          prior_experience: string | null;
          goal_level: string | null;
          notes: string | null;
          onboarding_state: string | null;
          last_used_language: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      lessons: {
        Row: {
          user_id: string;
          lang_code: string;
          week_number: number;
          content: string;
          saved_at: string;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["lessons"]["Row"];
        Update: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
      };
      notes: {
        Row: {
          user_id: string;
          lang_code: string;
          week_number: number;
          content: string;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["notes"]["Row"];
        Update: Partial<Database["public"]["Tables"]["notes"]["Row"]>;
      };
      language_metadata: {
        Row: {
          user_id: string;
          lang_code: string;
          started_at: string;
          last_accessed_at: string;
        };
        Insert: Database["public"]["Tables"]["language_metadata"]["Row"];
        Update: Partial<Database["public"]["Tables"]["language_metadata"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
