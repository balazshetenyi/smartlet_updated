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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          base_price: number | null
          check_in: string
          check_out: string
          created_at: string | null
          declined_at: string | null
          id: string
          paid_at: string | null
          payment_due_at: string | null
          payment_method_id: string | null
          payment_status: string | null
          property_id: string
          refund_amount: number | null
          refunded_at: string | null
          reminder_sent_at: string | null
          service_fee: number | null
          status: string | null
          tenant_id: string
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          check_in: string
          check_out: string
          created_at?: string | null
          declined_at?: string | null
          id?: string
          paid_at?: string | null
          payment_due_at?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          property_id: string
          refund_amount?: number | null
          refunded_at?: string | null
          reminder_sent_at?: string | null
          service_fee?: number | null
          status?: string | null
          tenant_id: string
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          check_in?: string
          check_out?: string
          created_at?: string | null
          declined_at?: string | null
          id?: string
          paid_at?: string | null
          payment_due_at?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          property_id?: string
          refund_amount?: number | null
          refunded_at?: string | null
          reminder_sent_at?: string | null
          service_fee?: number | null
          status?: string | null
          tenant_id?: string
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          landlord_id: string | null
          last_message_at: string | null
          property_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          landlord_id?: string | null
          last_message_at?: string | null
          property_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          landlord_id?: string | null
          last_message_at?: string | null
          property_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string | null
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          currency: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          push_token: string | null
          stripe_account_id: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url: string
          created_at?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          push_token?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          push_token?: string | null
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          landlord_id: string | null
          location: unknown
          max_guests: number
          postcode: string | null
          price: number | null
          rental_type: string | null
          title: string
        }
        Insert: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          landlord_id?: string | null
          location?: unknown
          max_guests?: number
          postcode?: string | null
          price?: number | null
          rental_type?: string | null
          title: string
        }
        Update: {
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          landlord_id?: string | null
          location?: unknown
          max_guests?: number
          postcode?: string | null
          price?: number | null
          rental_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_amenities: {
        Row: {
          amenity_id: string | null
          created_at: string | null
          id: string
          property_id: string | null
        }
        Insert: {
          amenity_id?: string | null
          created_at?: string | null
          id?: string
          property_id?: string | null
        }
        Update: {
          amenity_id?: string | null
          created_at?: string | null
          id?: string
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          id: string
          image_url: string
          is_cover: boolean | null
          is_featured: boolean | null
          property_id: string | null
        }
        Insert: {
          id?: string
          image_url: string
          is_cover?: boolean | null
          is_featured?: boolean | null
          property_id?: string | null
        }
        Update: {
          id?: string
          image_url?: string
          is_cover?: boolean | null
          is_featured?: boolean | null
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_unavailable_dates: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          property_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          property_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          property_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_unavailable_dates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
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
      app_role: "admin" | "tenant" | "landlord"
      booking_status: "vacant" | "occupied" | "under_offer"
      maintenance_status: "open" | "in_progress" | "resolved"
      payment_status: "pending" | "completed" | "declined"
      priority: "low" | "medium" | "high"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "tenant", "landlord"],
      booking_status: ["vacant", "occupied", "under_offer"],
      maintenance_status: ["open", "in_progress", "resolved"],
      payment_status: ["pending", "completed", "declined"],
      priority: ["low", "medium", "high"],
    },
  },
} as const
