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
      booking_items: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          item_id: string
          price: number
          quantity: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          item_id: string
          price: number
          quantity: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          item_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          type: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method: string
          type: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          actual_return_date: string | null
          created_at: string
          customer_id: string
          delivery_address: string | null
          delivery_type: string
          deposit_amount: number
          discount_amount: number
          id: string
          notes: string | null
          pickup_date: string
          return_date: string
          status: string
          total_amount: number
        }
        Insert: {
          actual_return_date?: string | null
          created_at?: string
          customer_id: string
          delivery_address?: string | null
          delivery_type: string
          deposit_amount?: number
          discount_amount?: number
          id?: string
          notes?: string | null
          pickup_date: string
          return_date: string
          status: string
          total_amount: number
        }
        Update: {
          actual_return_date?: string | null
          created_at?: string
          customer_id?: string
          delivery_address?: string | null
          delivery_type?: string
          deposit_amount?: number
          discount_amount?: number
          id?: string
          notes?: string | null
          pickup_date?: string
          return_date?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          business_id: string
          city: string | null
          created_at: string
          email: string | null
          gps_radius_metres: number
          gst_number: string | null
          id: string
          is_default: boolean
          lat: number | null
          lng: number | null
          name: string
          opening_hours: Json
          pincode: string | null
          prefix: string
          settings: Json
          state: string | null
          status: string
          updated_at: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          city?: string | null
          created_at?: string
          email?: string | null
          gps_radius_metres?: number
          gst_number?: string | null
          id?: string
          is_default?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          opening_hours?: Json
          pincode?: string | null
          prefix?: string
          settings?: Json
          state?: string | null
          status?: string
          updated_at?: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          city?: string | null
          created_at?: string
          email?: string | null
          gps_radius_metres?: number
          gst_number?: string | null
          id?: string
          is_default?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          opening_hours?: Json
          pincode?: string | null
          prefix?: string
          settings?: Json
          state?: string | null
          status?: string
          updated_at?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          currency: string
          email: string | null
          gst_number: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          pan_number: string | null
          pincode: string | null
          plan: string
          settings: Json
          slug: string
          state: string | null
          status: string
          timezone: string
          trial_ends_at: string | null
          updated_at: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          pan_number?: string | null
          pincode?: string | null
          plan?: string
          settings?: Json
          slug: string
          state?: string | null
          status?: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          gst_number?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          pan_number?: string | null
          pincode?: string | null
          plan?: string
          settings?: Json
          slug?: string
          state?: string | null
          status?: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
          phone?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_per_day: number
          quantity: number
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_per_day: number
          quantity: number
          status: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_per_day?: number
          quantity?: number
          status?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      staff: {
        Row: {
          branch_id: string | null
          business_id: string | null
          created_at: string
          custom_permissions: Json | null
          email: string
          failed_login_attempts: number
          google_id: string | null
          id: string
          last_login: string | null
          login_locked_until: string | null
          name: string | null
          password_hash: string | null
          permissions: Json
          phone: string | null
          pin_hash: string | null
          profile_photo_url: string | null
          push_subscription: Json | null
          role: string
          setup_completed: boolean
          status: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          business_id?: string | null
          created_at?: string
          custom_permissions?: Json | null
          email: string
          failed_login_attempts?: number
          google_id?: string | null
          id: string
          last_login?: string | null
          login_locked_until?: string | null
          name?: string | null
          password_hash?: string | null
          permissions?: Json
          phone?: string | null
          pin_hash?: string | null
          profile_photo_url?: string | null
          push_subscription?: Json | null
          role?: string
          setup_completed?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          business_id?: string | null
          created_at?: string
          custom_permissions?: Json | null
          email?: string
          failed_login_attempts?: number
          google_id?: string | null
          id?: string
          last_login?: string | null
          login_locked_until?: string | null
          name?: string | null
          password_hash?: string | null
          permissions?: Json
          phone?: string | null
          pin_hash?: string | null
          profile_photo_url?: string | null
          push_subscription?: Json | null
          role?: string
          setup_completed?: boolean
          status?: string
          updated_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
