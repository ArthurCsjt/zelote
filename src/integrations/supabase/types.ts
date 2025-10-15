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
          email: string
          id: string
          nome_completo: string
          ra: string
          turma: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome_completo: string
          ra: string
          turma: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          ra?: string
          turma?: string
        }
        Relationships: []
      }
      chromebooks: {
        Row: {
          chromebook_id: string
          manufacturer: string | null
          classroom: string | null
          condition: string | null
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          model: string
          patrimony_number: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["chromebook_status"]
          updated_at: string
        }
        Insert: {
          chromebook_id: string
          manufacturer?: string | null
          classroom?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          model: string
          patrimony_number?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["chromebook_status"]
          updated_at?: string
        }
        Update: {
          chromebook_id?: string
          manufacturer?: string | null
          classroom?: string | null
          condition?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
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
          email: string
          id: string
          nome_completo: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome_completo: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          chromebook_id: string
          created_at: string
          created_by: string | null
          expected_return_date: string | null
          id: string
          loan_date: string
          loan_type: Database["public"]["Enums"]["loan_type"]
          purpose: string
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
          expected_return_date?: string | null
          id?: string
          loan_date?: string
          loan_type?: Database["public"]["Enums"]["loan_type"]
          purpose: string
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
          expected_return_date?: string | null
          id?: string
          loan_date?: string
          loan_type?: Database["public"]["Enums"]["loan_type"]
          purpose?: string
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
        ]
      }
      professores: {
        Row: {
          created_at: string
          email: string
          id: string
          nome_completo: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome_completo: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          created_at: string
          created_by: string | null
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
    }
    Views: {
      loan_history: {
        Row: {
          chromebook_id: string | null
          chromebook_model: string | null
          expected_return_date: string | null
          id: string | null
          loan_date: string | null
          loan_type: Database["public"]["Enums"]["loan_type"] | null
          purpose: string | null
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
        Relationships: []
      }
    }
    Functions: {
      execute_sql: {
        Args: { query: string }
        Returns: Json
      }
      get_overdue_loans: {
        Args: Record<PropertyKey, never>
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
      get_upcoming_due_loans: {
        Args: Record<PropertyKey, never>
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
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      chromebook_status:
        | "disponivel"
        | "emprestado"
        | "manutencao"
        | "fora_uso"
        | "fixo"
      loan_type: "individual" | "lote"
      user_role: "super_admin" | "admin" | "user"
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
      user_role: ["super_admin", "admin", "user"],
      user_type: ["aluno", "professor", "funcionario"],
    },
  },
} as const