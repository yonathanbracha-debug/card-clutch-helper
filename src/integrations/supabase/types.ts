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
      analytics_events: {
        Row: {
          context: Json
          created_at: string
          domain: string | null
          event_name: string
          id: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          domain?: string | null
          event_name: string
          id?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          domain?: string | null
          event_name?: string
          id?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      card_reward_rules: {
        Row: {
          cap_cents: number | null
          cap_period: string | null
          card_id: string
          category_id: string
          conditions: string | null
          created_at: string
          description: string | null
          exclusions: string[] | null
          id: string
          last_verified_at: string
          multiplier: number
          notes: string | null
          priority: number | null
          source_url: string | null
        }
        Insert: {
          cap_cents?: number | null
          cap_period?: string | null
          card_id: string
          category_id: string
          conditions?: string | null
          created_at?: string
          description?: string | null
          exclusions?: string[] | null
          id?: string
          last_verified_at?: string
          multiplier: number
          notes?: string | null
          priority?: number | null
          source_url?: string | null
        }
        Update: {
          cap_cents?: number | null
          cap_period?: string | null
          card_id?: string
          category_id?: string
          conditions?: string | null
          created_at?: string
          description?: string | null
          exclusions?: string[] | null
          id?: string
          last_verified_at?: string
          multiplier?: number
          notes?: string | null
          priority?: number | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "card_reward_rules_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_reward_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "reward_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      card_url_health: {
        Row: {
          card_id: string
          checked_at: string
          error_text: string | null
          http_status: number | null
          id: string
          status: string
          url: string
          url_type: string
        }
        Insert: {
          card_id: string
          checked_at?: string
          error_text?: string | null
          http_status?: number | null
          id?: string
          status: string
          url: string
          url_type: string
        }
        Update: {
          card_id?: string
          checked_at?: string
          error_text?: string | null
          http_status?: number | null
          id?: string
          status?: string
          url?: string
          url_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_url_health_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          annual_fee_cents: number
          created_at: string
          credits_summary: string | null
          foreign_tx_fee_percent: number | null
          id: string
          image_url: string | null
          is_active: boolean
          issuer_id: string | null
          last_verified_at: string
          name: string
          network: Database["public"]["Enums"]["card_network"]
          reward_summary: string
          slug: string | null
          source_url: string
          terms_url: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          annual_fee_cents: number
          created_at?: string
          credits_summary?: string | null
          foreign_tx_fee_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          issuer_id?: string | null
          last_verified_at?: string
          name: string
          network: Database["public"]["Enums"]["card_network"]
          reward_summary: string
          slug?: string | null
          source_url: string
          terms_url?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          annual_fee_cents?: number
          created_at?: string
          credits_summary?: string | null
          foreign_tx_fee_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          issuer_id?: string | null
          last_verified_at?: string
          name?: string
          network?: Database["public"]["Enums"]["card_network"]
          reward_summary?: string
          slug?: string | null
          source_url?: string
          terms_url?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "issuers"
            referencedColumns: ["id"]
          },
        ]
      }
      data_issue_reports: {
        Row: {
          admin_notes: string | null
          card_id: string | null
          created_at: string
          description: string
          id: string
          issue_type: string
          merchant_id: string | null
          resolved_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          card_id?: string | null
          created_at?: string
          description: string
          id?: string
          issue_type: string
          merchant_id?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          card_id?: string | null
          created_at?: string
          description?: string
          id?: string
          issue_type?: string
          merchant_id?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_issue_reports_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_issue_reports_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_issue_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issuers: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      merchant_exclusions: {
        Row: {
          card_id: string
          created_at: string
          id: string
          merchant_pattern: string
          reason: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          merchant_pattern: string
          reason: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          merchant_pattern?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_exclusions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          category_id: string | null
          created_at: string
          domain: string
          excluded_from_grocery: boolean
          id: string
          is_warehouse: boolean
          name: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          domain: string
          excluded_from_grocery?: boolean
          id?: string
          is_warehouse?: boolean
          name: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          category_id?: string | null
          created_at?: string
          domain?: string
          excluded_from_grocery?: boolean
          id?: string
          is_warehouse?: boolean
          name?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "merchants_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "reward_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          blocked_until: string | null
          bucket: string
          count: number
          id: string
          scope: string
          updated_at: string
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          bucket: string
          count?: number
          id?: string
          scope: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          bucket?: string
          count?: number
          id?: string
          scope?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      recommendation_logs: {
        Row: {
          category_slug: string | null
          confidence: string
          created_at: string
          decision_path: Json | null
          domain: string | null
          explanation: string | null
          id: string
          merchant_id: string | null
          multiplier: number | null
          recommended_card_id: string | null
          runner_up_card_id: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          category_slug?: string | null
          confidence: string
          created_at?: string
          decision_path?: Json | null
          domain?: string | null
          explanation?: string | null
          id?: string
          merchant_id?: string | null
          multiplier?: number | null
          recommended_card_id?: string | null
          runner_up_card_id?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          category_slug?: string | null
          confidence?: string
          created_at?: string
          decision_path?: Json | null
          domain?: string | null
          explanation?: string | null
          id?: string
          merchant_id?: string | null
          multiplier?: number | null
          recommended_card_id?: string | null
          runner_up_card_id?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_logs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_logs_recommended_card_id_fkey"
            columns: ["recommended_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_logs_runner_up_card_id_fkey"
            columns: ["runner_up_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_categories: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          slug?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          actor_user_id: string | null
          created_at: string | null
          event_payload: Json
          event_type: string
          id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string | null
          event_payload?: Json
          event_type: string
          id?: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string | null
          event_payload?: Json
          event_type?: string
          id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          mode: Database["public"]["Enums"]["user_mode"]
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          mode?: Database["public"]["Enums"]["user_mode"]
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          mode?: Database["public"]["Enums"]["user_mode"]
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallet_cards: {
        Row: {
          card_id: string
          created_at: string
          do_not_recommend: boolean
          id: string
          updated_at: string
          user_id: string
          utilization_status: Database["public"]["Enums"]["utilization_level"]
        }
        Insert: {
          card_id: string
          created_at?: string
          do_not_recommend?: boolean
          id?: string
          updated_at?: string
          user_id: string
          utilization_status?: Database["public"]["Enums"]["utilization_level"]
        }
        Update: {
          card_id?: string
          created_at?: string
          do_not_recommend?: boolean
          id?: string
          updated_at?: string
          user_id?: string
          utilization_status?: Database["public"]["Enums"]["utilization_level"]
        }
        Relationships: [
          {
            foreignKeyName: "user_wallet_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_wallet_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          referrer: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          referrer?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          referrer?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: number }
      get_active_reward_rules: {
        Args: { p_card_id: string }
        Returns: {
          cap_cents: number
          cap_period: string
          category_name: string
          category_slug: string
          description: string
          multiplier: number
          notes: string
          rule_id: string
        }[]
      }
      get_best_cards_for_category: {
        Args: {
          p_category_slug: string
          p_merchant_domain?: string
          p_user_card_ids?: string[]
        }
        Returns: {
          annual_fee_cents: number
          cap_cents: number
          cap_period: string
          card_id: string
          card_name: string
          exclusion_reason: string
          is_excluded: boolean
          issuer_name: string
          multiplier: number
          rank: number
        }[]
      }
      get_stale_data: {
        Args: { p_days_threshold?: number }
        Returns: {
          days_stale: number
          entity_id: string
          entity_name: string
          entity_type: string
          last_verified_at: string
        }[]
      }
      get_verified_merchant_category: {
        Args: { p_domain: string }
        Returns: {
          category_id: string
          category_name: string
          category_slug: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      is_merchant_excluded: {
        Args: { p_card_id: string; p_merchant_pattern: string }
        Returns: {
          exclusion_reason: string
          is_excluded: boolean
        }[]
      }
      is_valid_http_url: { Args: { url: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "admin" | "owner"
      card_network: "visa" | "mastercard" | "amex" | "discover"
      user_mode: "rewards" | "conservative"
      utilization_level: "low" | "medium" | "high"
      verification_status: "verified" | "pending" | "stale"
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
    Enums: {
      app_role: ["user", "admin", "owner"],
      card_network: ["visa", "mastercard", "amex", "discover"],
      user_mode: ["rewards", "conservative"],
      utilization_level: ["low", "medium", "high"],
      verification_status: ["verified", "pending", "stale"],
    },
  },
} as const
