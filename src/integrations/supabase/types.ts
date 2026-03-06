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
      channel_members: {
        Row: {
          channel_id: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string
          id: string
          is_group: boolean
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_group?: boolean
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_group?: boolean
          name?: string | null
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          doc_type: string
          external_url: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          doc_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          doc_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          created_by: string
          doc_type: string
          external_url: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by: string
          doc_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
          doc_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lindy_messages: {
        Row: {
          agent_role: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          sender: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          agent_role: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          sender: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          agent_role?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          sender?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lindy_messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          access_level: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          access_level?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          access_level?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_activity: {
        Row: {
          agent_role: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          task_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          agent_role?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          task_id: string
          type?: string
          user_id?: string | null
        }
        Update: {
          agent_role?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          task_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          label: string
          position: number
          task_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          label: string
          position?: number
          task_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          label?: string
          position?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_documents: {
        Row: {
          added_at: string
          added_by: string
          document_id: string
          id: string
          task_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          document_id: string
          id?: string
          task_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          document_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_outputs: {
        Row: {
          agent_role: string
          content: string
          created_at: string
          id: string
          preview_text: string | null
          task_id: string
          title: string
        }
        Insert: {
          agent_role: string
          content?: string
          created_at?: string
          id?: string
          preview_text?: string | null
          task_id: string
          title: string
        }
        Update: {
          agent_role?: string
          content?: string
          created_at?: string
          id?: string
          preview_text?: string | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_outputs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
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
      app_role: ["admin", "employee"],
    },
  },
} as const
