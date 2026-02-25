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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          nome_completo: string
          ra: string
          turma: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          nome_completo: string
          ra: string
          turma: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          nome_completo?: string
          ra?: string
          turma?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_items: {
        Row: {
          audit_id: string
          chromebook_id: string
          condition_found: string | null
          count_method: string | null
          counted_at: string
          counted_by: string | null
          created_at: string
          expected_location: string | null
          id: string
          location_confirmed: boolean | null
          location_found: string | null
          model_found: string | null
          notes: string | null
          physical_status: string | null
          scan_method: string
        }
        Insert: {
          audit_id: string
          chromebook_id: string
          condition_found?: string | null
          count_method?: string | null
          counted_at?: string
          counted_by?: string | null
          created_at?: string
          expected_location?: string | null
          id?: string
          location_confirmed?: boolean | null
          location_found?: string | null
          model_found?: string | null
          notes?: string | null
          physical_status?: string | null
          scan_method: string
        }
        Update: {
          audit_id?: string
          chromebook_id?: string
          condition_found?: string | null
          count_method?: string | null
          counted_at?: string
          counted_by?: string | null
          created_at?: string
          expected_location?: string | null
          id?: string
          location_confirmed?: boolean | null
          location_found?: string | null
          model_found?: string | null
          notes?: string | null
          physical_status?: string | null
          scan_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audit_analysis"
            referencedColumns: ["audit_id"]
          },
          {
            foreignKeyName: "audit_items_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "inventory_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_items_chromebook_id_fkey"
            columns: ["chromebook_id"]
            isOneToOne: false
            referencedRelation: "active_chromebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_items_chromebook_id_fkey"
            columns: ["chromebook_id"]
            isOneToOne: false
            referencedRelation: "chromebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      chromebooks: {
        Row: {
          chromebook_id: string
          classroom: string | null
          condition: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          is_deprovisioned: boolean | null
          location: string | null
          manufacturer: string | null
          model: string
          patrimony_number: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["chromebook_status"]
          updated_at: string
        }
        Insert: {
          chromebook_id: string
          classroom?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_deprovisioned?: boolean | null
          location?: string | null
          manufacturer?: string | null
          model: string
          patrimony_number?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["chromebook_status"]
          updated_at?: string
        }
        Update: {
          chromebook_id?: string
          classroom?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_deprovisioned?: boolean | null
          location?: string | null
          manufacturer?: string | null
          model?: string
          patrimony_number?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["chromebook_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chromebooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          nome_completo: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          nome_completo: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          nome_completo?: string
        }
        Relationships: []
      }
      inventory_audits: {
        Row: {
          audit_name: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          start_at: string | null
          started_at: string
          status: string
          total_counted: number | null
          total_expected: number | null
        }
        Insert: {
          audit_name: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          start_at?: string | null
          started_at?: string
          status?: string
          total_counted?: number | null
          total_expected?: number | null
        }
        Update: {
          audit_name?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          start_at?: string | null
          started_at?: string
          status?: string
          total_counted?: number | null
          total_expected?: number | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          chromebook_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expected_return_date: string | null
          id: string
          loan_date: string
          loan_type: Database["public"]["Enums"]["loan_type"]
          purpose: string
          reservation_id: string | null
          student_email: string
          student_name: string
          student_ra: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          chromebook_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_return_date?: string | null
          id?: string
          loan_date?: string
          loan_type?: Database["public"]["Enums"]["loan_type"]
          purpose: string
          reservation_id?: string | null
          student_email: string
          student_name: string
          student_ra?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          chromebook_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expected_return_date?: string | null
          id?: string
          loan_date?: string
          loan_type?: Database["public"]["Enums"]["loan_type"]
          purpose?: string
          reservation_id?: string | null
          student_email?: string
          student_name?: string
          student_ra?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "loans_chromebook_id_fkey"
            columns: ["chromebook_id"]
            isOneToOne: false
            referencedRelation: "active_chromebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_chromebook_id_fkey"
            columns: ["chromebook_id"]
            isOneToOne: false
            referencedRelation: "chromebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      professores: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          materia: string | null
          nome_completo: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          materia?: string | null
          nome_completo: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          materia?: string | null
          nome_completo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          classroom: string | null
          created_at: string | null
          created_by: string | null
          date: string
          deleted_at: string | null
          id: string
          is_minecraft: boolean | null
          justification: string
          mic_quantity: number | null
          needs_mic: boolean | null
          needs_sound: boolean | null
          needs_tv: boolean | null
          professor_id: string | null
          quantity_requested: number | null
          space_id: string | null
          time_slot: string
        }
        Insert: {
          classroom?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          deleted_at?: string | null
          id?: string
          is_minecraft?: boolean | null
          justification: string
          mic_quantity?: number | null
          needs_mic?: boolean | null
          needs_sound?: boolean | null
          needs_tv?: boolean | null
          professor_id?: string | null
          quantity_requested?: number | null
          space_id?: string | null
          time_slot: string
        }
        Update: {
          classroom?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          deleted_at?: string | null
          id?: string
          is_minecraft?: boolean | null
          justification?: string
          mic_quantity?: number | null
          needs_mic?: boolean | null
          needs_sound?: boolean | null
          needs_tv?: boolean | null
          professor_id?: string | null
          quantity_requested?: number | null
          space_id?: string | null
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          loan_id: string
          notes: string | null
          return_date: string
          returned_by_email: string
          returned_by_name: string
          returned_by_ra: string | null
          returned_by_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          loan_id: string
          notes?: string | null
          return_date?: string
          returned_by_email: string
          returned_by_name: string
          returned_by_ra?: string | null
          returned_by_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          loan_id?: string
          notes?: string | null
          return_date?: string
          returned_by_email?: string
          returned_by_name?: string
          returned_by_ra?: string | null
          returned_by_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loan_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          capacity: number | null
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          capacity?: number | null
          color: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number | null
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_alunos: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string | null
          nome_completo: string | null
          ra: string | null
          turma: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          nome_completo?: string | null
          ra?: string | null
          turma?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          nome_completo?: string | null
          ra?: string | null
          turma?: string | null
        }
        Relationships: []
      }
      active_chromebooks: {
        Row: {
          chromebook_id: string | null
          classroom: string | null
          condition: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string | null
          is_deprovisioned: boolean | null
          location: string | null
          manufacturer: string | null
          model: string | null
          patrimony_number: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["chromebook_status"] | null
          updated_at: string | null
        }
        Insert: {
          chromebook_id?: string | null
          classroom?: string | null
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          is_deprovisioned?: boolean | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          patrimony_number?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["chromebook_status"] | null
          updated_at?: string | null
        }
        Update: {
          chromebook_id?: string | null
          classroom?: string | null
          condition?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string | null
          is_deprovisioned?: boolean | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          patrimony_number?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["chromebook_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chromebooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      active_funcionarios: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string | null
          nome_completo: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          nome_completo?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          nome_completo?: string | null
        }
        Relationships: []
      }
      active_professores: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string | null
          materia: string | null
          nome_completo: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          materia?: string | null
          nome_completo?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string | null
          materia?: string | null
          nome_completo?: string | null
        }
        Relationships: []
      }
      audit_analysis: {
        Row: {
          audit_id: string | null
          audit_name: string | null
          chromebooks_counted: number | null
          completed_at: string | null
          completion_percentage: number | null
          scanned_manually: number | null
          scanned_via_qr: number | null
          started_at: string | null
          status: string | null
          total_expected: number | null
        }
        Relationships: []
      }
      loan_history: {
        Row: {
          chromebook_id: string | null
          chromebook_model: string | null
          created_by_email: string | null
          expected_return_date: string | null
          id: string | null
          loan_date: string | null
          loan_type: Database["public"]["Enums"]["loan_type"] | null
          purpose: string | null
          reservation_id: string | null
          return_date: string | null
          return_notes: string | null
          returned_by_email: string | null
          returned_by_name: string | null
          returned_by_type: Database["public"]["Enums"]["user_type"] | null
          status: string | null
          student_email: string | null
          student_name: string | null
          student_ra: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_staff: {
        Args: { p_email: string; p_nome_completo: string }
        Returns: {
          created_at: string
          email: string
          id: string
          nome_completo: string
        }[]
      }
      create_student: {
        Args: {
          p_email: string
          p_nome_completo: string
          p_ra: string
          p_turma: string
        }
        Returns: {
          created_at: string
          email: string
          id: string
          nome_completo: string
          ra: string
          turma: string
        }[]
      }
      create_teacher: {
        Args: { p_email: string; p_materia?: string; p_nome_completo: string }
        Returns: {
          created_at: string
          email: string
          id: string
          materia: string
          nome_completo: string
        }[]
      }
      execute_sql: { Args: { query: string }; Returns: Json }
      generate_new_chromebook_id: { Args: never; Returns: string }
      get_all_users: {
        Args: never
        Returns: {
          email: string
          id: string
          last_sign_in_at: string
          name: string
          role: string
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_overdue_loans: {
        Args: never
        Returns: {
          chromebook_id: string
          days_overdue: number
          expected_return_date: string
          loan_date: string
          loan_id: string
          student_email: string
          student_name: string
        }[]
      }
      get_recent_loan_activities: {
        Args: never
        Returns: {
          activity_id: string
          activity_time: string
          activity_type: string
          chromebook_id: string
          creator_email: string
          creator_name: string
          user_email: string
          user_name: string
        }[]
      }
      get_upcoming_due_loans: {
        Args: never
        Returns: {
          chromebook_id: string
          days_until_due: number
          expected_return_date: string
          loan_date: string
          loan_id: string
          student_email: string
          student_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      restore_record: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: boolean
      }
      sync_chromebook_status: { Args: { cb_id: string }; Returns: string }
    }
    Enums: {
      chromebook_status:
      | "disponivel"
      | "emprestado"
      | "manutencao"
      | "fora_uso"
      | "fixo"
      loan_type: "individual" | "lote"
      user_role: "super_admin" | "admin" | "user" | "professor"
      user_type: "aluno" | "professor" | "funcionario"
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
      chromebook_status: [
        "disponivel",
        "emprestado",
        "manutencao",
        "fora_uso",
        "fixo",
      ],
      loan_type: ["individual", "lote"],
      user_role: ["super_admin", "admin", "user", "professor"],
      user_type: ["aluno", "professor", "funcionario"],
    },
  },
} as const
