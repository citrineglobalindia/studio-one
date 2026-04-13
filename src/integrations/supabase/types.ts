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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          album_size: string | null
          album_type: string
          client_id: string | null
          client_name: string
          cover_type: string | null
          created_at: string
          designer: string | null
          event_date: string | null
          event_name: string | null
          id: string
          notes: string | null
          organization_id: string | null
          pages: number | null
          paper_type: string | null
          pdf_file_name: string | null
          pdf_file_path: string | null
          pdf_file_size: number | null
          printer_contact: string | null
          printer_name: string | null
          printing_cost: number | null
          project_name: string
          status: string
          updated_at: string
        }
        Insert: {
          album_size?: string | null
          album_type?: string
          client_id?: string | null
          client_name: string
          cover_type?: string | null
          created_at?: string
          designer?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          pages?: number | null
          paper_type?: string | null
          pdf_file_name?: string | null
          pdf_file_path?: string | null
          pdf_file_size?: number | null
          printer_contact?: string | null
          printer_name?: string | null
          printing_cost?: number | null
          project_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          album_size?: string | null
          album_type?: string
          client_id?: string | null
          client_name?: string
          cover_type?: string | null
          created_at?: string
          designer?: string | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          pages?: number | null
          paper_type?: string | null
          pdf_file_name?: string | null
          pdf_file_path?: string | null
          pdf_file_size?: number | null
          printer_contact?: string | null
          printer_name?: string | null
          printing_cost?: number | null
          project_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          budget: number | null
          city: string | null
          created_at: string
          delivery_date: string | null
          email: string | null
          event_date: string | null
          event_type: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          partner_name: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          city?: string | null
          created_at?: string
          delivery_date?: string | null
          email?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          partner_name?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          city?: string | null
          created_at?: string
          delivery_date?: string | null
          email?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          partner_name?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          assigned_to: string | null
          created_at: string
          deliverable_type: string
          delivered_date: string | null
          due_date: string | null
          id: string
          notes: string | null
          organization_id: string
          priority: string | null
          project_id: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          deliverable_type?: string
          delivered_date?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          priority?: string | null
          project_id: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          deliverable_type?: string
          delivered_date?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          priority?: string | null
          project_id?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          category: string
          client_name: string
          created_at: string
          description: string
          event_name: string | null
          expense_date: string
          id: string
          notes: string | null
          paid_to: string | null
          project_name: string | null
          receipt_url: string | null
          submitted_by: string
          updated_at: string
        }
        Insert: {
          amount?: number
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          client_name: string
          created_at?: string
          description: string
          event_name?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          paid_to?: string | null
          project_name?: string | null
          receipt_url?: string | null
          submitted_by?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          client_name?: string
          created_at?: string
          description?: string
          event_name?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          paid_to?: string | null
          project_name?: string | null
          receipt_url?: string | null
          submitted_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget: number | null
          city: string | null
          converted_client_id: string | null
          created_at: string
          email: string | null
          event_date: string | null
          event_type: string | null
          follow_up_date: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget?: number | null
          city?: string | null
          converted_client_id?: string | null
          created_at?: string
          email?: string | null
          event_date?: string | null
          event_type?: string | null
          follow_up_date?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget?: number | null
          city?: string | null
          converted_client_id?: string | null
          created_at?: string
          email?: string | null
          event_date?: string | null
          event_type?: string | null
          follow_up_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_email: string | null
          joined_at: string | null
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          joined_at?: string | null
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          created_at: string
          id: string
          instagram: string | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          primary_color: string | null
          slug: string
          specialties: string[] | null
          team_size: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          primary_color?: string | null
          slug: string
          specialties?: string[] | null
          team_size?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          primary_color?: string | null
          slug?: string
          specialties?: string[] | null
          team_size?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          amount_paid: number | null
          assigned_team: string[] | null
          backup_number: string | null
          card_number: string | null
          client_id: string | null
          created_at: string
          delivery_hdd: string | null
          event_date: string | null
          event_type: string | null
          id: string
          notes: string | null
          organization_id: string
          project_name: string
          raw_data_size: string | null
          status: string
          total_amount: number | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          amount_paid?: number | null
          assigned_team?: string[] | null
          backup_number?: string | null
          card_number?: string | null
          client_id?: string | null
          created_at?: string
          delivery_hdd?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          project_name: string
          raw_data_size?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          amount_paid?: number | null
          assigned_team?: string[] | null
          backup_number?: string | null
          card_number?: string | null
          client_id?: string | null
          created_at?: string
          delivery_hdd?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          project_name?: string
          raw_data_size?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_clients: number | null
          max_projects: number | null
          max_team_members: number | null
          name: string
          price: number
          slug: string
          sort_order: number | null
        }
        Insert: {
          billing_period?: string
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_clients?: number | null
          max_projects?: number | null
          max_team_members?: number | null
          name: string
          price?: number
          slug: string
          sort_order?: number | null
        }
        Update: {
          billing_period?: string
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_clients?: number | null
          max_projects?: number | null
          max_team_members?: number | null
          name?: string
          price?: number
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          availability: string | null
          created_at: string
          daily_rate: number | null
          email: string | null
          experience_years: number | null
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          phone: string | null
          rating: number | null
          role: string
          specialties: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string
          daily_rate?: number | null
          email?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          rating?: number | null
          role?: string
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string
          daily_rate?: number | null
          email?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          rating?: number | null
          role?: string
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: string
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
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
