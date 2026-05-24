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
      audit_log: {
        Row: {
          action: string
          branch_id: string | null
          business_id: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          staff_id: string | null
          staff_name: string | null
          table_name: string
          timestamp: string
        }
        Insert: {
          action: string
          branch_id?: string | null
          business_id?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          staff_id?: string | null
          staff_name?: string | null
          table_name: string
          timestamp?: string
        }
        Update: {
          action?: string
          branch_id?: string | null
          business_id?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          staff_id?: string | null
          staff_name?: string | null
          table_name?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          business_id: string | null
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          business_id?: string | null
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          business_id?: string | null
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "otp_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_drafts: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          current_step: number
          draft_data: Json
          id: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          current_step?: number
          draft_data?: Json
          id?: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          current_step?: number
          draft_data?: Json
          id?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_drafts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_drafts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_drafts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          condition_notes_on_return: string | null
          condition_on_return: string | null
          created_at: string
          id: string
          item_id: string
          item_name: string
          item_sku: string | null
          item_variant_id: string
          price: number
          quantity: number
          rental_days: number
          size: string
          subtotal: number | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          condition_notes_on_return?: string | null
          condition_on_return?: string | null
          created_at?: string
          id?: string
          item_id: string
          item_name: string
          item_sku?: string | null
          item_variant_id: string
          price: number
          quantity?: number
          rental_days: number
          size: string
          subtotal?: number | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          condition_notes_on_return?: string | null
          condition_on_return?: string | null
          created_at?: string
          id?: string
          item_id?: string
          item_name?: string
          item_sku?: string | null
          item_variant_id?: string
          price?: number
          quantity?: number
          rental_days?: number
          size?: string
          subtotal?: number | null
          updated_at?: string
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
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_item_variant_id_fkey"
            columns: ["item_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount: number
          booking_id: string
          branch_id: string
          business_id: string
          collected_by: string | null
          created_at: string
          id: string
          is_voided: boolean
          method: string
          notes: string | null
          reference_number: string | null
          type: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          branch_id: string
          business_id: string
          collected_by?: string | null
          created_at?: string
          id?: string
          is_voided?: boolean
          method: string
          notes?: string | null
          reference_number?: string | null
          type: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          branch_id?: string
          business_id?: string
          collected_by?: string | null
          created_at?: string
          id?: string
          is_voided?: boolean
          method?: string
          notes?: string | null
          reference_number?: string | null
          type?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_payments_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_payments_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_timeline: {
        Row: {
          booking_id: string
          business_id: string
          created_at: string
          event_description: string
          event_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          performed_by_name: string | null
        }
        Insert: {
          booking_id: string
          business_id: string
          created_at?: string
          event_description: string
          event_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
        }
        Update: {
          booking_id?: string
          business_id?: string
          created_at?: string
          event_description?: string
          event_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          performed_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_timeline_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_timeline_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          advance_amount: number
          amount_paid: number
          balance_due: number
          booking_number: string
          booking_source: string | null
          branch_id: string
          business_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          deposit_amount: number
          discount_amount: number
          discount_reason: string | null
          id: string
          last_updated_by: string | null
          notes: string | null
          notion_page_id: string | null
          occasion: string | null
          physical_bill_number: string | null
          pickup_completed_at: string | null
          pickup_date: string
          rental_days: number
          return_completed_at: string | null
          return_date: string
          staff_notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          advance_amount?: number
          amount_paid?: number
          balance_due?: number
          booking_number: string
          booking_source?: string | null
          branch_id: string
          business_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          last_updated_by?: string | null
          notes?: string | null
          notion_page_id?: string | null
          occasion?: string | null
          physical_bill_number?: string | null
          pickup_completed_at?: string | null
          pickup_date: string
          rental_days?: number
          return_completed_at?: string | null
          return_date: string
          staff_notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          advance_amount?: number
          amount_paid?: number
          balance_due?: number
          booking_number?: string
          booking_source?: string | null
          branch_id?: string
          business_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number
          discount_amount?: number
          discount_reason?: string | null
          id?: string
          last_updated_by?: string | null
          notes?: string | null
          notion_page_id?: string | null
          occasion?: string | null
          physical_bill_number?: string | null
          pickup_completed_at?: string | null
          pickup_date?: string
          rental_days?: number
          return_completed_at?: string | null
          return_date?: string
          staff_notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
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
          phone: string | null
          pincode: string | null
          prefix: string
          settings: Json
          state: string | null
          status: string
          updated_at: string
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
          phone?: string | null
          pincode?: string | null
          prefix?: string
          settings?: Json
          state?: string | null
          status?: string
          updated_at?: string
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
          phone?: string | null
          pincode?: string | null
          prefix?: string
          settings?: Json
          state?: string | null
          status?: string
          updated_at?: string
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
          phone: string | null
          pincode: string | null
          plan: string
          settings: Json
          slug: string
          state: string | null
          status: string
          timezone: string
          trial_ends_at: string | null
          updated_at: string
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
          phone?: string | null
          pincode?: string | null
          plan?: string
          settings?: Json
          slug: string
          state?: string | null
          status?: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
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
          phone?: string | null
          pincode?: string | null
          plan?: string
          settings?: Json
          slug?: string
          state?: string | null
          status?: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          alternate_phone: string | null
          blacklist_reason: string | null
          blacklisted: boolean
          blacklisted_at: string | null
          blacklisted_by: string | null
          branch_id: string | null
          business_id: string
          created_at: string
          created_by: string | null
          email: string | null
          emergency_phone: string | null
          id: string
          id_number: string | null
          id_proof_url: string | null
          id_type: string | null
          name: string
          notes: string | null
          outstanding_balance: number
          phone: string
          total_bookings: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          alternate_phone?: string | null
          blacklist_reason?: string | null
          blacklisted?: boolean
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          branch_id?: string | null
          business_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_phone?: string | null
          id?: string
          id_number?: string | null
          id_proof_url?: string | null
          id_type?: string | null
          name: string
          notes?: string | null
          outstanding_balance?: number
          phone: string
          total_bookings?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          alternate_phone?: string | null
          blacklist_reason?: string | null
          blacklisted?: boolean
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          branch_id?: string | null
          business_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          emergency_phone?: string | null
          id?: string
          id_number?: string | null
          id_proof_url?: string | null
          id_type?: string | null
          name?: string
          notes?: string | null
          outstanding_balance?: number
          phone?: string
          total_bookings?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_blacklisted_by_fkey"
            columns: ["blacklisted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          added_by: string | null
          amount: number
          branch_id: string
          business_id: string
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          item_id: string | null
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          staff_id: string | null
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          amount: number
          branch_id: string
          business_id: string
          category: string
          created_at?: string
          description: string
          expense_date: string
          id?: string
          item_id?: string | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          amount?: number
          branch_id?: string
          business_id?: string
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          item_id?: string | null
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          staff_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      item_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_cover: boolean
          item_id: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          item_id: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          item_id?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      item_variants: {
        Row: {
          available_stock: number
          colour: string | null
          created_at: string
          id: string
          item_id: string
          price_override: number | null
          reserved_stock: number
          size: string
          sku: string | null
          status: string
          total_stock: number
          updated_at: string
        }
        Insert: {
          available_stock?: number
          colour?: string | null
          created_at?: string
          id?: string
          item_id: string
          price_override?: number | null
          reserved_stock?: number
          size: string
          sku?: string | null
          status?: string
          total_stock?: number
          updated_at?: string
        }
        Update: {
          available_stock?: number
          colour?: string | null
          created_at?: string
          id?: string
          item_id?: string
          price_override?: number | null
          reserved_stock?: number
          size?: string
          sku?: string | null
          status?: string
          total_stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_variants_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          branch_id: string
          business_id: string
          category: string
          completeness_score: number
          condition: string
          condition_notes: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          deposit_amount: number
          description: string | null
          id: string
          is_active: boolean
          last_rented_at: string | null
          metadata: Json
          name: string
          notion_page_id: string | null
          price: number
          purchase_cost: number | null
          purchase_date: string | null
          sku: string | null
          status: string
          storage_location: string | null
          total_rentals: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          business_id: string
          category: string
          completeness_score?: number
          condition?: string
          condition_notes?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          description?: string | null
          id?: string
          is_active?: boolean
          last_rented_at?: string | null
          metadata?: Json
          name: string
          notion_page_id?: string | null
          price?: number
          purchase_cost?: number | null
          purchase_date?: string | null
          sku?: string | null
          status?: string
          storage_location?: string | null
          total_rentals?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          category?: string
          completeness_score?: number
          condition?: string
          condition_notes?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          description?: string | null
          id?: string
          is_active?: boolean
          last_rented_at?: string | null
          metadata?: Json
          name?: string
          notion_page_id?: string | null
          price?: number
          purchase_cost?: number | null
          purchase_date?: string | null
          sku?: string | null
          status?: string
          storage_location?: string | null
          total_rentals?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
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
          success?: boolean
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
      notifications: {
        Row: {
          action_data: Json | null
          action_type: string | null
          action_url: string | null
          body: string | null
          branch_id: string | null
          business_id: string
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          target_staff_id: string | null
          title: string
          type: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          action_url?: string | null
          body?: string | null
          branch_id?: string | null
          business_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          target_staff_id?: string | null
          title: string
          type: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          action_url?: string | null
          body?: string | null
          branch_id?: string | null
          business_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          target_staff_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_staff_id_fkey"
            columns: ["target_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          staff_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          staff_id: string
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          staff_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_log: {
        Row: {
          booking_id: string | null
          branch_id: string | null
          business_id: string
          created_at: string
          customer_id: string | null
          id: string
          message: string | null
          phone: string
          provider_response: Json | null
          sent_by: string | null
          status: string
          template_id: string | null
        }
        Insert: {
          booking_id?: string | null
          branch_id?: string | null
          business_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string | null
          phone: string
          provider_response?: Json | null
          sent_by?: string | null
          status?: string
          template_id?: string | null
        }
        Update: {
          booking_id?: string | null
          branch_id?: string | null
          business_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          message?: string | null
          phone?: string
          provider_response?: Json | null
          sent_by?: string | null
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          accessible_branch_ids: string[] | null
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
          accessible_branch_ids?: string[] | null
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
          accessible_branch_ids?: string[] | null
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
        Relationships: [
          {
            foreignKeyName: "staff_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          approved_by: string | null
          branch_id: string
          business_id: string
          clock_in_at: string | null
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out_at: string | null
          created_at: string
          date: string
          distance_from_branch: number | null
          hours_worked: number | null
          id: string
          is_valid_location: boolean | null
          notes: string | null
          staff_id: string
        }
        Insert: {
          approved_by?: string | null
          branch_id: string
          business_id: string
          clock_in_at?: string | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out_at?: string | null
          created_at?: string
          date: string
          distance_from_branch?: number | null
          hours_worked?: number | null
          id?: string
          is_valid_location?: boolean | null
          notes?: string | null
          staff_id: string
        }
        Update: {
          approved_by?: string | null
          branch_id?: string
          business_id?: string
          clock_in_at?: string | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out_at?: string | null
          created_at?: string
          date?: string
          distance_from_branch?: number | null
          hours_worked?: number | null
          id?: string
          is_valid_location?: boolean | null
          notes?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_performance_targets: {
        Row: {
          bookings_target: number | null
          business_id: string
          created_at: string
          id: string
          month: string
          revenue_target: number | null
          set_by: string | null
          staff_id: string
        }
        Insert: {
          bookings_target?: number | null
          business_id: string
          created_at?: string
          id?: string
          month: string
          revenue_target?: number | null
          set_by?: string | null
          staff_id: string
        }
        Update: {
          bookings_target?: number | null
          business_id?: string
          created_at?: string
          id?: string
          month?: string
          revenue_target?: number | null
          set_by?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_performance_targets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_targets_set_by_fkey"
            columns: ["set_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_targets_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      washing_queue: {
        Row: {
          added_by: string | null
          booking_id: string | null
          branch_id: string
          business_id: string
          completed_at: string | null
          completed_by: string | null
          condition_after: string | null
          created_at: string
          id: string
          item_id: string
          item_variant_id: string | null
          next_booking_date: string | null
          notes: string | null
          priority: string
          stage: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          booking_id?: string | null
          branch_id: string
          business_id: string
          completed_at?: string | null
          completed_by?: string | null
          condition_after?: string | null
          created_at?: string
          id?: string
          item_id: string
          item_variant_id?: string | null
          next_booking_date?: string | null
          notes?: string | null
          priority?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          booking_id?: string | null
          branch_id?: string
          business_id?: string
          completed_at?: string | null
          completed_by?: string | null
          condition_after?: string | null
          created_at?: string
          id?: string
          item_id?: string
          item_variant_id?: string | null
          next_booking_date?: string | null
          notes?: string | null
          priority?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "washing_queue_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washing_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washing_queue_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washing_queue_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washing_queue_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washing_queue_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washing_queue_item_variant_id_fkey"
            columns: ["item_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_item_stock: {
        Args: {
          p_is_reservation: boolean
          p_quantity_change: number
          p_variant_id: string
        }
        Returns: undefined
      }
      cancel_booking_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
      complete_washing: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
      generate_booking_number: {
        Args: { p_branch_id: string; p_date: string }
        Returns: string
      }
      get_my_staff_info: {
        Args: never
        Returns: {
          business_id: string
          role: string
          status: string
        }[]
      }
      lock_item_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
      release_item_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
      return_item_from_booking: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
      sync_all_inventory_stock:
        | { Args: never; Returns: undefined }
        | { Args: { p_business_id: string }; Returns: undefined }
      sync_booking_financials_for_id: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      sync_inventory_stock: {
        Args: { p_variant_id: string }
        Returns: undefined
      }
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
