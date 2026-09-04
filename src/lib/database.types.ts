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
      booking_item_assets: {
        Row: {
          asset_id: string
          assigned_at: string
          assigned_by: string | null
          booking_item_id: string
          business_id: string
          released_at: string | null
          released_by: string | null
        }
        Insert: {
          asset_id: string
          assigned_at?: string
          assigned_by?: string | null
          booking_item_id: string
          business_id: string
          released_at?: string | null
          released_by?: string | null
        }
        Update: {
          asset_id?: string
          assigned_at?: string
          assigned_by?: string | null
          booking_item_id?: string
          business_id?: string
          released_at?: string | null
          released_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_item_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "inventory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_assets_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_assets_booking_item_id_fkey"
            columns: ["booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_assets_released_by_fkey"
            columns: ["released_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_item_fulfilments: {
        Row: {
          booking_id: string
          booking_item_id: string
          branch_id: string
          business_id: string
          event_type: Database["public"]["Enums"]["fulfilment_event_type"]
          id: string
          idempotency_key: string | null
          notes: string | null
          occurred_at: string
          performed_by: string | null
          quantity: number
        }
        Insert: {
          booking_id: string
          booking_item_id: string
          branch_id: string
          business_id: string
          event_type: Database["public"]["Enums"]["fulfilment_event_type"]
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          occurred_at?: string
          performed_by?: string | null
          quantity: number
        }
        Update: {
          booking_id?: string
          booking_item_id?: string
          branch_id?: string
          business_id?: string
          event_type?: Database["public"]["Enums"]["fulfilment_event_type"]
          id?: string
          idempotency_key?: string | null
          notes?: string | null
          occurred_at?: string
          performed_by?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_item_fulfilments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_fulfilments_booking_item_id_fkey"
            columns: ["booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_fulfilments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_fulfilments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_item_fulfilments_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          branch_id: string
          business_id: string
          created_at: string
          id: string
          item_id: string
          item_name: string
          item_sku: string | null
          item_variant_id: string
          picked_up_quantity: number
          price: number
          quantity: number
          rental_days: number
          replacement_value: number
          returned_quantity: number
          size: string
          substituted_from_id: string | null
          substitution_reason: string | null
          subtotal: number | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          branch_id: string
          business_id: string
          created_at?: string
          id?: string
          item_id: string
          item_name: string
          item_sku?: string | null
          item_variant_id: string
          picked_up_quantity?: number
          price: number
          quantity?: number
          rental_days: number
          replacement_value?: number
          returned_quantity?: number
          size: string
          substituted_from_id?: string | null
          substitution_reason?: string | null
          subtotal?: number | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          branch_id?: string
          business_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_name?: string
          item_sku?: string | null
          item_variant_id?: string
          picked_up_quantity?: number
          price?: number
          quantity?: number
          rental_days?: number
          replacement_value?: number
          returned_quantity?: number
          size?: string
          substituted_from_id?: string | null
          substitution_reason?: string | null
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
            foreignKeyName: "booking_items_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
          {
            foreignKeyName: "booking_items_substituted_from_id_fkey"
            columns: ["substituted_from_id"]
            isOneToOne: false
            referencedRelation: "booking_items"
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
          actual_pickup_at: string | null
          actual_return_at: string | null
          advance_amount: number
          alteration_notes: string | null
          amount_paid: number
          archived_at: string | null
          balance_due: number
          booking_number: string
          booking_source: string | null
          branch_id: string
          business_id: string
          cancellation_fee: number
          cancellation_reason: string | null
          cancelled_at: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          damage_charge: number
          deposit_amount: number
          discount_amount: number
          discount_reason: string | null
          event_date: string | null
          fitting_date: string | null
          hold_expires_at: string | null
          id: string
          last_updated_by: string | null
          late_fee: number
          notes: string | null
          occasion: string | null
          overbook_reason: string | null
          overbooked_at: string | null
          overbooked_by: string | null
          physical_bill_number: string | null
          pickup_completed_at: string | null
          pickup_date: string
          pickup_photos: string[] | null
          rental_days: number
          return_completed_at: string | null
          return_date: string
          staff_notes: string | null
          status: Database["public"]["Enums"]["rental_booking_status"]
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          actual_pickup_at?: string | null
          actual_return_at?: string | null
          advance_amount?: number
          alteration_notes?: string | null
          amount_paid?: number
          archived_at?: string | null
          balance_due?: number
          booking_number: string
          booking_source?: string | null
          branch_id: string
          business_id: string
          cancellation_fee?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          damage_charge?: number
          deposit_amount?: number
          discount_amount?: number
          discount_reason?: string | null
          event_date?: string | null
          fitting_date?: string | null
          hold_expires_at?: string | null
          id?: string
          last_updated_by?: string | null
          late_fee?: number
          notes?: string | null
          occasion?: string | null
          overbook_reason?: string | null
          overbooked_at?: string | null
          overbooked_by?: string | null
          physical_bill_number?: string | null
          pickup_completed_at?: string | null
          pickup_date: string
          pickup_photos?: string[] | null
          rental_days?: number
          return_completed_at?: string | null
          return_date: string
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["rental_booking_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          actual_pickup_at?: string | null
          actual_return_at?: string | null
          advance_amount?: number
          alteration_notes?: string | null
          amount_paid?: number
          archived_at?: string | null
          balance_due?: number
          booking_number?: string
          booking_source?: string | null
          branch_id?: string
          business_id?: string
          cancellation_fee?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          damage_charge?: number
          deposit_amount?: number
          discount_amount?: number
          discount_reason?: string | null
          event_date?: string | null
          fitting_date?: string | null
          hold_expires_at?: string | null
          id?: string
          last_updated_by?: string | null
          late_fee?: number
          notes?: string | null
          occasion?: string | null
          overbook_reason?: string | null
          overbooked_at?: string | null
          overbooked_by?: string | null
          physical_bill_number?: string | null
          pickup_completed_at?: string | null
          pickup_date?: string
          pickup_photos?: string[] | null
          rental_days?: number
          return_completed_at?: string | null
          return_date?: string
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["rental_booking_status"]
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
          {
            foreignKeyName: "bookings_overbooked_by_fkey"
            columns: ["overbooked_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_document_sequences: {
        Row: {
          branch_id: string
          business_id: string
          document_type: Database["public"]["Enums"]["financial_document_type"]
          financial_year: string
          next_number: number
          prefix: string
        }
        Insert: {
          branch_id: string
          business_id: string
          document_type: Database["public"]["Enums"]["financial_document_type"]
          financial_year: string
          next_number?: number
          prefix: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          document_type?: Database["public"]["Enums"]["financial_document_type"]
          financial_year?: string
          next_number?: number
          prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_document_sequences_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_document_sequences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          bank_details: Json
          business_id: string
          city: string | null
          created_at: string
          document_prefixes: Json
          email: string | null
          gps_radius_metres: number
          gst_number: string | null
          gst_profile_id: string | null
          id: string
          is_default: boolean
          lat: number | null
          legal_name: string | null
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
          bank_details?: Json
          business_id: string
          city?: string | null
          created_at?: string
          document_prefixes?: Json
          email?: string | null
          gps_radius_metres?: number
          gst_number?: string | null
          gst_profile_id?: string | null
          id?: string
          is_default?: boolean
          lat?: number | null
          legal_name?: string | null
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
          bank_details?: Json
          business_id?: string
          city?: string | null
          created_at?: string
          document_prefixes?: Json
          email?: string | null
          gps_radius_metres?: number
          gst_number?: string | null
          gst_profile_id?: string | null
          id?: string
          is_default?: boolean
          lat?: number | null
          legal_name?: string | null
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
          {
            foreignKeyName: "branches_gst_profile_id_fkey"
            columns: ["gst_profile_id"]
            isOneToOne: false
            referencedRelation: "gst_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_roles: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          is_owner_role: boolean
          name: string
          permissions: Json
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_owner_role?: boolean
          name: string
          permissions?: Json
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_owner_role?: boolean
          name?: string
          permissions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_roles_business_id_fkey"
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
          closure_requested_at: string | null
          closure_scheduled_at: string | null
          country: string
          created_at: string
          currency: string
          email: string | null
          gst_mode: string
          gst_number: string | null
          id: string
          locale: string
          logo_url: string | null
          name: string
          owner_id: string | null
          pan_number: string | null
          phone: string | null
          pincode: string | null
          price_tax_mode: string
          primary_colour: string | null
          settings: Json
          slug: string
          state: string | null
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          closure_requested_at?: string | null
          closure_scheduled_at?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          gst_mode?: string
          gst_number?: string | null
          id?: string
          locale?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          price_tax_mode?: string
          primary_colour?: string | null
          settings?: Json
          slug: string
          state?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          closure_requested_at?: string | null
          closure_scheduled_at?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string | null
          gst_mode?: string
          gst_number?: string | null
          id?: string
          locale?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          price_tax_mode?: string
          primary_colour?: string | null
          settings?: Json
          slug?: string
          state?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      cash_sessions: {
        Row: {
          branch_id: string
          business_date: string
          business_id: string
          closed_at: string | null
          closed_by: string | null
          counted_closing_cash: number | null
          expected_closing_cash: number | null
          id: string
          opened_at: string
          opened_by: string | null
          opening_cash: number
          status: string
          variance: number | null
          variance_reason: string | null
        }
        Insert: {
          branch_id: string
          business_date: string
          business_id: string
          closed_at?: string | null
          closed_by?: string | null
          counted_closing_cash?: number | null
          expected_closing_cash?: number | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          opening_cash?: number
          status?: string
          variance?: number | null
          variance_reason?: string | null
        }
        Update: {
          branch_id?: string
          business_date?: string
          business_id?: string
          closed_at?: string | null
          closed_by?: string | null
          counted_closing_cash?: number | null
          expected_closing_cash?: number | null
          id?: string
          opened_at?: string
          opened_by?: string | null
          opening_cash?: number
          status?: string
          variance?: number | null
          variance_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      command_receipts: {
        Row: {
          actor_id: string | null
          business_id: string
          command_name: string
          created_at: string
          id: string
          idempotency_key: string
          request_payload: Json
          response_payload: Json | null
        }
        Insert: {
          actor_id?: string | null
          business_id: string
          command_name: string
          created_at?: string
          id?: string
          idempotency_key: string
          request_payload?: Json
          response_payload?: Json | null
        }
        Update: {
          actor_id?: string | null
          business_id?: string
          command_name?: string
          created_at?: string
          id?: string
          idempotency_key?: string
          request_payload?: Json
          response_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "command_receipts_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "command_receipts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credit_entries: {
        Row: {
          amount: number
          booking_id: string | null
          branch_id: string
          business_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          entry_type: string
          id: string
          note: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          branch_id: string
          business_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          entry_type: string
          id?: string
          note?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          entry_type?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_credit_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credit_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          document_number: string | null
          document_type: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          document_number?: string | null
          document_type: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          document_number?: string | null
          document_type?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_measurements: {
        Row: {
          business_id: string
          customer_id: string
          id: string
          measured_at: string
          measured_by: string | null
          measurements: Json
          notes: string | null
        }
        Insert: {
          business_id: string
          customer_id: string
          id?: string
          measured_at?: string
          measured_by?: string | null
          measurements?: Json
          notes?: string | null
        }
        Update: {
          business_id?: string
          customer_id?: string
          id?: string
          measured_at?: string
          measured_by?: string | null
          measurements?: Json
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_measurements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_measurements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_measurements_measured_by_fkey"
            columns: ["measured_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_phones: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          is_primary: boolean
          label: string | null
          phone: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          is_primary?: boolean
          label?: string | null
          phone: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_phones_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_phones_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          archived_at: string | null
          blacklist_reason: string | null
          blacklisted: boolean
          blacklisted_at: string | null
          blacklisted_by: string | null
          branch_id: string | null
          business_id: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          id_number: string | null
          id_proof_url: string | null
          id_type: string | null
          merged_into_id: string | null
          name: string
          notes: string | null
          outstanding_balance: number
          phone: string
          preferences: Json
          profile_photo_url: string | null
          risk_status: string
          total_bookings: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          blacklist_reason?: string | null
          blacklisted?: boolean
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          branch_id?: string | null
          business_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          id_number?: string | null
          id_proof_url?: string | null
          id_type?: string | null
          merged_into_id?: string | null
          name: string
          notes?: string | null
          outstanding_balance?: number
          phone: string
          preferences?: Json
          profile_photo_url?: string | null
          risk_status?: string
          total_bookings?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          blacklist_reason?: string | null
          blacklisted?: boolean
          blacklisted_at?: string | null
          blacklisted_by?: string | null
          branch_id?: string | null
          business_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          id_number?: string | null
          id_proof_url?: string | null
          id_type?: string | null
          merged_into_id?: string | null
          name?: string
          notes?: string | null
          outstanding_balance?: number
          phone?: string
          preferences?: Json
          profile_photo_url?: string | null
          risk_status?: string
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
          {
            foreignKeyName: "customers_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      data_exports: {
        Row: {
          business_id: string
          completed_at: string | null
          created_at: string
          error: string | null
          export_type: string
          external_url: string | null
          format: string
          id: string
          requested_by: string | null
          status: string
          storage_path: string | null
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          export_type: string
          external_url?: string | null
          format: string
          id?: string
          requested_by?: string | null
          status?: string
          storage_path?: string | null
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          export_type?: string
          external_url?: string | null
          format?: string
          id?: string
          requested_by?: string | null
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_exports_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_exports_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_ledger: {
        Row: {
          amount: number
          booking_id: string
          branch_id: string
          business_id: string
          created_at: string
          created_by: string | null
          entry_type: string
          id: string
          note: string | null
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          branch_id: string
          business_id: string
          created_at?: string
          created_by?: string | null
          entry_type: string
          id?: string
          note?: string | null
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          entry_type?: string
          id?: string
          note?: string | null
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_ledger_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_ledger_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_ledger_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_ledger_created_by_fkey"
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
      financial_documents: {
        Row: {
          booking_id: string | null
          branch_id: string
          business_id: string
          created_at: string
          customer_id: string | null
          document_number: string
          document_type: Database["public"]["Enums"]["financial_document_type"]
          financial_year: string
          gst_profile_id: string | null
          id: string
          linked_document_id: string | null
          payload: Json
          place_of_supply: string | null
          posted_at: string | null
          posted_by: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_mode: string | null
          total_amount: number
        }
        Insert: {
          booking_id?: string | null
          branch_id: string
          business_id: string
          created_at?: string
          customer_id?: string | null
          document_number: string
          document_type: Database["public"]["Enums"]["financial_document_type"]
          financial_year: string
          gst_profile_id?: string | null
          id?: string
          linked_document_id?: string | null
          payload?: Json
          place_of_supply?: string | null
          posted_at?: string | null
          posted_by?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_mode?: string | null
          total_amount?: number
        }
        Update: {
          booking_id?: string | null
          branch_id?: string
          business_id?: string
          created_at?: string
          customer_id?: string | null
          document_number?: string
          document_type?: Database["public"]["Enums"]["financial_document_type"]
          financial_year?: string
          gst_profile_id?: string | null
          id?: string
          linked_document_id?: string | null
          payload?: Json
          place_of_supply?: string | null
          posted_at?: string | null
          posted_by?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_mode?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_documents_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_documents_gst_profile_id_fkey"
            columns: ["gst_profile_id"]
            isOneToOne: false
            referencedRelation: "gst_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_documents_linked_document_id_fkey"
            columns: ["linked_document_id"]
            isOneToOne: false
            referencedRelation: "financial_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_documents_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          booking_id: string | null
          branch_id: string
          business_id: string
          customer_id: string | null
          entry_type: Database["public"]["Enums"]["financial_entry_type"]
          id: string
          idempotency_key: string | null
          note: string | null
          parent_entry_id: string | null
          payment_method: string | null
          posted_at: string
          posted_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          branch_id: string
          business_id: string
          customer_id?: string | null
          entry_type: Database["public"]["Enums"]["financial_entry_type"]
          id?: string
          idempotency_key?: string | null
          note?: string | null
          parent_entry_id?: string | null
          payment_method?: string | null
          posted_at?: string
          posted_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          branch_id?: string
          business_id?: string
          customer_id?: string | null
          entry_type?: Database["public"]["Enums"]["financial_entry_type"]
          id?: string
          idempotency_key?: string | null
          note?: string | null
          parent_entry_id?: string | null
          payment_method?: string | null
          posted_at?: string
          posted_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_parent_entry_id_fkey"
            columns: ["parent_entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_profiles: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          gstin: string
          id: string
          is_active: boolean
          is_default: boolean
          legal_name: string
          name: string
          state_code: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          gstin: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          legal_name: string
          name: string
          state_code: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          gstin?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          legal_name?: string
          name?: string
          state_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "gst_profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_assets: {
        Row: {
          acquired_on: string | null
          acquisition_cost: number | null
          archived_at: string | null
          asset_code: string
          branch_id: string
          business_id: string
          created_at: string
          id: string
          item_id: string
          item_variant_id: string
          metadata: Json
          status: string
          storage_location: string | null
          updated_at: string
        }
        Insert: {
          acquired_on?: string | null
          acquisition_cost?: number | null
          archived_at?: string | null
          asset_code: string
          branch_id: string
          business_id: string
          created_at?: string
          id?: string
          item_id: string
          item_variant_id: string
          metadata?: Json
          status?: string
          storage_location?: string | null
          updated_at?: string
        }
        Update: {
          acquired_on?: string | null
          acquisition_cost?: number | null
          archived_at?: string | null
          asset_code?: string
          branch_id?: string
          business_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_variant_id?: string
          metadata?: Json
          status?: string
          storage_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_assets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_assets_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_assets_item_variant_id_fkey"
            columns: ["item_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          id: string
          inventory_asset_id: string | null
          item_id: string
          item_variant_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          note: string | null
          performed_by: string | null
          quantity_after: number | null
          quantity_before: number | null
          quantity_delta: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          id?: string
          inventory_asset_id?: string | null
          item_id: string
          item_variant_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          note?: string | null
          performed_by?: string | null
          quantity_after?: number | null
          quantity_before?: number | null
          quantity_delta: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          id?: string
          inventory_asset_id?: string | null
          item_id?: string
          item_variant_id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          note?: string | null
          performed_by?: string | null
          quantity_after?: number | null
          quantity_before?: number | null
          quantity_delta?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_asset_id_fkey"
            columns: ["inventory_asset_id"]
            isOneToOne: false
            referencedRelation: "inventory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_variant_id_fkey"
            columns: ["item_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfer_lines: {
        Row: {
          business_id: string
          destination_item_variant_id: string | null
          discrepancy_note: string | null
          id: string
          inventory_asset_id: string | null
          item_id: string
          item_variant_id: string
          quantity: number
          received_quantity: number
          transfer_id: string
        }
        Insert: {
          business_id: string
          destination_item_variant_id?: string | null
          discrepancy_note?: string | null
          id?: string
          inventory_asset_id?: string | null
          item_id: string
          item_variant_id: string
          quantity: number
          received_quantity?: number
          transfer_id: string
        }
        Update: {
          business_id?: string
          destination_item_variant_id?: string | null
          discrepancy_note?: string | null
          id?: string
          inventory_asset_id?: string | null
          item_id?: string
          item_variant_id?: string
          quantity?: number
          received_quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfer_lines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_lines_destination_item_variant_id_fkey"
            columns: ["destination_item_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_lines_inventory_asset_id_fkey"
            columns: ["inventory_asset_id"]
            isOneToOne: false
            referencedRelation: "inventory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_lines_item_variant_id_fkey"
            columns: ["item_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfer_lines_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "inventory_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfers: {
        Row: {
          business_id: string
          destination_branch_id: string
          dispatched_at: string | null
          dispatched_by: string | null
          id: string
          notes: string | null
          received_at: string | null
          received_by: string | null
          requested_at: string
          requested_by: string | null
          source_branch_id: string
          status: Database["public"]["Enums"]["rental_transfer_status"]
          transfer_number: string
        }
        Insert: {
          business_id: string
          destination_branch_id: string
          dispatched_at?: string | null
          dispatched_by?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          requested_at?: string
          requested_by?: string | null
          source_branch_id: string
          status?: Database["public"]["Enums"]["rental_transfer_status"]
          transfer_number: string
        }
        Update: {
          business_id?: string
          destination_branch_id?: string
          dispatched_at?: string | null
          dispatched_by?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          requested_at?: string
          requested_by?: string | null
          source_branch_id?: string
          status?: Database["public"]["Enums"]["rental_transfer_status"]
          transfer_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_destination_branch_id_fkey"
            columns: ["destination_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_dispatched_by_fkey"
            columns: ["dispatched_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_branch_id_fkey"
            columns: ["source_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_unavailability: {
        Row: {
          booking_item_id: string | null
          branch_id: string
          business_id: string
          id: string
          inventory_asset_id: string | null
          item_id: string
          item_variant_id: string
          notes: string | null
          quantity: number
          reason: Database["public"]["Enums"]["rental_unavailability_reason"]
          recorded_at: string
          recorded_by: string | null
          restored_at: string | null
          restored_by: string | null
          restored_quantity: number
        }
        Insert: {
          booking_item_id?: string | null
          branch_id: string
          business_id: string
          id?: string
          inventory_asset_id?: string | null
          item_id: string
          item_variant_id: string
          notes?: string | null
          quantity: number
          reason: Database["public"]["Enums"]["rental_unavailability_reason"]
          recorded_at?: string
          recorded_by?: string | null
          restored_at?: string | null
          restored_by?: string | null
          restored_quantity?: number
        }
        Update: {
          booking_item_id?: string | null
          branch_id?: string
          business_id?: string
          id?: string
          inventory_asset_id?: string | null
          item_id?: string
          item_variant_id?: string
          notes?: string | null
          quantity?: number
          reason?: Database["public"]["Enums"]["rental_unavailability_reason"]
          recorded_at?: string
          recorded_by?: string | null
          restored_at?: string | null
          restored_by?: string | null
          restored_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_unavailability_booking_item_id_fkey"
            columns: ["booking_item_id"]
            isOneToOne: false
            referencedRelation: "booking_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_unavailability_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_unavailability_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_unavailability_inventory_asset_id_fkey"
            columns: ["inventory_asset_id"]
            isOneToOne: false
            referencedRelation: "inventory_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_unavailability_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_unavailability_item_variant_id_fkey"
            columns: ["item_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_unavailability_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_unavailability_restored_by_fkey"
            columns: ["restored_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      item_bundle_components: {
        Row: {
          bundle_item_id: string
          business_id: string
          component_item_id: string
          component_variant_id: string | null
          created_at: string
          id: string
          name: string
          quantity: number
          required: boolean
        }
        Insert: {
          bundle_item_id: string
          business_id: string
          component_item_id: string
          component_variant_id?: string | null
          created_at?: string
          id?: string
          name: string
          quantity?: number
          required?: boolean
        }
        Update: {
          bundle_item_id?: string
          business_id?: string
          component_item_id?: string
          component_variant_id?: string | null
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "item_bundle_components_bundle_item_id_fkey"
            columns: ["bundle_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_bundle_components_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_bundle_components_component_item_id_fkey"
            columns: ["component_item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_bundle_components_component_variant_id_fkey"
            columns: ["component_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
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
          archived_at: string | null
          branch_id: string
          business_id: string
          created_at: string
          id: string
          item_id: string
          price_override: number | null
          size: string
          sku: string | null
          status: string
          total_stock: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          branch_id: string
          business_id: string
          created_at?: string
          id?: string
          item_id: string
          price_override?: number | null
          size: string
          sku?: string | null
          status?: string
          total_stock?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          branch_id?: string
          business_id?: string
          created_at?: string
          id?: string
          item_id?: string
          price_override?: number | null
          size?: string
          sku?: string | null
          status?: string
          total_stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_variants_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_variants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
          archived_at: string | null
          archived_by: string | null
          branch_id: string
          brand: string | null
          business_id: string
          category: string
          completeness_score: number
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          deposit_amount: number
          description: string | null
          designer: string | null
          fabric: string | null
          id: string
          is_active: boolean
          is_bundle: boolean
          last_rented_at: string | null
          measurements: Json
          metadata: Json
          name: string
          occasion: string | null
          price: number
          purchase_cost: number | null
          purchase_date: string | null
          replacement_value: number
          sku: string | null
          status: string
          storage_location: string | null
          total_rentals: number
          total_revenue: number
          tracking_mode: Database["public"]["Enums"]["inventory_tracking_mode"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          branch_id: string
          brand?: string | null
          business_id: string
          category: string
          completeness_score?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          description?: string | null
          designer?: string | null
          fabric?: string | null
          id?: string
          is_active?: boolean
          is_bundle?: boolean
          last_rented_at?: string | null
          measurements?: Json
          metadata?: Json
          name: string
          occasion?: string | null
          price?: number
          purchase_cost?: number | null
          purchase_date?: string | null
          replacement_value?: number
          sku?: string | null
          status?: string
          storage_location?: string | null
          total_rentals?: number
          total_revenue?: number
          tracking_mode?: Database["public"]["Enums"]["inventory_tracking_mode"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          branch_id?: string
          brand?: string | null
          business_id?: string
          category?: string
          completeness_score?: number
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          deposit_amount?: number
          description?: string | null
          designer?: string | null
          fabric?: string | null
          id?: string
          is_active?: boolean
          is_bundle?: boolean
          last_rented_at?: string | null
          measurements?: Json
          metadata?: Json
          name?: string
          occasion?: string | null
          price?: number
          purchase_cost?: number | null
          purchase_date?: string | null
          replacement_value?: number
          sku?: string | null
          status?: string
          storage_location?: string | null
          total_rentals?: number
          total_revenue?: number
          tracking_mode?: Database["public"]["Enums"]["inventory_tracking_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
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
      legacy_bookings_archive: {
        Row: {
          amount_paid: number | null
          archived_at: string
          booking_number: string | null
          branch_id: string | null
          business_id: string
          customer_name: string | null
          id: string
          pickup_date: string | null
          return_date: string | null
          source_payload: Json
          status: string | null
          total_amount: number | null
        }
        Insert: {
          amount_paid?: number | null
          archived_at?: string
          booking_number?: string | null
          branch_id?: string | null
          business_id: string
          customer_name?: string | null
          id: string
          pickup_date?: string | null
          return_date?: string | null
          source_payload?: Json
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          amount_paid?: number | null
          archived_at?: string
          booking_number?: string | null
          branch_id?: string | null
          business_id?: string
          customer_name?: string | null
          id?: string
          pickup_date?: string | null
          return_date?: string | null
          source_payload?: Json
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "legacy_bookings_archive_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_bookings_archive_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      message_outbox: {
        Row: {
          attempt_count: number
          booking_id: string | null
          branch_id: string | null
          business_id: string
          channel: string
          created_at: string
          customer_id: string | null
          id: string
          last_error: string | null
          next_attempt_at: string | null
          payload: Json
          provider_message_id: string | null
          recipient: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          attempt_count?: number
          booking_id?: string | null
          branch_id?: string | null
          business_id: string
          channel: string
          created_at?: string
          customer_id?: string | null
          id?: string
          last_error?: string | null
          next_attempt_at?: string | null
          payload?: Json
          provider_message_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempt_count?: number
          booking_id?: string | null
          branch_id?: string | null
          business_id?: string
          channel?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          last_error?: string | null
          next_attempt_at?: string | null
          payload?: Json
          provider_message_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_outbox_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_outbox_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_outbox_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          business_id: string
          channel: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          timing: Json
          updated_at: string
        }
        Insert: {
          body: string
          business_id: string
          channel: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          timing?: Json
          updated_at?: string
        }
        Update: {
          body?: string
          business_id?: string
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          timing?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
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
      payroll_entries: {
        Row: {
          business_id: string
          deductions: Json
          earnings: Json
          id: string
          monthly_salary: number
          net_pay: number
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payroll_run_id: string
          present_days: number
          staff_id: string
          working_days: number
        }
        Insert: {
          business_id: string
          deductions?: Json
          earnings?: Json
          id?: string
          monthly_salary?: number
          net_pay?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payroll_run_id: string
          present_days?: number
          staff_id: string
          working_days?: number
        }
        Update: {
          business_id?: string
          deductions?: Json
          earnings?: Json
          id?: string
          monthly_salary?: number
          net_pay?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payroll_run_id?: string
          present_days?: number
          staff_id?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          business_id: string
          created_at: string
          finalized_at: string | null
          finalized_by: string | null
          id: string
          month: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          month: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          month?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_price_packages: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          item_id: string | null
          name: string
          price: number
          rental_days: number
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          item_id?: string | null
          name: string
          price: number
          rental_days: number
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          item_id?: string | null
          name?: string
          price?: number
          rental_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "rental_price_packages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_price_packages_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
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
          branch_id: string | null
          business_id: string | null
          created_at: string
          email: string
          id: string
          last_login: string | null
          name: string | null
          permissions: Json
          phone: string | null
          pin_hash: string | null
          profile_photo_url: string | null
          role: string
          setup_completed: boolean
          status: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          business_id?: string | null
          created_at?: string
          email: string
          id: string
          last_login?: string | null
          name?: string | null
          permissions?: Json
          phone?: string | null
          pin_hash?: string | null
          profile_photo_url?: string | null
          role?: string
          setup_completed?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          business_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string | null
          permissions?: Json
          phone?: string | null
          pin_hash?: string | null
          profile_photo_url?: string | null
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
          attendance_status: string
          branch_id: string
          business_id: string
          created_at: string
          date: string
          gps_metadata: Json
          gps_warning: boolean
          id: string
          notes: string | null
          recorded_at: string
          staff_id: string
        }
        Insert: {
          approved_by?: string | null
          attendance_status?: string
          branch_id: string
          business_id: string
          created_at?: string
          date: string
          gps_metadata?: Json
          gps_warning?: boolean
          id?: string
          notes?: string | null
          recorded_at?: string
          staff_id: string
        }
        Update: {
          approved_by?: string | null
          attendance_status?: string
          branch_id?: string
          business_id?: string
          created_at?: string
          date?: string
          gps_metadata?: Json
          gps_warning?: boolean
          id?: string
          notes?: string | null
          recorded_at?: string
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
      staff_branch_memberships: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          is_default: boolean
          staff_id: string
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          is_default?: boolean
          staff_id: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          is_default?: boolean
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_branch_memberships_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branch_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_branch_memberships_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_role_assignments: {
        Row: {
          business_id: string
          created_at: string
          role_id: string
          staff_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          role_id: string
          staff_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          role_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_assignments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "business_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktake_lines: {
        Row: {
          business_id: string
          counted_at: string | null
          counted_by: string | null
          counted_quantity: number | null
          expected_quantity: number
          id: string
          item_variant_id: string
          note: string | null
          stocktake_id: string
        }
        Insert: {
          business_id: string
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          expected_quantity: number
          id?: string
          item_variant_id: string
          note?: string | null
          stocktake_id: string
        }
        Update: {
          business_id?: string
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity?: number | null
          expected_quantity?: number
          id?: string
          item_variant_id?: string
          note?: string | null
          stocktake_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocktake_lines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_lines_counted_by_fkey"
            columns: ["counted_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_lines_item_variant_id_fkey"
            columns: ["item_variant_id"]
            isOneToOne: false
            referencedRelation: "item_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktake_lines_stocktake_id_fkey"
            columns: ["stocktake_id"]
            isOneToOne: false
            referencedRelation: "stocktakes"
            referencedColumns: ["id"]
          },
        ]
      }
      stocktakes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          blind_count: boolean
          branch_id: string
          business_id: string
          id: string
          notes: string | null
          started_at: string
          started_by: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          blind_count?: boolean
          branch_id: string
          business_id: string
          id?: string
          notes?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          blind_count?: boolean
          branch_id?: string
          business_id?: string
          id?: string
          notes?: string | null
          started_at?: string
          started_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocktakes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktakes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktakes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocktakes_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rules: {
        Row: {
          business_id: string
          charge_type: string
          created_at: string
          hsn_sac: string | null
          id: string
          is_active: boolean
          rate: number
        }
        Insert: {
          business_id: string
          charge_type: string
          created_at?: string
          hsn_sac?: string | null
          id?: string
          is_active?: boolean
          rate?: number
        }
        Update: {
          business_id?: string
          charge_type?: string
          created_at?: string
          hsn_sac?: string | null
          id?: string
          is_active?: boolean
          rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_inventory_transfer: {
        Args: {
          p_action: string
          p_note?: string
          p_received_quantity?: number
          p_transfer_id: string
        }
        Returns: {
          business_id: string
          destination_branch_id: string
          dispatched_at: string | null
          dispatched_by: string | null
          id: string
          notes: string | null
          received_at: string | null
          received_by: string | null
          requested_at: string
          requested_by: string | null
          source_branch_id: string
          status: Database["public"]["Enums"]["rental_transfer_status"]
          transfer_number: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_transfers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      approve_stocktake: {
        Args: { p_note?: string; p_stocktake_id: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          blind_count: boolean
          branch_id: string
          business_id: string
          id: string
          notes: string | null
          started_at: string
          started_by: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "stocktakes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_inventory_transfer: {
        Args: {
          p_destination_branch_id: string
          p_item_variant_id: string
          p_note?: string
          p_quantity: number
        }
        Returns: string
      }
      get_rental_availability: {
        Args: {
          p_branch_id: string
          p_business_id: string
          p_from: string
          p_item_id?: string
          p_requested_quantity?: number
          p_to: string
          p_variant_id?: string
        }
        Returns: {
          available_quantity: number
          item_id: string
          out_quantity: number
          peak_booked: number
          physical_stock: number
          shortage_quantity: number
          size: string
          unavailable_quantity: number
          variant_id: string
        }[]
      }
      post_booking_payment: {
        Args: {
          p_amount: number
          p_booking_id: string
          p_idempotency_key?: string
          p_note?: string
          p_payment_method: string
          p_payment_type: string
          p_reference_number?: string
        }
        Returns: string
      }
      record_daily_attendance: {
        Args: {
          p_accuracy_metres?: number
          p_latitude: number
          p_longitude: number
        }
        Returns: {
          approved_by: string | null
          attendance_status: string
          branch_id: string
          business_id: string
          created_at: string
          date: string
          gps_metadata: Json
          gps_warning: boolean
          id: string
          notes: string | null
          recorded_at: string
          staff_id: string
        }
        SetofOptions: {
          from: "*"
          to: "staff_attendance"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_stocktake_counts: {
        Args: { p_counts: Json; p_stocktake_id: string }
        Returns: number
      }
      restore_unavailable_stock: {
        Args: {
          p_note?: string
          p_quantity: number
          p_unavailability_id: string
        }
        Returns: {
          booking_item_id: string | null
          branch_id: string
          business_id: string
          id: string
          inventory_asset_id: string | null
          item_id: string
          item_variant_id: string
          notes: string | null
          quantity: number
          reason: Database["public"]["Enums"]["rental_unavailability_reason"]
          recorded_at: string
          recorded_by: string | null
          restored_at: string | null
          restored_by: string | null
          restored_quantity: number
        }
        SetofOptions: {
          from: "*"
          to: "inventory_unavailability"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_stocktake: {
        Args: { p_blind_count?: boolean; p_note?: string }
        Returns: string
      }
    }
    Enums: {
      financial_document_type:
        | "quote"
        | "invoice"
        | "receipt"
        | "deposit_receipt"
        | "deposit_settlement"
        | "credit_note"
        | "debit_note"
        | "payslip"
      financial_entry_type:
        | "payment"
        | "refund"
        | "reversal"
        | "deposit_collection"
        | "deposit_refund"
        | "deposit_deduction"
        | "customer_credit"
        | "customer_credit_applied"
      fulfilment_event_type: "pickup" | "return"
      inventory_tracking_mode: "quantity" | "asset"
      rental_booking_status:
        | "draft"
        | "quote"
        | "hold"
        | "confirmed"
        | "picked_up"
        | "partially_returned"
        | "returned"
        | "closed"
        | "cancelled"
      rental_transfer_status:
        | "requested"
        | "dispatched"
        | "in_transit"
        | "received"
        | "discrepancy"
        | "cancelled"
      rental_unavailability_reason: "damaged" | "missing"
      stock_movement_type:
        | "opening"
        | "adjustment"
        | "transfer_out"
        | "transfer_in"
        | "stocktake"
        | "archive"
        | "restore"
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
      financial_document_type: [
        "quote",
        "invoice",
        "receipt",
        "deposit_receipt",
        "deposit_settlement",
        "credit_note",
        "debit_note",
        "payslip",
      ],
      financial_entry_type: [
        "payment",
        "refund",
        "reversal",
        "deposit_collection",
        "deposit_refund",
        "deposit_deduction",
        "customer_credit",
        "customer_credit_applied",
      ],
      fulfilment_event_type: ["pickup", "return"],
      inventory_tracking_mode: ["quantity", "asset"],
      rental_booking_status: [
        "draft",
        "quote",
        "hold",
        "confirmed",
        "picked_up",
        "partially_returned",
        "returned",
        "closed",
        "cancelled",
      ],
      rental_transfer_status: [
        "requested",
        "dispatched",
        "in_transit",
        "received",
        "discrepancy",
        "cancelled",
      ],
      rental_unavailability_reason: ["damaged", "missing"],
      stock_movement_type: [
        "opening",
        "adjustment",
        "transfer_out",
        "transfer_in",
        "stocktake",
        "archive",
        "restore",
      ],
    },
  },
} as const
