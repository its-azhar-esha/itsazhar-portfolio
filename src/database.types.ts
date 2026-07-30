export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          short_description: string;
          description: string | null;
          industry: Json;
          category: string;
          technologies: Json;
          thumbnail: string | null;
          images: Json;
          video_url: string | null;
          client: string | null;
          demo_url: string | null;
          github_url: string | null;
          featured: boolean;
          status: string;
          order: number;
          seo_title: string | null;
          seo_description: string | null;
          keywords: Json;
          og_image: string | null;
          canonical_url: string | null;
          challenge: string | null;
          solution: string | null;
          workflow: Json;
          impact: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          short_description?: string;
          description?: string | null;
          industry?: Json;
          category?: string;
          technologies?: Json;
          thumbnail?: string | null;
          images?: Json;
          video_url?: string | null;
          client?: string | null;
          demo_url?: string | null;
          github_url?: string | null;
          featured?: boolean;
          status?: string;
          order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          keywords?: Json;
          og_image?: string | null;
          canonical_url?: string | null;
          challenge?: string | null;
          solution?: string | null;
          workflow?: Json;
          impact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          short_description?: string;
          description?: string | null;
          industry?: Json;
          category?: string;
          technologies?: Json;
          thumbnail?: string | null;
          images?: Json;
          video_url?: string | null;
          client?: string | null;
          demo_url?: string | null;
          github_url?: string | null;
          featured?: boolean;
          status?: string;
          order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          keywords?: Json;
          og_image?: string | null;
          canonical_url?: string | null;
          challenge?: string | null;
          solution?: string | null;
          workflow?: Json;
          impact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_entries: {
        Row: {
          id: string;
          key: string;
          title: string;
          content: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          title?: string;
          content?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          title?: string;
          content?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
