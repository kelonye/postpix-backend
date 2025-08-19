export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      billing_campaign_stat: {
        Row: {
          active: boolean
          created_at: string
          credits: number
          ends_at: string
          max_signups: number
          name: string
          price: number
          signups: number
          stripe_price_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits: number
          ends_at: string
          max_signups: number
          name: string
          price: number
          signups?: number
          stripe_price_id?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          credits?: number
          ends_at?: string
          max_signups?: number
          name?: string
          price?: number
          signups?: number
          stripe_price_id?: string
        }
        Relationships: []
      }
      post: {
        Row: {
          content: string
          created_at: string
          id: string
          ideal_no_of_section_images: number
          metadata: Json | null
          status: Database["public"]["Enums"]["post_status"]
          title: string | null
          updated_at: string
          updated_content: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          ideal_no_of_section_images?: number
          metadata?: Json | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string | null
          updated_at?: string
          updated_content?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          ideal_no_of_section_images?: number
          metadata?: Json | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string | null
          updated_at?: string
          updated_content?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      post_image: {
        Row: {
          created_at: string
          id: string
          post_id: string
          processed: boolean
          prompt: string
          slug: string
          type: Database["public"]["Enums"]["post_image_type"]
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          processed?: boolean
          prompt: string
          slug: string
          type: Database["public"]["Enums"]["post_image_type"]
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          processed?: boolean
          prompt?: string
          slug?: string
          type?: Database["public"]["Enums"]["post_image_type"]
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_image_post_id_post_id_fk"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_image_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_checkout_session: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user: {
        Row: {
          created_at: string
          credits: number
          credits_used: number
          id: string
        }
        Insert: {
          created_at?: string
          credits: number
          credits_used: number
          id: string
        }
        Update: {
          created_at?: string
          credits?: number
          credits_used?: number
          id?: string
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
      post_image_type: "banner" | "section"
      post_status: "init" | "sub-processed" | "processed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      post_image_type: ["banner", "section"],
      post_status: ["init", "sub-processed", "processed"],
    },
  },
} as const

