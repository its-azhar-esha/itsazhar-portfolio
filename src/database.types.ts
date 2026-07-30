/* eslint-disable @typescript-eslint/no-empty-object-type */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // Projects will be migrated from content layer
      // projects: {
      //   Row: Project
      //   Insert: Omit<Project, "id" | "created_at" | "updated_at">
      //   Update: Partial<Omit<Project, "id">>
      // }
      // Services will be migrated from content layer
      // Contact messages
      // contact_messages: {
      //   Row: ContactMessage
      //   Insert: Omit<ContactMessage, "id" | "created_at">
      //   Update: Partial<Omit<ContactMessage, "id">>
      // }
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Placeholder — run `npx supabase gen types typescript --linked` after
// linking your project to generate real types matching your schema.
