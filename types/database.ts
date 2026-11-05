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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      brand_settings: {
        Row: {
          business_name: string
          created_at: string
          id: number
          logo_storage_path: string | null
          owner_id: string
          phone: string
          signature_storage_path: string | null
          social_links: Json
          updated_at: string
          whatsapp: string
        }
        Insert: {
          business_name?: string
          created_at?: string
          id?: number
          logo_storage_path?: string | null
          owner_id: string
          phone: string
          signature_storage_path?: string | null
          social_links?: Json
          updated_at?: string
          whatsapp: string
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: number
          logo_storage_path?: string | null
          owner_id?: string
          phone?: string
          signature_storage_path?: string | null
          social_links?: Json
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          full_name: string
          id: string
          owner_id: string
          phone_e164: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          owner_id?: string
          phone_e164: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          owner_id?: string
          phone_e164?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_audit_log: {
        Row: {
          action: string
          changes: Json
          contract_id: string
          created_at: string
          id: number
          owner_id: string
        }
        Insert: {
          action: string
          changes?: Json
          contract_id: string
          created_at?: string
          id?: never
          owner_id?: string
        }
        Update: {
          action?: string
          changes?: Json
          contract_id?: string
          created_at?: string
          id?: never
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_audit_log_contract_owner_fkey"
            columns: ["contract_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contract_financials"
            referencedColumns: ["contract_id", "owner_id"]
          },
          {
            foreignKeyName: "contract_audit_log_contract_owner_fkey"
            columns: ["contract_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      contract_counters: {
        Row: {
          created_at: string
          next_value: number
          owner_id: string
          series: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          next_value?: number
          owner_id: string
          series?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          next_value?: number
          owner_id?: string
          series?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string
          generated_at: string
          id: string
          owner_id: string
          sha256: string
          storage_path: string
          template_version: number
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          generated_at?: string
          id?: string
          owner_id?: string
          sha256: string
          storage_path: string
          template_version: number
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          owner_id?: string
          sha256?: string
          storage_path?: string
          template_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_owner_fkey"
            columns: ["contract_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contract_financials"
            referencedColumns: ["contract_id", "owner_id"]
          },
          {
            foreignKeyName: "contract_documents_contract_owner_fkey"
            columns: ["contract_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      contract_payments: {
        Row: {
          amount_cents: number
          contract_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          owner_id: string
          paid_at: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          contract_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          owner_id?: string
          paid_at?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          contract_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          owner_id?: string
          paid_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_payments_contract_owner_fkey"
            columns: ["contract_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contract_financials"
            referencedColumns: ["contract_id", "owner_id"]
          },
          {
            foreignKeyName: "contract_payments_contract_owner_fkey"
            columns: ["contract_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          brand_snapshot: Json
          conditions: Json
          created_at: string
          id: string
          is_active: boolean
          owner_id: string
          updated_at: string
          version: number
        }
        Insert: {
          brand_snapshot?: Json
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          updated_at?: string
          version: number
        }
        Update: {
          brand_snapshot?: Json
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          owner_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      contracts: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          client_visible_notes: string | null
          confirmed_at: string | null
          contract_number: number | null
          created_at: string
          description: string
          event_id: string
          id: string
          internal_notes: string | null
          mobility_amount_cents: number
          owner_id: string
          signature_storage_path: string | null
          signed_at: string | null
          signed_by_name: string | null
          status: Database["public"]["Enums"]["contract_status"]
          supersedes_contract_id: string | null
          template_id: string | null
          template_snapshot: Json | null
          total_amount_cents: number
          updated_at: string
          version: number
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          client_visible_notes?: string | null
          confirmed_at?: string | null
          contract_number?: number | null
          created_at?: string
          description?: string
          event_id: string
          id?: string
          internal_notes?: string | null
          mobility_amount_cents?: number
          owner_id?: string
          signature_storage_path?: string | null
          signed_at?: string | null
          signed_by_name?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          supersedes_contract_id?: string | null
          template_id?: string | null
          template_snapshot?: Json | null
          total_amount_cents?: number
          updated_at?: string
          version?: number
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          client_visible_notes?: string | null
          confirmed_at?: string | null
          contract_number?: number | null
          created_at?: string
          description?: string
          event_id?: string
          id?: string
          internal_notes?: string | null
          mobility_amount_cents?: number
          owner_id?: string
          signature_storage_path?: string | null
          signed_at?: string | null
          signed_by_name?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          supersedes_contract_id?: string | null
          template_id?: string | null
          template_snapshot?: Json | null
          total_amount_cents?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_owner_fkey"
            columns: ["client_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "contracts_event_client_owner_fkey"
            columns: ["event_id", "client_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id", "client_id", "owner_id"]
          },
          {
            foreignKeyName: "contracts_supersedes_owner_fkey"
            columns: ["supersedes_contract_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contract_financials"
            referencedColumns: ["contract_id", "owner_id"]
          },
          {
            foreignKeyName: "contracts_supersedes_owner_fkey"
            columns: ["supersedes_contract_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id", "owner_id"]
          },
          {
            foreignKeyName: "contracts_template_owner_fkey"
            columns: ["template_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      events: {
        Row: {
          city: string | null
          client_id: string
          created_at: string
          district: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          guest_count: number | null
          id: string
          notes: string | null
          owner_id: string
          starts_at: string
          updated_at: string
          venue_address: string
          venue_name: string | null
        }
        Insert: {
          city?: string | null
          client_id: string
          created_at?: string
          district?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          guest_count?: number | null
          id?: string
          notes?: string | null
          owner_id?: string
          starts_at: string
          updated_at?: string
          venue_address: string
          venue_name?: string | null
        }
        Update: {
          city?: string | null
          client_id?: string
          created_at?: string
          district?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          guest_count?: number | null
          id?: string
          notes?: string | null
          owner_id?: string
          starts_at?: string
          updated_at?: string
          venue_address?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_client_owner_fkey"
            columns: ["client_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      service_catalog: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string
          duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          owner_id: string
          price_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          owner_id?: string
          price_cents: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          price_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      contract_financials: {
        Row: {
          balance_cents: number | null
          contract_id: string | null
          owner_id: string | null
          paid_amount_cents: number | null
          total_amount_cents: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contract_status:
        | "draft"
        | "pending_signature"
        | "signed"
        | "cancelled"
        | "annulled"
        | "archived"
      event_type: "children_show" | "private_show" | "hora_loca" | "other"
      payment_kind: "deposit" | "balance"
      payment_method: "cash" | "yape" | "plin" | "bank_transfer" | "other"
      service_category:
        | "classic_themed"
        | "huntrix"
        | "sensory_stimulation"
        | "christmas"
        | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      contract_status: [
        "draft",
        "pending_signature",
        "signed",
        "cancelled",
        "annulled",
        "archived",
      ],
      event_type: ["children_show", "private_show", "hora_loca", "other"],
      payment_kind: ["deposit", "balance"],
      payment_method: ["cash", "yape", "plin", "bank_transfer", "other"],
      service_category: [
        "classic_themed",
        "huntrix",
        "sensory_stimulation",
        "christmas",
        "other",
      ],
    },
  },
} as const
